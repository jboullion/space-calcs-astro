function M = machFromAreaRatio(eps, gamma)
%MACHFROMAREARATIO Supersonic Mach number solving A/A* = eps
%
% Uses fzero on the standard area-Mach relation.

areaMach = @(M) (1./M) .* ((2/(gamma+1)) .* (1 + (gamma-1)/2 .* M.^2)).^((gamma+1)/(2*(gamma-1)));

f = @(M) areaMach(M) - eps;

% Supersonic initial guess
M0 = 2.5;

% Bracket search (supersonic)
Mlo = 1.0001;
Mhi = 20;

flo = f(Mlo);
fhi = f(Mhi);

if sign(flo) == sign(fhi)
    % Fallback: minimize squared residual if eps is weird
    M = fminbnd(@(x) f(x).^2, Mlo, Mhi);
else
    M = fzero(f, [Mlo, Mhi]);
end

% ensure supersonic
M = max(M, 1.0001);
end
