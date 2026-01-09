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
% Choose At such that initial quasi-steady Pc ~= targetPc.
% Then choose eps for optimum Pe ~= Pa (or use cfg.noz.auto.targetEps if given).

if ~isfield(cfg.noz,'auto')
    error("nozzleFromAuto:MissingAuto","cfg.noz.auto must exist for auto mode.");
end

auto = cfg.noz.auto;

Pa = cfg.noz.Pa;
Pc_tgt = auto.targetPc_Pa;

% --- Get initial geometry at x=0 ---
st0 = cfg.geo.geoFcn(0);
Ab0 = st0.Ab;

% --- Prop parameters ---
rho = cfg.prop.density_kgm3;
a   = cfg.prop.a;
n   = cfg.prop.n;

% --- Mass generation at target pressure ---
rdot_tgt = a * (Pc_tgt^n);
mdot_gen_tgt = rho * Ab0 * rdot_tgt;

% --- Nozzle choked flow coefficient term ---
M = cfg.prop.M_kgmol;
Tc = cfg.prop.Tc_K;
gamma = cfg.prop.gamma;

Rspec = 8.314462618 / M;

term = sqrt(gamma/(Rspec*Tc)) * (2/(gamma+1))^((gamma+1)/(2*(gamma-1)));

Cd = cfg.noz.Cd;
if isempty(Cd) || ~isfinite(Cd)
    Cd = 1;
end

% For choked flow: mdot = Cd * At * Pc * term
At = mdot_gen_tgt / (Cd * Pc_tgt * term);

% Apply optional guardrails
Dt = sqrt(4*At/pi);
if isfield(auto,'throat_diameter_min_m')
    Dt = max(Dt, auto.throat_diameter_min_m);
end
if isfield(auto,'throat_diameter_max_m')
    Dt = min(Dt, auto.throat_diameter_max_m);
end
At = pi*(Dt/2)^2;

cfg.noz.throat_diameter_m = Dt;
cfg.noz.At = At;

% --- Pick expansion ratio ---
% Option A: user-specified targetEps
useEps = false;
if isfield(auto,'targetEps') && isfinite(auto.targetEps) && auto.targetEps > 1
    eps = auto.targetEps;
    useEps = true;
end

% Option B: compute eps so Pe ~= Pa at design Pc (optimum expansion)
if ~useEps
    Pe_tgt = Pa;
    if isfield(auto,'Pe_target_Pa') && isfinite(auto.Pe_target_Pa) && auto.Pe_target_Pa > 0
        Pe_tgt = auto.Pe_target_Pa;
    end
    eps = areaRatioForPressureRatio(gamma, Pc_tgt/Pe_tgt);
end

cfg.noz.eps = eps;
cfg.noz.Ae  = eps * At;
cfg.noz.exit_diameter_m = sqrt(4*cfg.noz.Ae/pi);

% Default efficiencies
if ~isfield(cfg.noz,'efficiency')
    cfg.noz.efficiency = 1;
end
if ~isfield(cfg.noz,'thrust_efficiency')
    cfg.noz.thrust_efficiency = 1;
end

% Optional: compute conical lengths from half-angles if you want them for display
if isfield(cfg.noz,'divergence_half_angle_deg')
    th = deg2rad(cfg.noz.divergence_half_angle_deg);
else
    th = deg2rad(15);
    cfg.noz.divergence_half_angle_deg = 15;
end

rt = Dt/2;
re = cfg.noz.exit_diameter_m/2;
cfg.noz.divergent_length_m = (re - rt) / tan(th); % simple cone length
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
