function Cf = nozzleCfIdeal(eps, gamma, Pc, Pa)
%NOZZLECFIDEAL Ideal isentropic thrust coefficient for a fixed-area nozzle
% eps  = Ae/At
% gamma = specific heat ratio
% Pc, Pa in Pa (scalars or vectors same size)
%
% Returns Cf such that F = Cf * Pc * At

% Exit Mach from area ratio (supersonic)
Me = machFromAreaRatio(eps, gamma);

% Isentropic pressure ratio at exit
Pe_over_Pc = (1 + (gamma-1)/2 * Me^2)^(-gamma/(gamma-1));

% Momentum term (ideal)
term1 = (2*gamma^2/(gamma-1)) * (2/(gamma+1))^((gamma+1)/(gamma-1));
term2 = 1 - Pe_over_Pc^((gamma-1)/gamma);
Cf_mom = sqrt(term1 * term2);

% Pressure thrust term
Cf_pres = (Pe_over_Pc - (Pa./Pc)) * eps;

Cf = Cf_mom + Cf_pres;
end
