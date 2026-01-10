function cfg = assembleNozzle(cfg)
%ASSEMBLENOZZLE Populate cfg.noz.At, cfg.noz.Ae, cfg.noz.eps from either:
% - manual nozzle geometry, or
% - auto sizing based on grain+prop targets.

mode = "manual";
if isfield(cfg,'noz') && isfield(cfg.noz,'mode')
    mode = string(cfg.noz.mode);
end

if mode == "manual"
    cfg = nozzleFromManual(cfg);
elseif mode == "auto"
    cfg = nozzleFromAuto(cfg);
else
    error("assembleNozzle:BadMode","cfg.noz.mode must be 'manual' or 'auto'.");
end
end

function cfg = nozzleFromManual(cfg)
Dt = cfg.noz.throat_diameter_m;
De = cfg.noz.exit_diameter_m;

cfg.noz.At = pi*(Dt/2)^2;
cfg.noz.Ae = pi*(De/2)^2;
cfg.noz.eps = cfg.noz.Ae / cfg.noz.At;

% keep your existing efficiency naming consistent
if ~isfield(cfg.noz,'efficiency')
    cfg.noz.efficiency = 1;
end

% optional thrust efficiency (performance loss multiplier)
if ~isfield(cfg.noz,'thrust_efficiency')
    cfg.noz.thrust_efficiency = 1;
end
end

function cfg = nozzleFromAuto(cfg)
% Auto nozzle sizing strategy (pressure-limited at worst-case geometry):
%   1) Find the burn state with maximum burning area Ab (near burnout).
%   2) Size throat area At so that quasi-steady Pc at that state equals targetPc.
%      Uses simulator-consistent steady condition including the chamber filling term.
%   3) Choose eps for near-optimum expansion (Pe ~ Pa) unless user provides targetEps.
%
% Interp: This maximizes thrust subject to Pc <= targetPc at worst case, because
% the throat is as small as possible while still meeting the upper pressure bound.

if ~isfield(cfg.noz,'auto')
    error("nozzleFromAuto:MissingAuto","cfg.noz.auto must exist for auto mode.");
end
auto = cfg.noz.auto;

Pa     = cfg.noz.Pa;
Pc_lim = auto.targetPc_Pa;

% --- Find worst-case burn state (max Ab) ---
[x_pk, st_pk] = findPeakAbState(cfg);

Ab_pk   = st_pk.Ab;
dVdx_pk = st_pk.dVdx;

if ~(isfinite(Ab_pk) && Ab_pk > 0)
    error("nozzleFromAuto:BadGeometry","Peak Ab is nonpositive/invalid. Check geoFcn / segment geometry.");
end
if ~isfinite(dVdx_pk) || dVdx_pk < 0
    error("nozzleFromAuto:BadGeometry","Peak dVdx is invalid. Check geoFcn returns st.dVdx = dVc/dx (m^2).");
end

% --- Prop parameters ---
rho   = cfg.prop.density_kgm3;
a     = cfg.prop.a;
n     = cfg.prop.n;
Tc    = cfg.prop.Tc_K;
gamma = cfg.prop.gamma;
M     = cfg.prop.M_kgmol;

% Gas constant
Rspec = 8.314462618 / M;     % J/kg-K (M is kg/mol)

% Choked-flow coefficient term (same as nozzleMassFlow)
term = sqrt(gamma/(Rspec*Tc)) * (2/(gamma+1))^((gamma+1)/(2*(gamma-1)));

Cd = cfg.noz.Cd;
if isempty(Cd) || ~isfinite(Cd)
    Cd = 1;
end

% ===== Feasibility check: can the model reach Pc_lim even with At -> 0? =====
% For At=0, steady condition reduces to mdot_gen = mdot_fill:
%   rho*Ab*a*Pc^n = (Pc/(R*T))*(dVdx*a*Pc^n)
% Cancel a*Pc^n -> Pc_eq_At0 = rho*Ab*R*T / dVdx

Pc_eq_At0 = (rho * Ab_pk * Rspec * Tc) / max(dVdx_pk, realmin);

if Pc_lim > Pc_eq_At0
    fprintf("\n[nozzle auto] WARNING: Requested peak Pc_limit = %.1f psi is ABOVE what the model can sustain even with At=0 at peak Ab.\n", ...
        Pc_lim/6894.757);
    fprintf("[nozzle auto] At=0 equilibrium pressure at peak Ab is ~%.1f psi.\n", Pc_eq_At0/6894.757);
    fprintf("[nozzle auto] Burn law + geometry (with chamber filling term) cannot support this Pc.\n");
end

% --- Size At so Pc at peak-Ab state equals Pc_lim (steady condition) ---
% Burn rate at pressure limit:
rdot_lim = a * (Pc_lim^n);

% Mass generation at peak-Ab:
mdot_gen_lim = rho * Ab_pk * rdot_lim;       % kg/s

