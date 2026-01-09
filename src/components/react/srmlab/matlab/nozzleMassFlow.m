function mdot = nozzleMassFlow(Pc, Cd, At, gamma, Rspec, Tc)
term = sqrt(gamma/(Rspec*Tc)) * (2/(gamma+1))^((gamma+1)/(2*(gamma-1)));
mdot = Cd * At * Pc .* term;
end