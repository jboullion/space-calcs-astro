function st = geo_finocyl_segment(x, s)
%GEO_FINOCYL_SEGMENT Finocyl grain segment under single regression depth x.
%
% Parameters in s (meters):
%   L         : segment length
%   Ro        : outer radius (case ID/2)
%   Ri        : base inner port radius (circular core)
%   Nf        : number of fins/lobes
%   finDepth  : radial fin depth (from base Ri outward)
%   finThick  : tangential fin thickness at base radius (arc length approx)
%   inhibitEnds : if true, ends do not burn
%
% Returns st fields:
%   Ab, Vc, dVdx, Ap, done

% ---- unpack with defaults ----
L  = s.L;
Ro = s.Ro;
Ri0 = s.Ri;

if isfield(s,'Nf'), Nf = s.Nf; else, Nf = 6; end
if isfield(s,'finDepth'), finDepth0 = s.finDepth; else, finDepth0 = 0; end
if isfield(s,'finThick'), finThick0 = s.finThick; else, finThick0 = 0; end

if isfield(s,'inhibitEnds')
    inhibitEnds = logical(s.inhibitEnds);
else
    inhibitEnds = true;
end

% ---- regression depth clamped ----
x = max(x,0);

% Outer web limit: can never burn beyond Ro
web_outer = max(Ro - Ri0, 0);

% Fin features disappear once the fin depth has regressed away
finDepth = max(finDepth0 - x, 0);

% Base port radius regresses outward with x
Ri = min(Ri0 + x, Ro);

% If port reaches outer wall, done
done = (Ri >= Ro - 1e-12);

% ---- Port cross-section model (area + perimeter) ----
% Approximate finocyl port as:
% - a circular port of radius Ri
% - plus Nf rectangular "slots" of radial height finDepth and tangential width finThick

% Effective fin thickness also regresses (slots widen as surfaces regress).
% Keep it stable: th grows by 2x (two sidewalls)
finThick = max(finThick0 + 2*x, 0);

% Slot area contribution
A_slots = Nf * finDepth * finThick;

% Base circular area
A_circ = pi * Ri^2;

% Total port area
Ap = A_circ + A_slots;

% Enforce physical ceiling. port area cannot exceed case area
A_case = pi * Ro^2;
Ap = min(Ap, A_case);

% ---- Burning surface area Ab ----
% Burning surfaces:
% 1) Internal port lateral area: perimeter * L
% 2) End faces if not inhibited: 2 * port area
%
% Perimeter approximation:
% - circle perimeter + slot perimeter contributions
% Slot perimeter per slot ~ 2*finDepth + 2*finThick
P_circ = 2*pi*Ri;
P_slots = Nf * (2*finDepth + 2*finThick);

P_port = P_circ + P_slots;

Ab_lateral = P_port * L;

if inhibitEnds
    Ab_ends = 0;
else
    Ab_ends = 2 * Ap;
end

Ab = Ab_lateral + Ab_ends;

% ---- Chamber free volume in this segment ----
% Free volume equals port area * length
Vc = Ap * L;

% ---- dV/dx for chamber filling ODE ----
% Vc = Ap(x)*L, so dV/dx = (dAp/dx)*L
% dAp/dx = d(pi*Ri^2)/dx + d(A_slots)/dx
% Ri = Ri0 + x until Ro; so dRi/dx = 1 while not done
if done
    dApdx = 0;
else
    dRi = 1;

    dA_circ = 2*pi*Ri * dRi;

    % A_slots = Nf * finDepth * finThick
    % finDepth = max(finDepth0 - x, 0) so d(finDepth)/dx = -1 while finDepth>0 else 0
    if finDepth > 0
        dFinDepth = -1;
    else
        dFinDepth = 0;
    end

    % finThick = finThick0 + 2x so d(finThick)/dx = 2
    dFinThick = 2;

    dA_slots = Nf * (dFinDepth*finThick + finDepth*dFinThick);

    dApdx = dA_circ + dA_slots;

    % Keep stable and nonnegative for your ODE usage
    dApdx = max(dApdx, 0);

    % Also cap if Ap has hit case area
    if Ap >= A_case - 1e-12
        dApdx = 0;
    end
end

dVdx = dApdx * L;

% ---- return ----
st.Ab   = Ab;
st.Vc   = Vc;
st.dVdx = dVdx;
st.Ap   = Ap;
st.done = done;
end