% Chamber filling mass-equivalent term (from your pressure ODE steady condition):
% mdot_fill = (Pc/(R*T)) * dVdt, and dVdt = dVdx * rdot
dVdt_lim      = dVdx_pk * rdot_lim;                          % m^3/s
mdot_fill_lim = (Pc_lim/(Rspec*Tc)) * dVdt_lim;              % kg/s

% Required nozzle flow at steady Pc:
mdot_noz_req = mdot_gen_lim - mdot_fill_lim;

% If this is <= 0, your model says pressure cannot be sustained at Pc_lim
% even with At -> 0 (physically means the filling term dominates).
if mdot_noz_req <= 0
    warning("nozzleFromAuto:UnachievableLimit", ...
        "At peak-Ab, mdot_gen <= mdot_fill at Pc_lim; cannot sustain Pc_lim. Using tiny mdot_noz_req.");
    mdot_noz_req = 1e-9;
end

% Choked flow: mdot_noz = Cd * At * Pc * term
At_req = mdot_noz_req / (Cd * Pc_lim * term);

% --- Apply throat guardrails (manufacturability) ---
Dt_req = sqrt(4*At_req/pi);

Dt = Dt_req;
Dt_min = -inf;
Dt_max = inf;

if isfield(auto,'throat_diameter_min_m') && isfinite(auto.throat_diameter_min_m)
    Dt_min = auto.throat_diameter_min_m;
    Dt = max(Dt, Dt_min);
end
if isfield(auto,'throat_diameter_max_m') && isfinite(auto.throat_diameter_max_m)
    Dt_max = auto.throat_diameter_max_m;
    Dt = min(Dt, Dt_max);
end

At = pi*(Dt/2)^2;
clipped = abs(Dt - Dt_req) > 0;

% Persist throat geometry
cfg.noz.throat_diameter_m = Dt;
cfg.noz.At = At;

% ===== Warning: predicted pressure too close to ambient -> negligible thrust =====
% Predict quasi-steady Pc at the peak-Ab state with the FINAL (possibly clamped) throat.
% If Pc stays close to ambient, thrust will be negligible in this model.

Psolve_max = max(2*Pc_lim, 200e6);  % numerical ceiling for solver, not burn-law validity
Pc_pred_peakAb = solveDesignPcForAt(At, Ab_pk, dVdx_pk, ...
    rho, a, n, Cd, term, Rspec, Tc, Pa, Psolve_max);

% Choose criterion: "too close to ambient"
Pc_min_useful = 1.5 * Pa;   % tweak: 1.2–2.0*Pa depending on how strict you want

if isfinite(Pc_pred_peakAb) && Pc_pred_peakAb < Pc_min_useful
    fprintf("\n[nozzle auto] WARNING: With the selected throat, predicted Pc at peak Ab is only %.1f psi (%.2f x ambient).\n", ...
        Pc_pred_peakAb/6894.757, Pc_pred_peakAb/Pa);
    fprintf("[nozzle auto] Thrust will likely be negligible. Consider a smaller throat (lower Dt_max) or a higher-pressure prop/geometry.\n");
elseif ~isfinite(Pc_pred_peakAb)
    fprintf("\n[nozzle auto] NOTE: Could not predict Pc at peak Ab for the selected throat (no steady root found). Thrust warning skipped.\n");
end

% Optional: message if guardrails prevent meeting the pressure limit at peak Ab
if clipped
    fprintf("\n[nozzle auto] Pressure-limited sizing at peak Ab (x=%.6g m):\n", x_pk);
    fprintf("[nozzle auto] Requested Pc_limit = %.1f psi\n", Pc_lim/6894.757);
    fprintf("[nozzle auto] Required Dt = %.4f in, but clamped to Dt = %.4f in\n", Dt_req/0.0254, Dt/0.0254);

    % Predict what steady Pc would be at peak Ab with the clamped At (no root finder needed):
    % We can solve the steady condition for Pc approximately by fixed-point / fzero, but
    % to keep this drop-in minimal, we just warn that Pc_limit won't be met exactly.
    if Dt_req < Dt_min
        fprintf("[nozzle auto] Dt_min is too large to reach the requested Pc_limit at peak Ab (Pc will be LOWER than limit).\n");
    elseif Dt_req > Dt_max
        fprintf("[nozzle auto] Dt_max is too small to hold Pc to the requested limit at peak Ab (Pc may EXCEED limit).\n");
    end
end

% --- Pick expansion ratio to maximize thrust at Pc_limit (usually Pe ~ Pa) ---
useEps = false;
if isfield(auto,'targetEps') && isfinite(auto.targetEps) && auto.targetEps > 1
    eps = auto.targetEps;
    useEps = true;
end

if ~useEps
    Pe_tgt = Pa;
    if isfield(auto,'Pe_target_Pa') && isfinite(auto.Pe_target_Pa) && auto.Pe_target_Pa > 0
        Pe_tgt = auto.Pe_target_Pa;
    end
    eps = areaRatioForPressureRatio(gamma, Pc_lim/Pe_tgt);
end

cfg.noz.eps = eps;
cfg.noz.Ae  = eps * At;
cfg.noz.exit_diameter_m = sqrt(4*cfg.noz.Ae/pi);

