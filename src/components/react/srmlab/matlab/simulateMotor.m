function out = simulateMotor(cfg)
%SIMULATEMOTORODE Fixed-step RK4 internal ballistics with chamber filling dynamics
%
% Required cfg fields:
%   cfg.prop: rho, a, n, Tc, gamma, M (kg/mol)
%   cfg.noz : At (m^2), Cd, eps (Ae/At), Pa (Pa)
%   cfg.geo : struct with geoFcn(x)-> st with Ab, Vc, dVdx, done
%   cfg.num : dt, tmax
%
% State:
%   x  = burn depth / regression variable (m)
%   Pc = chamber pressure (Pa)

cfg.prop.rho   = cfg.prop.density_kgm3;
cfg.prop.M     = cfg.prop.M_kgmol;
cfg.prop.Tc    = cfg.prop.Tc_K;

cfg.grain.free_volume_m3 = 0;        % head-end free volume
cfg.grain.inhibit_outer = true;
g0 = 9.80665;

% Unpack prop
rho   = cfg.prop.rho;
a     = cfg.prop.a;
n     = cfg.prop.n;
Tc    = cfg.prop.Tc;
gamma = cfg.prop.gamma;
M     = cfg.prop.M;

% Gas constants
R = 8.314462618;      % J/mol-K
Rspec = R / M;        % J/kg-K

% Numerics
dt = cfg.num.dt;
tmax = cfg.num.tmax;

% Initial conditions
x0  = 0;
Pc0 = cfg.noz.Pa;

% Propellant sustain pressure (Pa). If 0, burning is allowed as soon as Pc>Pa.
Pmin = 0;
if isfield(cfg,'prop') && isfield(cfg.prop,'Pmin_Pa') && isfinite(cfg.prop.Pmin_Pa)
    Pmin = cfg.prop.Pmin_Pa;
end

% Preallocate (simple)
Nmax = ceil(tmax/dt) + 5;
t  = zeros(1, Nmax);
x  = zeros(1, Nmax);
Pc = zeros(1, Nmax);

Ab   = zeros(1, Nmax);
Vc   = zeros(1, Nmax);
rdot = zeros(1, Nmax);
mdg  = zeros(1, Nmax);
mdo  = zeros(1, Nmax);
F    = zeros(1, Nmax);
Ap   = zeros(1, Nmax);
nSeg = numel(cfg.stack);
Ap_seg_hist = nan(Nmax, nSeg);

% Set initial
t(1) = 0; x(1) = x0; Pc(1) = Pc0;

k = 1;
while t(k) < tmax
    st = cfg.geo.geoFcn(x(k));

    if isfield(st,'Ap')
        Ap(k) = st.Ap;
    else
        Ap(k) = NaN;
    end

    if isfield(st,'Ap_seg')
        Ap_seg_hist(k,:) = st.Ap_seg(:).';
    end


    Ab(k) = st.Ab;
    Vc(k) = st.Vc;

    % Don't break immediately at burnout, allow blowdown.
    % Stop only when pressure is basically ambient and burning is done.
    if (st.done || (Pc(k) < max(Pmin, cfg.noz.Pa))) && Pc(k) < 1.05*cfg.noz.Pa
        break;
    end

    % Record outputs using current state
    rdot(k) = a * max(Pc(k), 1.0)^n;
    mdg(k)  = rho * Ab(k) * rdot(k);
    mdo(k) = nozzleMassFlow(Pc(k), cfg.noz.Cd, cfg.noz.At, gamma, Rspec, Tc);
    F(k) = nozzleThrustFromCf(Pc(k), cfg.noz, cfg.prop.gamma);

    % RK4 step on [x; Pc]
    yk = [x(k); Pc(k)];
    f  = @(y) rhs(y, cfg, rho, a, n, gamma, Rspec, Tc, Pmin);

    k1 = f(yk);
    k2 = f(yk + 0.5*dt*k1);
    k3 = f(yk + 0.5*dt*k2);
    k4 = f(yk + dt*k3);

    y_next = yk + (dt/6)*(k1 + 2*k2 + 2*k3 + k4);

    x(k+1)  = max(y_next(1), x(k));                 % enforce nondecreasing regression
    Pc(k+1) = max(y_next(2), 0.2*cfg.noz.Pa);       % keep positive / avoid collapse to 0
    t(k+1)  = t(k) + dt;

    k = k + 1;
end

% Trim to recorded points
npts = max(k-1,1);
t  = t(1:npts);
x  = x(1:npts);
Pc = Pc(1:npts);

Ab   = Ab(1:npts);
Vc   = Vc(1:npts);
rdot = rdot(1:npts);
mdg  = mdg(1:npts);
mdo  = mdo(1:npts);
F    = F(1:npts);
Ap   = Ap(1:npts);
Ap_seg_hist = Ap_seg_hist(1:npts,:);

Pc_pk = max(Pc);
if isfield(cfg.prop,'Pmin_Pa') && Pc_pk < max(cfg.prop.Pmin_Pa, cfg.noz.Pa)*1.001
    warning('Motor did not reach sustain pressure (Pc_peak < Pmin). Expect ~0 thrust/impulse unless throat is reduced.');
end

% Integrals
if numel(t) < 2 || numel(F) < 2
    Itot = 0;
else
    Itot = trapz(t, F);
end

if numel(t) < 2 || numel(mdg) < 2
    mprop_est = 0;
else
    mprop_est = trapz(t, mdg);
end
Isp_est = Itot / (max(mprop_est, eps) * g0);


out.t = t;
out.x = x;
out.Pc = Pc;
out.Ab = Ab;
out.Vc = Vc;
out.rdot = rdot;
out.mdot_gen = mdg;
out.mdot_noz = mdo;
out.F = F;
out.Itot = Itot;
out.mprop_est = mprop_est;
out.Isp_est = Isp_est;
out.Ap = Ap;
out.Ap_seg = Ap_seg_hist;

end

function dydt = rhs(y, cfg, rho, a, n, gamma, Rspec, Tc, Pmin)
x  = y(1);
Pc = max(y(2), 0.0); % Pa

st = cfg.geo.geoFcn(x);

Ab   = max(st.Ab, 0);
Vc   = max(st.Vc, 1e-12);
dVdx = max(st.dVdx, 0);

% Burn only if geometry is not done AND Pc is above sustain threshold.
% Use max(Pmin, Pa) so never "burn below ambient".
burning = (~st.done) && (Ab > 0) && (Pc >= max(Pmin, cfg.noz.Pa));

if burning
    rdot = a * Pc^n;
    mdot_gen = rho * Ab * rdot;
    dVdt = dVdx * rdot;
    dxdt = rdot;
else
    mdot_gen = 0;
    dVdt = 0;
    dxdt = 0;
end

% Nozzle mass flow: keep it well-behaved by using at least ambient in the choked model
mdot_noz = nozzleMassFlow(max(Pc, cfg.noz.Pa), cfg.noz.Cd, cfg.noz.At, gamma, Rspec, Tc);

% Pressure ODE
dPc_dt = (Rspec*Tc/Vc) * (mdot_gen - mdot_noz) - (Pc/Vc) * dVdt;

dydt = [dxdt; dPc_dt];
end

