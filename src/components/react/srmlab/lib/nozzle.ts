// Nozzle flow calculations

import { bisection } from './math';

/**
 * Calculate supersonic Mach number from area ratio using isentropic flow relations
 * Ports machFromAreaRatio.m
 */
export function machFromAreaRatio(eps: number, gamma: number): number {
	// Area-Mach relation: A/A* = (1/M) * [(2/(γ+1)) * (1 + (γ-1)/2 * M²)]^[(γ+1)/(2(γ-1))]
	const areaMach = (M: number): number => {
		const term1 = 1 / M;
		const term2 = (2 / (gamma + 1)) * (1 + ((gamma - 1) / 2) * M ** 2);
		const exponent = (gamma + 1) / (2 * (gamma - 1));
		return term1 * term2 ** exponent;
	};

	// Residual function
	const f = (M: number): number => areaMach(M) - eps;

	// Supersonic regime: M > 1
	const Mlo = 1.0001;
	const Mhi = 20;

	const M = bisection(f, Mlo, Mhi, 1e-8, 100);

	// Ensure supersonic
	return Math.max(M, 1.0001);
}

/**
 * Calculate nozzle mass flow rate (choked flow)
 * Ports nozzleMassFlow.m
 */
export function nozzleMassFlow(
	Pc: number,
	Cd: number,
	At: number,
	gamma: number,
	Rspec: number,
	Tc: number,
): number {
	const term =
		Math.sqrt(gamma / (Rspec * Tc)) *
		(2 / (gamma + 1)) ** ((gamma + 1) / (2 * (gamma - 1)));
	return Cd * At * Pc * term;
}

/**
 * Calculate ideal thrust coefficient for a fixed-area nozzle
 * Ports nozzleCfIdeal.m
 */
export function nozzleCfIdeal(
	eps: number,
	gamma: number,
	Pc: number,
	Pa: number,
): number {
	// Exit Mach from area ratio (supersonic)
	const Me = machFromAreaRatio(eps, gamma);

	// Isentropic pressure ratio at exit
	const Pe_over_Pc = (1 + ((gamma - 1) / 2) * Me ** 2) ** (-gamma / (gamma - 1));

	// Momentum term (ideal)
	const term1 = (2 * gamma ** 2) / (gamma - 1);
	const term2 = (2 / (gamma + 1)) ** ((gamma + 1) / (gamma - 1));
	const term3 = 1 - Pe_over_Pc ** ((gamma - 1) / gamma);
	const Cf_mom = Math.sqrt(term1 * term2 * term3);

	// Pressure thrust term
	const Cf_pres = (Pe_over_Pc - Pa / Pc) * eps;

	return Cf_mom + Cf_pres;
}

/**
 * Calculate thrust from thrust coefficient
 * Ports nozzleThrustFromCf.m
 */
export function nozzleThrustFromCf(
	Pc: number,
	At: number,
	Cd: number,
	eps: number,
	gamma: number,
	Pa: number,
): number {
	if (Pc <= Pa) {
		return 0;
	}

	const Cf = nozzleCfIdeal(eps, gamma, Pc, Pa);
	return Cf * Pc * At;
}

/**
 * Calculate throat area from diameter
 */
export function throatArea(diameter: number): number {
	return Math.PI * (diameter / 2) ** 2;
}

/**
 * Calculate expansion ratio from throat and exit diameters
 */
export function expansionRatio(throatDiameter: number, exitDiameter: number): number {
	return (exitDiameter / throatDiameter) ** 2;
}
