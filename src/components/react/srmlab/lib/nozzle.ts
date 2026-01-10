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

/**
 * Calculate expansion ratio for a given pressure ratio
 * Uses isentropic flow relations to find eps where Pe/Pc = pressureRatio
 * Ports areaRatioForPressureRatio.m
 */
export function areaRatioForPressureRatio(gamma: number, pressureRatio: number): number {
	// Pe/Pc = (1 + (γ-1)/2 * Me²)^(-γ/(γ-1))
	// Solve for Me
	const exponent = -(gamma - 1) / gamma;
	const Me = Math.sqrt((2 / (gamma - 1)) * (pressureRatio ** exponent - 1));

	// Calculate area ratio from Mach number
	const term1 = 1 / Me;
	const term2 = (2 / (gamma + 1)) * (1 + ((gamma - 1) / 2) * Me ** 2);
	const exp2 = (gamma + 1) / (2 * (gamma - 1));
	const eps = term1 * term2 ** exp2;

	return Math.max(eps, 1.0);
}

/**
 * Solve for steady-state chamber pressure given throat area and geometry
 * Solves: mdot_gen(Pc) - mdot_noz(Pc) - mdot_fill(Pc) = 0
 * Ports solveDesignPcForAt.m
 */
export function solveDesignPcForAt(
	At: number,
	Ab: number,
	dVdx: number,
	rho: number,
	a: number,
	n: number,
	Cd: number,
	term: number, // Choked flow term: sqrt(gamma/(R*T)) * (2/(gamma+1))^((gamma+1)/(2*(gamma-1)))
	Rspec: number,
	Tc: number,
	Pa: number,
	Pmax: number = 200e6,
): number {
	// Balance equation: mdot_gen - mdot_noz - mdot_fill = 0
	// mdot_gen = rho * Ab * a * Pc^n
	// mdot_noz = Cd * At * term * Pc
	// mdot_fill = (Pc/(R*T)) * (dVdx * a * Pc^n) = (dVdx * a / (R*T)) * Pc^(n+1)

	const coef_fill = (dVdx * a) / (Rspec * Tc);

	const f = (Pc: number): number => {
		const mdot_gen = rho * Ab * a * Pc ** n;
		const mdot_noz = Cd * At * term * Pc;
		const mdot_fill = coef_fill * Pc ** (n + 1);
		return mdot_gen - mdot_noz - mdot_fill;
	};

	// Check if there's a root above ambient
	const Plo = Pa * 1.001;
	const flo = f(Plo);

	if (flo < 0) {
		// No root above ambient
		return NaN;
	}

	// Find upper bound where f changes sign
	let Phi = Math.min(Pmax, Plo * 10);
	let fhi = f(Phi);
	let iter = 0;

	while (fhi > 0 && Phi < Pmax && iter < 20) {
		Phi = Math.min(Pmax, Phi * 2);
		fhi = f(Phi);
		iter++;
	}

	if (fhi >= 0) {
		// No sign change found
		return NaN;
	}

	// Bisection to find root
	const Pc = bisection(f, Plo, Phi, 1e-3, 50);
	return Pc;
}

/**
 * Find the burn state with maximum burning area
 * Scans through regression depth to find peak Ab
 * Ports findPeakAbState.m
 */
export function findPeakAbState(
	geoFcn: (x: number) => { Ab: number; dVdx: number; done: boolean },
	xmax: number,
): { x: number; Ab: number; dVdx: number } {
	const Ns = 600; // Sampling resolution
	const dx = xmax / Ns;

	let Ab_best = 0;
	let x_best = 0;
	let dVdx_best = 0;

	for (let i = 0; i <= Ns; i++) {
		const x = i * dx;
		const st = geoFcn(x);

		if (st.done) {
			// Geometry is burnt out, stop scanning
			break;
		}

		if (st.Ab > Ab_best) {
			Ab_best = st.Ab;
			x_best = x;
			dVdx_best = st.dVdx;
		}
	}

	return { x: x_best, Ab: Ab_best, dVdx: dVdx_best };
}

