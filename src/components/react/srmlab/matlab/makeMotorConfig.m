function cfg = makeMotorConfig()
%MAKEMOTORCONFIG Returns a config struct

cfg.meta.name = "";
cfg.meta.notes = "";

% Grain
cfg.grain.diameter_m = NaN;         % grain OD (m)
cfg.grain.length_m = NaN;           % grain length (m)
cfg.grain.core_diameter_m = NaN;    % port ID (m)
cfg.grain.inhibit_ends = true;      
cfg.grain.inhibit_outer = true;
cfg.grain.case_inner_diameter_m = NaN; % for volume loading (m)
cfg.grain.free_volume_m3 = 0;       % head-end/nozzle cavity

% Nozzle
cfg.noz.throat_diameter_m = NaN;
cfg.noz.exit_diameter_m = NaN;
cfg.noz.efficiency = NaN;
cfg.noz.divergence_half_angle_deg = NaN;
cfg.noz.convergence_half_angle_deg = NaN;
cfg.noz.throat_length_m = NaN;
cfg.noz.slag_buildup_coeff = 0;     % model-dependent; keep 0 initially
cfg.noz.throat_erosion_coeff = 0;   % model-dependent; keep 0 initially
cfg.noz.Cd = NaN;                   % discharge coeff
cfg.noz.Pa = 101325;                % ambient pressure (Pa)

% --- Propellant ---
cfg.prop.name = "";
cfg.prop.density_kgm3 = NaN;
cfg.prop.Pmin_Pa = NaN;
cfg.prop.Pmax_Pa = NaN;
cfg.prop.a = NaN;                   % burn rate coefficient
cfg.prop.n = NaN;                   % pressure exponent
cfg.prop.gamma = NaN;               % specific heat ratio
cfg.prop.Tc_K = NaN;                % chamber temperature
cfg.prop.M_kgmol = NaN;             % exhaust molar mass

% --- Numerics ---
cfg.num.dt = NaN;
cfg.num.tmax = NaN;
cfg.num.burn_threshold_frac = 0.05; % for burn time definition

end
