function d = deriveMotorFields(cfg)
%DERIVEMOTORFIELDS Compute fields.

% Geometry
Rt = cfg.noz.throat_diameter_m/2;
Re = cfg.noz.exit_diameter_m/2;

At = pi*Rt^2;
Ae = pi*Re^2;

d.noz.At = At;
d.noz.Ae = Ae;
d.noz.eps = Ae/At;  % expansion ratio

% Characteristic velocity c* from ideal-gas relations
R = 8.314462618;                % J/mol-K
Rspec = R / cfg.prop.M_kgmol;    % J/kg-K
g = cfg.prop.gamma;

term = (2/(g+1))^((g+1)/(2*(g-1)));
d.prop.cstar_ideal = sqrt(Rspec * cfg.prop.Tc_K) / (g * term);

end