/**
 * Auto-size nozzle to maximize thrust while staying within pressure limit
 * New strategy (from MATLAB commit 1120806):
 *   1) Find burn state with maximum burning area Ab (near burnout)
 *   2) Size throat area At so quasi-steady Pc at that state equals targetPc
 *   3) Choose eps for near-optimum expansion (Pe ~ Pa)
 * 
 * This prevents pressure overshoot during burn by sizing for worst-case geometry
 */
export function autoSizeNozzle(
	config: {
		propellant: {
			density: number;
			a: number;
			n: number;
			Tc: number;
			gamma: number;
			M: number;
		};
		grainStack: Array<{
			type: string;
			length: number;
			outerRadius: number;
			innerRadius: number;
		}>;
		nozzle: {
			targetPressure: number; // Pa
			targetExpansion?: number;
			Cd: number;
			ambientPressure: number;
			throatDiameterMin?: number;
			throatDiameterMax?: number;
		};
	},
	geoFcn: (x: number) => { Ab: number; Vc: number; dVdx: number; done: boolean },
): {
	throatDiameter: number;
	exitDiameter: number;
	At: number;
	Ae: number;
	eps: number;
	warnings: string[];
} {
	const { propellant, grainStack, nozzle } = config;
	const warnings: string[] = [];

	// Constants
	const R_UNIVERSAL = 8.314462618; // J/mol-K
	const Rspec = R_UNIVERSAL / propellant.M;

	const rho = propellant.density;
	const a = propellant.a;
	const n = propellant.n;
	const Tc = propellant.Tc;
	const gamma = propellant.gamma;
	const Cd = nozzle.Cd;
	const Pa = nozzle.ambientPressure;
	const Pc_lim = nozzle.targetPressure;

	// Estimate max regression depth from grain stack
	let xmax = 0.05; // Fallback: 5 cm
	for (const seg of grainStack) {
		const webThickness = seg.outerRadius - seg.innerRadius;
		if (webThickness > 0 && isFinite(webThickness)) {
			xmax = Math.max(xmax, webThickness);
		}
	}

	// Find worst-case geometry (peak Ab)
	const peak = findPeakAbState(geoFcn, xmax);
	const Ab_pk = peak.Ab;
	const dVdx_pk = peak.dVdx;
	const x_pk = peak.x;

	if (Ab_pk <= 0 || !isFinite(Ab_pk)) {
		throw new Error('Peak Ab is nonpositive/invalid. Check grain geometry.');
	}
	if (dVdx_pk < 0 || !isFinite(dVdx_pk)) {
		throw new Error('Peak dVdx is invalid. Check geometry calculation.');
	}

	// Choked flow term
	const term =
		Math.sqrt(gamma / (Rspec * Tc)) *
		(2 / (gamma + 1)) ** ((gamma + 1) / (2 * (gamma - 1)));

	// Check if pressure limit is achievable
	// At At=0 (no throat), equilibrium is when mdot_gen = mdot_fill
	const rdot_eq = a * Pc_lim ** n;
	const mdot_gen_eq = rho * Ab_pk * rdot_eq;
	const dVdt_eq = dVdx_pk * rdot_eq;
	const mdot_fill_eq = (Pc_lim / (Rspec * Tc)) * dVdt_eq;
	const Pc_eq_At0 = mdot_gen_eq > mdot_fill_eq ? Pc_lim : Pa;

	if (Pc_eq_At0 < Pc_lim) {
		warnings.push(
			`WARNING: Requested Pc_limit = ${(Pc_lim / 6894.757).toFixed(1)} psi is ABOVE what the model can sustain even with At=0 at peak Ab.`,
		);
		warnings.push(
			`At=0 equilibrium pressure at peak Ab is ~${(Pc_eq_At0 / 6894.757).toFixed(1)} psi.`,
		);
		warnings.push(
			`Burn law + geometry (with chamber filling term) cannot support this Pc.`,
		);
	}

	// Size At for pressure limit at peak Ab
	const rdot_lim = a * Pc_lim ** n;
	const mdot_gen_lim = rho * Ab_pk * rdot_lim;
	const dVdt_lim = dVdx_pk * rdot_lim;
	const mdot_fill_lim = (Pc_lim / (Rspec * Tc)) * dVdt_lim;
	let mdot_noz_req = mdot_gen_lim - mdot_fill_lim;

	if (mdot_noz_req <= 0) {
		warnings.push(
			`At peak-Ab, mdot_gen <= mdot_fill at Pc_lim; cannot sustain Pc_lim. Using tiny mdot_noz_req.`,
		);
		mdot_noz_req = 1e-9;
	}

	const At_req = mdot_noz_req / (Cd * Pc_lim * term);
	const Dt_req = 2 * Math.sqrt(At_req / Math.PI);

	// Apply guardrails
	let Dt = Dt_req;
	let clipped = false;

	if (nozzle.throatDiameterMin && Dt < nozzle.throatDiameterMin) {
		Dt = nozzle.throatDiameterMin;
		clipped = true;
	}
	if (nozzle.throatDiameterMax && Dt > nozzle.throatDiameterMax) {
		Dt = nozzle.throatDiameterMax;
		clipped = true;
	}

	const At = Math.PI * (Dt / 2) ** 2;

	// Predict pressure at peak Ab with final throat
	const Psolve_max = Math.max(2 * Pc_lim, 200e6);
	const Pc_pred_peakAb = solveDesignPcForAt(
		At,
		Ab_pk,
		dVdx_pk,
		rho,
		a,
		n,
		Cd,
		term,
		Rspec,
		Tc,
		Pa,
		Psolve_max,
	);

	// Warn if predicted pressure is too close to ambient (negligible thrust)
	const Pc_min_useful = 1.5 * Pa;
	if (isFinite(Pc_pred_peakAb) && Pc_pred_peakAb < Pc_min_useful) {
		warnings.push(
			`WARNING: With selected throat, predicted Pc at peak Ab is only ${(Pc_pred_peakAb / 6894.757).toFixed(1)} psi (${(Pc_pred_peakAb / Pa).toFixed(2)}x ambient).`,
		);
		warnings.push(
			`Thrust will likely be negligible. Consider smaller throat or higher-pressure prop/geometry.`,
		);
	} else if (!isFinite(Pc_pred_peakAb)) {
		warnings.push(
			`NOTE: Could not predict Pc at peak Ab for selected throat (no steady root found). Thrust warning skipped.`,
		);
	}

	// Warn if guardrails prevent meeting pressure limit
	if (clipped) {
		warnings.push(
			`Pressure-limited sizing at peak Ab (x=${x_pk.toFixed(6)} m):`,
		);
		warnings.push(`Requested Pc_limit = ${(Pc_lim / 6894.757).toFixed(1)} psi`);
		warnings.push(
			`Required Dt = ${(Dt_req / 0.0254).toFixed(4)} in, but clamped to Dt = ${(Dt / 0.0254).toFixed(4)} in`,
		);

		if (nozzle.throatDiameterMin && Dt_req < nozzle.throatDiameterMin) {
			warnings.push(
				`Dt_min is too large to reach requested Pc_limit at peak Ab (Pc will be LOWER than limit).`,
			);
		} else if (nozzle.throatDiameterMax && Dt_req > nozzle.throatDiameterMax) {
			warnings.push(
				`Dt_max is too small to hold Pc to requested limit at peak Ab (Pc may EXCEED limit).`,
			);
		}
	}

	// Choose expansion ratio for near-optimum expansion
	let eps: number;
	if (nozzle.targetExpansion && nozzle.targetExpansion > 1) {
		eps = nozzle.targetExpansion;
	} else {
		// Optimize for Pe ~ Pa at Pc_lim
		const Pe_tgt = Pa;
		eps = areaRatioForPressureRatio(gamma, Pc_lim / Pe_tgt);
	}

	const Ae = eps * At;
	const De = 2 * Math.sqrt(Ae / Math.PI);

	return {
		throatDiameter: Dt,
		exitDiameter: De,
		At: At,
		Ae: Ae,
		eps: eps,
		warnings: warnings,
	};
}
