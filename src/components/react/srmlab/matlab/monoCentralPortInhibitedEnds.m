function geo = monoCentralPortInhibitedEnds(cfg)
%GEO_MONOCENTRALPORT Monolithic cylindrical grain, single central port.
% Uses cfg.grain fields.

Rcase = cfg.grain.case_inner_diameter_m/2;
Ro = cfg.grain.diameter_m/2;
Ri = cfg.grain.core_diameter_m/2;
L  = cfg.grain.length_m;

V0 = cfg.grain.free_volume_m3;

Vcase  = pi*Rcase^2 * L;
Vprop0 = pi*(Ro^2 - Ri^2) * L;

geo.const.Vcase  = Vcase;
geo.const.Vprop0 = Vprop0;
geo.const.Lprop  = L;
geo.const.Rcase  = Rcase;

geo.geoFcn = @(x) evalGeo(max(x,0));

    function st = evalGeo(x)
        r = Ri + x;

        if r >= Ro
            st.Ab = 0;
            st.Ap = pi*Ro^2;
            st.Vc = V0 + pi*Ro^2*L;
            st.dVdx = 0;
            st.Vprop = 0;
            st.done = true;
            return;
        end

        % Burning area
        Ab = 0;

        % Port always burns
        Ab = Ab + 2*pi*r*L;

        % Ends inhibited
        if ~cfg.grain.inhibit_ends
            Ab = Ab + 2*pi*(Ro^2 - r^2);
        end

        % Outer inhibited
        if ~cfg.grain.inhibit_outer
            Ab = Ab + 2*pi*Ro*L;
        end

        st.Ab = Ab;
        st.Ap = pi*r^2;

        st.Vc = V0 + pi*r^2*L;
        st.dVdx = 2*pi*r*L;

        st.Vprop = pi*(Ro^2 - r^2)*L;
        st.done = false;
    end
end
