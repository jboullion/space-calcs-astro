// Geometry calculations for grain segments

import type { GrainSegment } from '../types';

export interface GeometryResult {
	Ab: number; // Burn area (m²)
	Vc: number; // Chamber volume (m³)
	dVdx: number; // dV/dx for ODE integration
	Ap: number; // Port area (m²)
	done: boolean; // True if grain is fully burned
}

/**
 * BATES segment geometry calculation
 * Ports geo_bates_segment.m
 */
export function geoBatesSegment(x: number, segment: GrainSegment): GeometryResult {
	const { innerRadius, outerRadius, length, inhibitEnds } = segment;
	const Ri = innerRadius;
	const Ro = outerRadius;
	const L = length;

	const r = Ri + x;

	if (r >= Ro) {
		// Fully burned
		return {
			Ab: 0,
			Vc: Math.PI * Ro ** 2 * L,
			dVdx: 0,
			Ap: Math.PI * Ro ** 2,
			done: true,
		};
	}

	// Port burning area (inner cylinder)
	let Ab = 2 * Math.PI * r * L;

	// End faces burn if not inhibited
	if (!inhibitEnds) {
		Ab += 2 * Math.PI * (Ro ** 2 - r ** 2);
	}

	// Port flow area
	const Ap = Math.PI * r ** 2;

	// Chamber free volume (port volume)
	const Vc = Math.PI * r ** 2 * L;

	// dV/dx
	const dVdx = 2 * Math.PI * r * L;

	return { Ab, Vc, dVdx, Ap, done: false };
}

/**
 * Finocyl segment geometry calculation
 * Ports geo_finocyl_segment.m
 */
export function geoFinocylSegment(x: number, segment: GrainSegment): GeometryResult {
	const L = segment.length;
	const Ro = segment.outerRadius;
	const Ri0 = segment.innerRadius;
	const Nf = segment.finCount || 6;
	const finDepth0 = segment.finDepth || 0;
	const finThick0 = segment.finThickness || 0;
	const inhibitEnds = segment.inhibitEnds;

	// Clamp regression depth
	x = Math.max(x, 0);

	// Fin features disappear once fin depth has regressed away
	const finDepth = Math.max(finDepth0 - x, 0);

	// Base port radius regresses outward with x
	const Ri = Math.min(Ri0 + x, Ro);

	// If port reaches outer wall, done
	const done = Ri >= Ro - 1e-12;

	// Effective fin thickness regresses (slots widen as surfaces regress)
	const finThick = Math.max(finThick0 + 2 * x, 0);

	// Port cross-section area
	// Circular port + rectangular slots
	const A_circ = Math.PI * Ri ** 2;
	const A_slots = Nf * finDepth * finThick;
	let Ap = A_circ + A_slots;

	// Enforce physical ceiling - port area cannot exceed case area
	const A_case = Math.PI * Ro ** 2;
	Ap = Math.min(Ap, A_case);

	// Burning surface area
	// 1) Lateral port area: perimeter * L
	// 2) End faces if not inhibited

	// Perimeter approximation
	const P_circ = 2 * Math.PI * Ri;
	const P_slots = Nf * (2 * finDepth + 2 * finThick);
	const P_port = P_circ + P_slots;

	const Ab_lateral = P_port * L;
	const Ab_ends = inhibitEnds ? 0 : 2 * Ap;
	const Ab = Ab_lateral + Ab_ends;

	// Chamber free volume
	const Vc = Ap * L;

	// dV/dx for ODE integration
	let dApdx = 0;
	if (!done) {
		const dRi = 1;
		const dA_circ = 2 * Math.PI * Ri * dRi;

		// finDepth derivative
		const dFinDepth = finDepth > 0 ? -1 : 0;

		// finThick derivative
		const dFinThick = 2;

		const dA_slots = Nf * (dFinDepth * finThick + finDepth * dFinThick);

		dApdx = dA_circ + dA_slots;
		dApdx = Math.max(dApdx, 0);

		// Cap if Ap has hit case area
		if (Ap >= A_case - 1e-12) {
			dApdx = 0;
		}
	}

	const dVdx = dApdx * L;

	return { Ab, Vc, dVdx, Ap, done };
}

/**
 * Evaluate grain stack at regression depth x
 * Ports geo_stack.m
 */
export function evaluateGrainStack(
	x: number,
	grainStack: GrainSegment[],
): GeometryResult & { Ap_seg: number[] } {
	let Ab_total = 0;
	let Vc_total = 0;
	let dVdx_total = 0;
	let Ap_min = Infinity;
	let allDone = true;
	const Ap_seg: number[] = [];

	for (const segment of grainStack) {
		let result: GeometryResult;

		if (segment.type === 'bates') {
			result = geoBatesSegment(x, segment);
		} else if (segment.type === 'finocyl') {
			result = geoFinocylSegment(x, segment);
		} else {
			throw new Error(`Unknown segment type: ${segment.type}`);
		}

		Ab_total += result.Ab;
		Vc_total += result.Vc;
		dVdx_total += result.dVdx;
		Ap_min = Math.min(Ap_min, result.Ap);
		Ap_seg.push(result.Ap);

		if (!result.done) {
			allDone = false;
		}
	}

	return {
		Ab: Ab_total,
		Vc: Vc_total,
		dVdx: dVdx_total,
		Ap: Ap_min, // Port area is minimum (choke point)
		Ap_seg,
		done: allDone,
	};
}
