function F = nozzleThrustFromCf(Pc, noz, gamma)
%NOZZLETHRUSTFROMCF Thrust from ideal Cf with optional performance losses.
%
% Inputs:
%   Pc    : chamber pressure (Pa) (scalar or vector)
%   noz   : nozzle struct with fields:
%           Pa (Pa), At (m^2), eps, efficiency (optional), thrust_efficiency (optional)
%   gamma : specific heat ratio
%
% Output:
%   F     : thrust (N), same size as Pc

% Clamp for Cf evaluation (avoid Pc < Pa giving weird ratios)
Pc_eff = max(Pc, noz.Pa);

% Ideal thrust coefficient (isentropic), evaluated at Pc_eff
Cf = nozzleCfIdeal(noz.eps, gamma, Pc_eff, noz.Pa);

% Combine efficiency terms (backward compatible)
eta = 1;
if isfield(noz,'efficiency') && isfinite(noz.efficiency)
    eta = eta .* noz.efficiency;
end
if isfield(noz,'thrust_efficiency') && isfinite(noz.thrust_efficiency)
    eta = eta .* noz.thrust_efficiency;
end

% Thrust
F = eta .* Cf .* Pc_eff .* noz.At;

% No forward thrust when chamber pressure is at/below ambient
F(Pc <= noz.Pa) = 0;

end