% Default efficiencies
if ~isfield(cfg.noz,'efficiency'); cfg.noz.efficiency = 1; end
if ~isfield(cfg.noz,'thrust_efficiency'); cfg.noz.thrust_efficiency = 1; end

% Optional: compute conical length
if isfield(cfg.noz,'divergence_half_angle_deg')
    th = deg2rad(cfg.noz.divergence_half_angle_deg);
else
    th = deg2rad(15);
    cfg.noz.divergence_half_angle_deg = 15;
end

rt = Dt/2;
re = cfg.noz.exit_diameter_m/2;
cfg.noz.divergent_length_m = (re - rt) / tan(th);

% Stash for summary/debug (helpful)
cfg.noz.auto.design_x_peakAb_m = x_pk;
cfg.noz.auto.Ab_peak_m2        = Ab_pk;
cfg.noz.auto.dVdx_peak_m2      = dVdx_pk;
end

function [x_pk, st_pk] = findPeakAbState(cfg)
% Find the state (x) with maximum burning area Ab before burnout.
% Uses cfg.stack to estimate a reasonable x range, then samples geoFcn.

if ~isfield(cfg,'geo') || ~isfield(cfg.geo,'geoFcn')
    error("findPeakAbState:MissingGeo","cfg.geo.geoFcn must exist before calling nozzleFromAuto.");
end

% Estimate max regression depth from segments if possible
xmax = NaN;
if isfield(cfg,'stack') && ~isempty(cfg.stack)
    w = inf;
    for i = 1:numel(cfg.stack)
        s = cfg.stack{i};
        if isfield(s,'Ro') && isfield(s,'Ri') && isfinite(s.Ro) && isfinite(s.Ri)
            w = min(w, s.Ro - s.Ri);
        end
    end
    if isfinite(w) && w > 0
        xmax = w;
    end
end
if ~isfinite(xmax) || xmax <= 0
    xmax = 0.05; % fallback: 5 cm regression depth
end

Ns = 600; % sampling resolution
xs = linspace(0, xmax, Ns);

Ab_best = -inf;
x_best  = 0;
st_best = struct('Ab',NaN,'Vc',NaN,'dVdx',NaN,'done',false);

for j = 1:numel(xs)
    x = xs(j);
    st = cfg.geo.geoFcn(x);

    if isfield(st,'done') && st.done
        % Once done, the geometry beyond this is not meaningful. Stop scanning.
        break;
    end

    if ~isfield(st,'Ab') || ~isfield(st,'dVdx')
        error("findPeakAbState:BadGeoFcn","geoFcn must return st.Ab and st.dVdx.");
    end

    if isfinite(st.Ab) && st.Ab > Ab_best
        Ab_best = st.Ab;
        x_best  = x;
        st_best = st;
    end
end

x_pk = x_best;
st_pk = st_best;
end

function eps = areaRatioForPressureRatio(gamma, Pr)
% Solve for eps given Pr = Pc/Pe assuming isentropic nozzle.
% We solve for Me from Pr, then eps from area-Mach relation.

% Pc/Pe = (1 + (g-1)/2 * Me^2)^(g/(g-1))
g = gamma;
Me2 = (2/(g-1)) * (Pr^((g-1)/g) - 1);
Me = sqrt(max(Me2, 1e-12));

eps = (1/Me) * ((2/(g+1))*(1 + (g-1)/2*Me^2))^((g+1)/(2*(g-1)));
end

function Pc = solveDesignPcForAt(At, Ab, dVdx, rho, a, n, Cd, term, Rspec, Tc, Pa, Pmax)
% Solve for Pc > Pa such that:
% mdot_gen(Pc) - mdot_noz(Pc) - mdot_fill(Pc) = 0
%
% mdot_gen = rho*Ab*a*Pc^n
% mdot_noz = Cd*At*term*Pc
% mdot_fill = (Pc/(R*T))*(dVdx*a*Pc^n) = (dVdx*a/(R*T))*Pc^(n+1)

if nargin < 13 || isempty(Pmax) || ~isfinite(Pmax)
    Pmax = 200e6;
end

Kgen  = rho * Ab * a;                 % multiplies Pc^n
Knoz  = Cd  * At * term;              % multiplies Pc
Kfill = (dVdx * a) / (Rspec * Tc);    % multiplies Pc^(n+1)

f = @(P) Kgen .* (P.^n) - Knoz .* P - Kfill .* (P.^(n+1));

% Bracket root above ambient
Plo = max(Pa * 1.0001, 1.0);
flo = f(Plo);

% If already negative at just above ambient, no root above ambient in this model
if flo < 0
    Pc = NaN;
    return;
end

Phi = min(Pmax, Plo * 10);
fhi = f(Phi);
iter = 0;
while fhi > 0 && Phi < Pmax
    Phi = min(Pmax, Phi * 2);
    fhi = f(Phi);
    iter = iter + 1;
    if iter > 80
        break;
    end
end

if fhi > 0
    % Could not find sign change
    Pc = NaN;
    return;
end

Pc = fzero(f, [Plo, Phi]);
end
