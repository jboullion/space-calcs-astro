// Core RK4 simulator for solid rocket motor internal ballistics
// Ports simulateMotor.m

import type { MotorConfig, SimulationOutput } from '../types';
import { evaluateGrainStack } from './geometry';
import { nozzleMassFlow, nozzleThrustFromCf } from './nozzle';
import { trapz } from './math';

const R_UNIVERSAL = 8.314462618; // J/mol-K
const G0 = 9.80665; // m/s²

interface SimState {
	x: number; // Regression depth (m)
	Pc: number; // Chamber pressure (Pa)
}

interface SimArrays {
	t: number[];
	x: number[];
	Pc: number[];
	Ab: number[];
	Vc: number[];
	rdot: number[];
	mdot_gen: number[];
	mdot_noz: number[];
	F: number[];
	Ap: number[];
	Ap_seg: number[][];
}

/**
 * Simulate solid rocket motor using fixed-step RK4 integration
 */
export function simulateMotor(config: MotorConfig): SimulationOutput {
	// Extract configuration
	const { propellant, grainStack, nozzle, caseInnerDiameter } = config;

	// Propellant properties
	const rho = propellant.density;
	const a = propellant.a;
	const n = propellant.n;
	const Tc = propellant.Tc;
	const gamma = propellant.gamma;
	const M = propellant.M;

	// Gas constant
	const Rspec = R_UNIVERSAL / M; // J/kg-K

	// Nozzle properties
	const At = (Math.PI / 4) * nozzle.throatDiameter ** 2;
	const Ae = (Math.PI / 4) * nozzle.exitDiameter ** 2;
	const eps = Ae / At;
	const Cd = nozzle.Cd;
	const Pa = nozzle.ambientPressure;

	// Numerical parameters
	const dt = 0.001; // 1ms time step
	const tmax = 30.0; // Maximum simulation time (s)

	// Minimum sustain pressure (below this, motor extinguishes)
	const Pmin = propellant.Pmin || 0;

	// Initial conditions
	const x0 = 0; // No regression at start
	const Pc0 = Pa; // Start at ambient pressure

	// Preallocate arrays (estimate max size)
	const Nmax = Math.ceil(tmax / dt) + 10;
	const arrays: SimArrays = {
		t: new Array(Nmax).fill(0),
		x: new Array(Nmax).fill(0),
		Pc: new Array(Nmax).fill(0),
		Ab: new Array(Nmax).fill(0),
		Vc: new Array(Nmax).fill(0),
		rdot: new Array(Nmax).fill(0),
		mdot_gen: new Array(Nmax).fill(0),
		mdot_noz: new Array(Nmax).fill(0),
		F: new Array(Nmax).fill(0),
		Ap: new Array(Nmax).fill(0),
		Ap_seg: Array.from({ length: Nmax }, () => new Array(grainStack.length).fill(0)),
	};

	// Set initial state
	arrays.t[0] = 0;
	arrays.x[0] = x0;
	arrays.Pc[0] = Pc0;

	// RK4 integration loop
	let k = 0;
	while (arrays.t[k] < tmax && k < Nmax - 1) {
		const geo = evaluateGrainStack(arrays.x[k], grainStack);

		arrays.Ab[k] = geo.Ab;
		arrays.Vc[k] = geo.Vc;
		arrays.Ap[k] = geo.Ap;
		if (geo.Ap_seg) {
			arrays.Ap_seg[k] = geo.Ap_seg;
		}

		// Check stopping criteria
		// Stop when grain is done AND pressure has dropped to near-ambient
		if (geo.done && arrays.Pc[k] < 1.05 * Pa) {
			break;
		}

		// Also stop if pressure dropped below sustain AND below ambient
		if (arrays.Pc[k] < Math.max(Pmin, Pa) && arrays.Pc[k] < 1.05 * Pa) {
			break;
		}

		// Calculate burn rate and mass flows
		arrays.rdot[k] = a * Math.max(arrays.Pc[k], 1.0) ** n;
		arrays.mdot_gen[k] = rho * arrays.Ab[k] * arrays.rdot[k];
		arrays.mdot_noz[k] = nozzleMassFlow(arrays.Pc[k], Cd, At, gamma, Rspec, Tc);

		// Calculate thrust using nozzle function
		arrays.F[k] = nozzleThrustFromCf(arrays.Pc[k], At, Ae, Cd, Pa, gamma);

		// RK4 integration step
		const state: SimState = { x: arrays.x[k], Pc: arrays.Pc[k] };

		const k1 = evaluateRHS(state, config, geo, rho, a, n, gamma, Rspec, Tc, Pmin, Cd, At, Pa);
		const k2 = evaluateRHS(
			addStates(state, scaleState(k1, 0.5 * dt)),
			config,
			evaluateGrainStack(state.x + 0.5 * dt * k1.x, grainStack),
			rho,
			a,
			n,
			gamma,
			Rspec,
			Tc,
			Pmin,
			Cd,
			At,
			Pa,
		);
		const k3 = evaluateRHS(
			addStates(state, scaleState(k2, 0.5 * dt)),
			config,
			evaluateGrainStack(state.x + 0.5 * dt * k2.x, grainStack),
			rho,
			a,
			n,
			gamma,
			Rspec,
			Tc,
			Pmin,
			Cd,
			At,
			Pa,
		);
		const k4 = evaluateRHS(
			addStates(state, scaleState(k3, dt)),
			config,
			evaluateGrainStack(state.x + dt * k3.x, grainStack),
			rho,
			a,
			n,
			gamma,
			Rspec,
			Tc,
			Pmin,
			Cd,
			At,
			Pa,
		);

		// Combine RK4 stages
		const dx = (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x);
		const dPc = (dt / 6) * (k1.Pc + 2 * k2.Pc + 2 * k3.Pc + k4.Pc);

		// Update state with constraints
		arrays.x[k + 1] = Math.max(arrays.x[k] + dx, arrays.x[k]); // Non-decreasing regression
		arrays.Pc[k + 1] = Math.max(arrays.Pc[k] + dPc, 0.2 * Pa); // Keep positive
		arrays.t[k + 1] = arrays.t[k] + dt;

		k++;
	}

	// Trim arrays to actual size
	const npts = k;
	const trimmedArrays = {
		t: arrays.t.slice(0, npts),
		x: arrays.x.slice(0, npts),
		Pc: arrays.Pc.slice(0, npts),
		Ab: arrays.Ab.slice(0, npts),
		Vc: arrays.Vc.slice(0, npts),
		rdot: arrays.rdot.slice(0, npts),
		mdot_gen: arrays.mdot_gen.slice(0, npts),
		mdot_noz: arrays.mdot_noz.slice(0, npts),
		F: arrays.F.slice(0, npts),
		Ap: arrays.Ap.slice(0, npts),
		Ap_seg: arrays.Ap_seg.slice(0, npts),
	};

	// Calculate performance metrics
	const Pc_peak = Math.max(...trimmedArrays.Pc);
	
	// Check if motor reached sustain pressure
	if (Pc_peak < Math.max(Pmin, Pa) * 1.001) {
		console.warn(
			'Motor did not reach sustain pressure (Pc_peak < Pmin). Expect ~0 thrust/impulse.',
		);
	}

	// Calculate total impulse
	const Itot = npts >= 2 ? trapz(trimmedArrays.t, trimmedArrays.F) : 0;

	// Estimate propellant mass consumed
	const mprop_est = npts >= 2 ? trapz(trimmedArrays.t, trimmedArrays.mdot_gen) : 0;

	// Calculate specific impulse
	const Isp = Itot / (Math.max(mprop_est, 1e-12) * G0);

	// Find burn time (when thrust drops below 5% of peak)
	const F_peak = Math.max(...trimmedArrays.F);
	const F_threshold = 0.05 * F_peak;
	let burnTime = trimmedArrays.t[npts - 1];
	for (let i = npts - 1; i >= 0; i--) {
		if (trimmedArrays.F[i] > F_threshold) {
			burnTime = trimmedArrays.t[i];
			break;
		}
	}

	// Average thrust
	const F_avg = burnTime > 0 ? Itot / burnTime : 0;

	// Calculate Kn (burn area / throat area)
	const Kn = trimmedArrays.Ab.map(Ab => Ab / At);

	// Initial and peak Kn
	const initialKn = Kn[0] || 0;
	const peakKn = Math.max(...Kn);

	// Volume loading (propellant volume / case volume)
	const geo0 = evaluateGrainStack(0, grainStack);
	const caseInnerRadius = caseInnerDiameter / 2;
	const totalGrainLength = grainStack.reduce((sum, seg) => sum + seg.length, 0);
	const caseVolume = Math.PI * caseInnerRadius ** 2 * totalGrainLength;
	const propellantVolume = caseVolume - geo0.Vc;
	const volumeLoading = propellantVolume / caseVolume;

	// Port to throat ratio (initial port area / throat area)
	const portToThroatRatio = geo0.Ap / At;

	// Peak throat mass flux
	const peakMassFlux = Math.max(...trimmedArrays.mdot_noz) / At;

	// Peak port mass flux (using minimum port area as choke point)
	let peakPortMassFlux = 0;
	for (let i = 0; i < npts; i++) {
		if (trimmedArrays.Ap[i] > 0 && trimmedArrays.mdot_noz[i] > 0) {
			const portFlux = trimmedArrays.mdot_noz[i] / trimmedArrays.Ap[i];
			peakPortMassFlux = Math.max(peakPortMassFlux, portFlux);
		}
	}

	// Motor designation (NAR/TRA class)
	const designation = getMotorDesignation(Itot, burnTime);

	return {
		t: trimmedArrays.t,
		Pc: trimmedArrays.Pc,
		F: trimmedArrays.F,
		Ab: trimmedArrays.Ab,
		Kn: Kn,
		totalImpulse: Itot,
		deliveredIsp: Isp,
		peakPressure: Pc_peak,
		peakThrust: F_peak,
		averageThrust: F_avg,
		burnTime: burnTime,
		propellantMass: mprop_est,
		volumeLoading: volumeLoading,
		initialKn: initialKn,
		peakKn: peakKn,
		portToThroatRatio: portToThroatRatio,
		peakMassFlux: peakMassFlux,
		peakPortMassFlux: peakPortMassFlux,
		designation: designation,
	};
}

