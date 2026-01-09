function printMotorSummary(s)
fprintf('\n=== Motor Summary (%s) ===\n', s.designation);
fprintf('Total Impulse (N·s):          %.1f\n', s.Itot);
fprintf('Delivered Isp (s):            %.2f\n', s.Isp_delivered);
fprintf('Burn time (s):                %.3f\n', s.burnTime);
fprintf('Volume loading (Vprop/Vcase): %.3f\n', s.volLoading);
fprintf('Avg chamber pressure (psi):   %.3f\n', ((s.Pc_avg/1e6)*145.038));
fprintf('Peak chamber pressure (psi):  %.3f\n', ((s.Pc_peak/1e6)*145.038));
fprintf('Initial Kn:                   %.3f\n', s.Kn_init);
fprintf('Peak Kn:                      %.3f\n', s.Kn_peak);
fprintf('Ideal Cf (at peak Pc):        %.3f\n', s.Cf_ideal);
fprintf('Delivered Cf:                 %.3f\n', s.Cf_delivered);
fprintf('Prop mass (kg):               %.4f\n', s.mprop);
fprintf('Prop length (m):              %.3f\n', s.propLength);
fprintf('Port/Throat area ratio:       %.3f\n', s.portThroat);
fprintf('Peak port mass flux (kg/m2s): %.1f\n', s.peakPortMassFlux_kg_m2_s);
fprintf('Peak port mass flux (lb/in2*s): %.2f\n', s.peakPortMassFlux_lb_in2_s);

if isfield(s,'peakPortMassFlux_GN_tag') && s.peakPortMassFlux_GN_tag > 0
    fprintf('Peak mass flux (G:%d): %.2f lb/(in^2*s)\n', ...
        s.peakPortMassFlux_GN_tag, s.peakPortMassFlux_GN_lb_in2_s);
end

if isfield(s,'peakPortMassFluxSeg_lb_in2_s') && ~isempty(s.peakPortMassFluxSeg_lb_in2_s)
    for i = 1:numel(s.peakPortMassFluxSeg_lb_in2_s)
        fprintf('Peak mass flux seg %d (lb/in2*s): %.2f\n', ...
            i, s.peakPortMassFluxSeg_lb_in2_s(i));
    end
end
fprintf('===========================\n\n');
% ===== Nozzle Summary =====
if isfield(s,'noz') && ~isempty(s.noz)
    nz = s.noz;

    fprintf('\n--- Nozzle Summary (%s) ---\n', nz.mode);

    fprintf('At (m^2):    %.4e\n', nz.At);
    fprintf('Ae (m^2):    %.4e\n', nz.Ae);
    fprintf('eps (Ae/At): %.4f\n', nz.eps);

    if isfield(nz,'Dt_m'); fprintf('Dt (in):      %.6f\n', nz.Dt_m*39.3701); end
    if isfield(nz,'De_m'); fprintf('De (in):      %.6f\n', nz.De_m*39.3701); end

    fprintf('Cd:          %.4f\n', nz.Cd);
    fprintf('eta (noz):   %.4f\n', nz.efficiency);
    fprintf('eta (thrust):%.4f\n', nz.thrust_efficiency);

    if nz.mode == "auto"
        if isfield(nz,'auto_targetPc_Pa')
            fprintf('Auto target Pc (Pa): %.3e\n', nz.auto_targetPc_Pa);
        end
        if isfield(nz,'auto_targetPe_Pa')
            fprintf('Auto target Pe (Pa): %.3e\n', nz.auto_targetPe_Pa);
        end
        if isfield(nz,'auto_targetEps')
            fprintf('Auto target eps:     %.4f\n', nz.auto_targetEps);
        end
        if isfield(nz,'divergence_half_angle_deg') && isfield(nz,'divergent_length_m')
            fprintf('Cone: half-angle %.2f deg, length %.4f in\n', ...
                nz.divergence_half_angle_deg, nz.divergent_length_m*39.3701);
        end
    end

    fprintf('===========================\n\n');
end

end
