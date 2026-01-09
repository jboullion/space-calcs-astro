// Math utilities for SRM simulation

/**
 * Root finding using bisection method
 * More reliable than Newton-Raphson for our use cases
 */
export function bisection(
	f: (x: number) => number,
	xLow: number,
	xHigh: number,
	tolerance: number = 1e-8,
	maxIterations: number = 100,
): number {
	let fLow = f(xLow);
	let fHigh = f(xHigh);

	// Check if root is bracketed
	if (fLow * fHigh > 0) {
		// Not bracketed - try to minimize squared residual
		return minimizeBrent(
			(x) => f(x) ** 2,
			xLow,
			xHigh,
			tolerance,
			maxIterations,
		);
	}

	for (let i = 0; i < maxIterations; i++) {
		const xMid = (xLow + xHigh) / 2;
		const fMid = f(xMid);

		if (Math.abs(fMid) < tolerance || (xHigh - xLow) / 2 < tolerance) {
			return xMid;
		}

		if (fMid * fLow < 0) {
			xHigh = xMid;
			fHigh = fMid;
		} else {
			xLow = xMid;
			fLow = fMid;
		}
	}

	return (xLow + xHigh) / 2;
}

/**
 * Brent's method for finding minimum of function
 * Used as fallback for root finding
 */
export function minimizeBrent(
	f: (x: number) => number,
	xLow: number,
	xHigh: number,
	tolerance: number = 1e-8,
	maxIterations: number = 100,
): number {
	const phi = (1 + Math.sqrt(5)) / 2;
	const resphi = 2 - phi;

	let a = xLow;
	let b = xHigh;
	let x = a + resphi * (b - a);
	let fx = f(x);

	for (let i = 0; i < maxIterations; i++) {
		if (Math.abs(b - a) < tolerance) {
			return (a + b) / 2;
		}

		const xNew = a + resphi * (b - a);
		const fxNew = f(xNew);

		if (fxNew < fx) {
			if (xNew < x) {
				b = x;
			} else {
				a = x;
			}
			x = xNew;
			fx = fxNew;
		} else {
			if (xNew < x) {
				a = xNew;
			} else {
				b = xNew;
			}
		}
	}

	return x;
}

/**
 * Trapezoidal integration
 */
export function trapz(x: number[], y: number[]): number {
	if (x.length !== y.length || x.length < 2) {
		return 0;
	}

	let sum = 0;
	for (let i = 1; i < x.length; i++) {
		const dx = x[i] - x[i - 1];
		const avgY = (y[i] + y[i - 1]) / 2;
		sum += dx * avgY;
	}

	return sum;
}

/**
 * Find maximum value and its index in array
 */
export function findMax(arr: number[]): { value: number; index: number } {
	let maxVal = -Infinity;
	let maxIdx = 0;

	for (let i = 0; i < arr.length; i++) {
		if (arr[i] > maxVal) {
			maxVal = arr[i];
			maxIdx = i;
		}
	}

	return { value: maxVal, index: maxIdx };
}

/**
 * Linear interpolation
 */
export function lerp(x: number, x0: number, x1: number, y0: number, y1: number): number {
	if (x1 === x0) return y0;
	return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}
