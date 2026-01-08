function s = computeMotorSummary(out, cfg)
%COMPUTEMOTORSUMMARY Compute readout metrics (robust to no-burn / short runs)

g0 = 9.80665;

% Pull histories
t  = out.t(:);
Pc = out.Pc(:);
F  = out.F(:);

Pa = cfg.noz.Pa;
At = cfg.noz.At;

% Histories required for flux calculations
mdot_noz = out.mdot_noz(:);
Ap_eff   = out.Ap(:);

% Optional per-segment port areas (stack)
if isfield(out,'Ap_seg') && ~isempty(out.Ap_seg)
    Ap_eff_seg = out.Ap_seg;
else
    Ap_eff_seg = [];
end

% Ensure all referenced histories have a common length
N = min([numel(t), numel(Pc), numel(F), numel(mdot_noz), numel(Ap_eff)]);
if isempty(N) || N < 1
    % Degenerate output, return safe zeros
    s = struct();
    s.designation     = "N/A";
    s.Itot            = 0;
    s.Isp_delivered   = 0;
    s.burnTime        = 0;
    s.volLoading      = cfg.geo.const.Vprop0 / max(cfg.geo.const.Vcase, eps);
    s.Pc_avg          = 0;
    s.Pc_peak         = 0;
    s.Kn_init         = 0;
    s.Kn_peak         = 0;
    s.Cf_ideal        = 0;
    s.Cf_delivered    = 0;
    s.mprop           = out.mprop_est;
    s.propLength      = cfg.geo.const.Lprop;
    s.portThroat      = NaN;
    s.peakMassFlux    = 0;
    s.peakPortMassFlux_kg_m2_s  = NaN;
    s.peakPortMassFlux_lb_in2_s = NaN;
    s.peakPortMassFluxSeg_kg_m2_s  = [];
    s.peakPortMassFluxSeg_lb_in2_s = [];
    return;
end

t        = t(1:N);
Pc       = Pc(1:N);
F        = F(1:N);
mdot_noz = mdot_noz(1:N);
Ap_eff   = Ap_eff(1:N);

if ~isempty(Ap_eff_seg)
    Ap_eff_seg = Ap_eff_seg(1:min(size(Ap_eff_seg,1), N), :);
    if size(Ap_eff_seg,1) < N
        % Pad with NaNs
        Ap_eff_seg(end+1:N, :) = NaN;
    end
end

% Burn time definition is from first time Pc exceeds 5% of peak to last time >5% of peak
Pc_pk = max(Pc);
th = 0.05 * Pc_pk;
i0 = find(Pc > th, 1, 'first');
i1 = find(Pc > th, 1, 'last');
if isempty(i0) || isempty(i1) || i1 < i0
    burnTime = 0;
else
    burnTime = t(i1) - t(i0);
end

% Impulse (robust to short runs / all-zero thrust)
if numel(t) < 2 || numel(F) < 2
    Itot = 0;
else
    Itot = trapz(t, F);
end

% Prop mass estimate
mprop = out.mprop_est;

% Delivered Isp
Isp_del = Itot / (max(mprop, eps) * g0);

% Avg pressure over burn window
if burnTime > 0 && numel(t) >= 2
    t_b  = t(i0:i1);
    Pc_b = Pc(i0:i1);
    if numel(t_b) < 2
        Pc_avg = mean(Pc_b);
    else
        Pc_avg = trapz(t_b, Pc_b) / max(t_b(end) - t_b(1), eps);
    end
else
    Pc_avg = mean(Pc);
end

% Peak chamber pressure
Pc_peak = Pc_pk;

% Kn = Ab/At (trim Ab to N too)
Ab = out.Ab(:);
Ab = Ab(1:min(numel(Ab), N));
if numel(Ab) < N
    Ab(end+1:N,1) = 0;
end

Kn_t    = Ab / At;
Kn_init = Kn_t(max(1, min(i0, N)));
Kn_peak = max(Kn_t);

% Port/throat ratio (use initial port area from geometry)
st0 = cfg.geo.geoFcn(0);
Ap0 = st0.Ap;
portThroat = Ap0 / At;

% Peak throat mass flux: Gt = mdot/At
if isempty(mdot_noz) || all(~isfinite(mdot_noz))
    Gt_pk = 0;
else
    Gt_pk = max(mdot_noz / At);
end

% Peak port mass flux
KG_M2_TO_LB_IN2 = 2.20462262185 / (39.3700787402^2);

% Burn-window indices clamped to [1,N]
if ~isempty(i0) && ~isempty(i1) && i1 >= i0
    i0c = max(1, min(i0, N));
    i1c = max(1, min(i1, N));
    idx = (i0c:i1c).';
else
    idx = (1:N).';
end

mask = isfinite(mdot_noz(idx)) & mdot_noz(idx) > 0 & ...
       isfinite(Ap_eff(idx))   & Ap_eff(idx) > 0 & ...
       isfinite(Pc(idx))       & Pc(idx) > Pa;

valid = idx(mask);

% Effective (series) port mass flux peak
if ~isempty(valid)
    G_eff = mdot_noz(valid) ./ Ap_eff(valid); % kg/m^2/s
    s.peakPortMassFlux_kg_m2_s  = max(G_eff);
    s.peakPortMassFlux_lb_in2_s = s.peakPortMassFlux_kg_m2_s * KG_M2_TO_LB_IN2;
else
    s.peakPortMassFlux_kg_m2_s  = NaN;
    s.peakPortMassFlux_lb_in2_s = NaN;
