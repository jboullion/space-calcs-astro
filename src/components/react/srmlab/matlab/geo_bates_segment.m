function st = geo_bates_segment(x, s)
%GEO_BATES_SEGMENT BATES segment geometry with single regression depth x.
%
% Required fields in s:
%   Ri (m) initial core radius
%   Ro (m) outer radius
%   L  (m) segment length
%   inhibitEnds (logical) true if both ends inhibited

Ri = s.Ri;
Ro = s.Ro;
L  = s.L;

r = Ri + x;

if r >= Ro
    r = Ro;
    st.done = true;
    st.Ab = 0;
else
    st.done = false;

    % Port burning area (inner cylinder)
    Ab = 2*pi*r*L;

    % End faces burn if not inhibited
    if ~s.inhibitEnds
        Ab = Ab + 2*pi*(Ro^2 - r^2);
    end

    st.Ab = Ab;
end

% Port flow area
st.Ap = pi*r^2;

% Chamber free volume contribution from this segment (port volume)
st.Vc = pi*r^2 * L;

% dV/dx for this segment
st.dVdx = 2*pi*r*L;
end