/**
 * Evaluate right-hand side of ODE system
 * d/dt [x, Pc] = [rdot, dPc/dt]
 */
function evaluateRHS(
	state: SimState,
	config: MotorConfig,
	geo: ReturnType<typeof evaluateGrainStack>,
	rho: number,
	a: number,
	n: number,
	gamma: number,
	Rspec: number,
	Tc: number,
	Pmin: number,
	Cd: number,
	At: number,
	Pa: number,
): SimState {
	const { x, Pc } = state;
	const Pc_safe = Math.max(Pc, 0);

	const Ab = Math.max(geo.Ab, 0);
	const Vc = Math.max(geo.Vc, 1e-12);
	const dVdx = Math.max(geo.dVdx, 0);

	// Burning occurs if geometry is not done AND pressure is above sustain threshold
	const burning = !geo.done && Ab > 0 && Pc_safe >= Math.max(Pmin, Pa);

	let rdot = 0;
	let mdot_gen = 0;
	let dVdt = 0;

	if (burning) {
		rdot = a * Pc_safe ** n;
		mdot_gen = rho * Ab * rdot;
		dVdt = dVdx * rdot;
	}

	// Nozzle mass flow
	const mdot_noz = nozzleMassFlow(Math.max(Pc_safe, Pa), Cd, At, gamma, Rspec, Tc);

	// Pressure rate of change
	const dPc_dt = (Rspec * Tc / Vc) * (mdot_gen - mdot_noz) - (Pc_safe / Vc) * dVdt;

	return { x: rdot, Pc: dPc_dt };
}

// Helper functions for RK4 state manipulation
function scaleState(state: SimState, factor: number): SimState {
	return { x: state.x * factor, Pc: state.Pc * factor };
}

function addStates(s1: SimState, s2: SimState): SimState {
	return { x: s1.x + s2.x, Pc: s1.Pc + s2.Pc };
}

/**
 * Get NAR/TRA motor designation (e.g., "H128")
 */
function getMotorDesignation(totalImpulse: number, burnTime: number): string {
	const classLetters = [
		'1/4A', '1/2A', 'A', 'B', 'C', 'D', 'E', 'F',
		'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'
	];
	const classMaxNs = [
		0.625, 1.25, 2.5, 5, 10, 20, 40, 80,
		160, 320, 640, 1280, 2560, 5120, 10240, 20480, 40960, 81920
	];

	// Find impulse class
	let letter = 'Above P';
	for (let i = 0; i < classMaxNs.length; i++) {
		if (totalImpulse <= classMaxNs[i]) {
			letter = classLetters[i];
			break;
		}
	}

	// Average thrust
	const avgThrust = burnTime > 0 ? Math.round(totalImpulse / burnTime) : 0;

	return `${letter}${avgThrust}`;
}
