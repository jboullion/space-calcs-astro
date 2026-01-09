function validateMotorConfig(cfg)
%VALIDATEMOTORCONFIG Validate config.
% If cfg.stack exists, grain geometry is defined by the stack and cfg.grain.diameter_m etc.
% are not required.

mustHave(cfg, "prop");
mustHave(cfg, "noz");
mustHave(cfg, "num");
mustHave(cfg, "grain");

% --- motor container requirements ---
mustBeFinitePositive(cfg.grain.case_inner_diameter_m, "grain.case_inner_diameter_m");
mustBeFiniteNonnegative(cfg.grain.free_volume_m3, "grain.free_volume_m3");

% --- nozzle requirements (diameters; At/eps derived elsewhere) ---
mustBeFinitePositive(cfg.noz.throat_diameter_m, "noz.throat_diameter_m");
mustBeFinitePositive(cfg.noz.exit_diameter_m, "noz.exit_diameter_m");
mustBeFinitePositive(cfg.noz.Cd, "noz.Cd");
mustBeFiniteNonnegative(cfg.noz.Pa, "noz.Pa");

% --- propellant requirements ---
mustBeFinitePositive(cfg.prop.density_kgm3, "prop.density_kgm3");
mustBeFinitePositive(cfg.prop.a, "prop.a");
mustBeFinitePositive(cfg.prop.Tc_K, "prop.Tc_K");
mustBeFinitePositive(cfg.prop.gamma, "prop.gamma");
mustBeFinitePositive(cfg.prop.M_kgmol, "prop.M_kgmol");
mustBeFiniteNonnegative(cfg.prop.n, "prop.n");

% --- stack requirements ---
if isfield(cfg, "stack") && ~isempty(cfg.stack)
    if ~iscell(cfg.stack)
        error("cfg.stack must be a cell array of segment structs.");
    end

    % Validate each segment
    maxRo = 0;
    for i = 1:numel(cfg.stack)
        s = cfg.stack{i};
        if ~isstruct(s) || ~isfield(s, "type")
            error("Each cfg.stack{i} must be a struct with field 'type'.");
        end

        mustHaveField(s, "L",  sprintf("stack{%d}.L",  i));
        mustHaveField(s, "Ro", sprintf("stack{%d}.Ro", i));
        mustHaveField(s, "Ri", sprintf("stack{%d}.Ri", i));

        mustBeFinitePositive(s.L,  sprintf("stack{%d}.L",  i));
        mustBeFinitePositive(s.Ro, sprintf("stack{%d}.Ro", i));
        mustBeFinitePositive(s.Ri, sprintf("stack{%d}.Ri", i));

        if s.Ri >= s.Ro
            error("stack{%d}: Ri must be < Ro.", i);
        end

        if isfield(s, "inhibitEnds")
            if ~islogical(s.inhibitEnds) && ~(isnumeric(s.inhibitEnds) && isscalar(s.inhibitEnds))
                error("stack{%d}.inhibitEnds must be logical.", i);
            end
        end

        maxRo = max(maxRo, s.Ro);
    end

    % Check case ID can contain the largest segment OD
    if cfg.grain.case_inner_diameter_m < 2*maxRo
        error("grain.case_inner_diameter_m (%.6g m) is smaller than max segment OD (%.6g m).", ...
              cfg.grain.case_inner_diameter_m, 2*maxRo);
    end

else
    % Backward compatibility: monolithic grain mode
    mustBeFinitePositive(cfg.grain.diameter_m, "grain.diameter_m");
    mustBeFinitePositive(cfg.grain.length_m, "grain.length_m");
    mustBeFinitePositive(cfg.grain.core_diameter_m, "grain.core_diameter_m");
end
end

% ---- helpers ----
function mustHave(s, name)
if ~isfield(s, name)
    error("Missing required field cfg.%s", name);
end
end

function mustHaveField(s, name, label)
if ~isfield(s, name)
    error("Missing required field %s", label);
end
end

function mustBeFinitePositive(x, label)
if ~isscalar(x) || ~isfinite(x) || x <= 0
    error("%s must be finite and > 0", label);
end
end

function mustBeFiniteNonnegative(x, label)
if ~isscalar(x) || ~isfinite(x) || x < 0
    error("%s must be finite and >= 0", label);
end
end