end

% Per-segment peak fluxes over the same valid points
if ~isempty(Ap_eff_seg) && ~isempty(valid)
    nSeg = size(Ap_eff_seg, 2);
    s.peakPortMassFluxSeg_kg_m2_s  = nan(1, nSeg);
    s.peakPortMassFluxSeg_lb_in2_s = nan(1, nSeg);

    for j = 1:nSeg
        Apj = Ap_eff_seg(valid, j);
        vj = isfinite(Apj) & Apj > 0;

        if any(vj)
            Gj = mdot_noz(valid(vj)) ./ Apj(vj); % kg/m^2/s
            s.peakPortMassFluxSeg_kg_m2_s(j)  = max(Gj);
            s.peakPortMassFluxSeg_lb_in2_s(j) = s.peakPortMassFluxSeg_kg_m2_s(j) * KG_M2_TO_LB_IN2;
        end
    end
else
    s.peakPortMassFluxSeg_kg_m2_s  = [];
    s.peakPortMassFluxSeg_lb_in2_s = [];
end

% Ideal and delivered thrust coefficients
Cf_ideal_pk = nozzleCfIdeal(cfg.noz.eps, cfg.prop.gamma, Pc_peak, cfg.noz.Pa);

% Delivered Cf: Itot / integral(Pc*At dt) (robust)
if numel(t) < 2
    den = 0;
else
    den = trapz(t, Pc * At);
end
Cf_del = Itot / max(den, eps);

% Volume loading
Vcase  = cfg.geo.const.Vcase;
Vprop0 = cfg.geo.const.Vprop0;
volLoading = Vprop0 / max(Vcase, eps);

% Motor designation (robust)
s.designation = suggestDesignation(Itot, burnTime, 0.07);

% Bundle
s.Itot = Itot;
s.Isp_delivered = Isp_del;
s.burnTime = burnTime;

s.volLoading = volLoading;

s.Pc_avg = Pc_avg;
s.Pc_peak = Pc_peak;

s.Kn_init = Kn_init;
s.Kn_peak = Kn_peak;

s.Cf_ideal = Cf_ideal_pk;
s.Cf_delivered = Cf_del;

s.mprop = mprop;
s.propLength = cfg.geo.const.Lprop;

s.portThroat = portThroat;
s.peakMassFlux = Gt_pk;

% Nozzle readout
s.noz = struct();

% Common nozzle fields (always)
s.noz.mode = "manual";
if isfield(cfg.noz,'mode'); s.noz.mode = string(cfg.noz.mode); end

s.noz.Cd  = cfg.noz.Cd;
s.noz.Pa  = cfg.noz.Pa;

% Geometry (prefer the solved areas if present)
s.noz.At  = cfg.noz.At;
s.noz.Ae  = cfg.noz.Ae;
s.noz.eps = cfg.noz.eps;

% Diameters if present
if isfield(cfg.noz,'throat_diameter_m'); s.noz.Dt_m = cfg.noz.throat_diameter_m; end
if isfield(cfg.noz,'exit_diameter_m');   s.noz.De_m = cfg.noz.exit_diameter_m;   end

% Efficiencies
s.noz.efficiency = 1;
if isfield(cfg.noz,'efficiency') && isfinite(cfg.noz.efficiency)
    s.noz.efficiency = cfg.noz.efficiency;
end

s.noz.thrust_efficiency = 1;
if isfield(cfg.noz,'thrust_efficiency') && isfinite(cfg.noz.thrust_efficiency)
    s.noz.thrust_efficiency = cfg.noz.thrust_efficiency;
end

% Auto-sizing extras (only meaningful in auto mode)
if s.noz.mode == "auto" && isfield(cfg.noz,'auto')
    a = cfg.noz.auto;

    if isfield(a,'targetPc_Pa') && isfinite(a.targetPc_Pa)
        s.noz.auto_targetPc_Pa = a.targetPc_Pa;
    end
    if isfield(a,'targetEps') && isfinite(a.targetEps)
        s.noz.auto_targetEps = a.targetEps;
    end
    if isfield(a,'Pe_target_Pa') && isfinite(a.Pe_target_Pa)
        s.noz.auto_targetPe_Pa = a.Pe_target_Pa;
    end

    % If a cone length is computed in auto sizing, include it
    if isfield(cfg.noz,'divergent_length_m') && isfinite(cfg.noz.divergent_length_m)
        s.noz.divergent_length_m = cfg.noz.divergent_length_m;
    end
    if isfield(cfg.noz,'divergence_half_angle_deg')
        s.noz.divergence_half_angle_deg = cfg.noz.divergence_half_angle_deg;
    end
end
end

function des = suggestDesignation(Itot, burnTime, tol)
% NAR/TRA-style motor designation

if nargin < 3 || isempty(tol)
    tol = 0.07;
end

% Class upper bounds in N*s (TRA/NAR HPR convention)
classLetters = { ...
    "1/4A","1/2A","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P" };
classMaxNs = [ ...
    0.625, 1.25, 2.50, 5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480, 40960, 81920 ];

% Choose class based on a conservative impulse with tolerance
I_nom = Itot * (1 - tol);

idx = find(I_nom <= classMaxNs, 1, 'first');
if isempty(idx)
    letter = "Above P";
else
    letter = classLetters{idx};
end

F_avg = Itot / max(burnTime, eps);

des = sprintf('%s%d (%.0f%%)', letter, round(F_avg), tol*100);

end
