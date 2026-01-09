import type { PropellantData, NozzleConfig } from './types';

// Propellant database
export const PROPELLANTS: PropellantData[] = [
	{
		name: 'Blue Thunder',
		density: 1625.09,
		a: 6.9947e-5,
		n: 0.321,
		gamma: 1.235,
		Tc: 2616.5,
		M: 0.022959,
		description: 'High-performance APCP propellant',
	},
	{
		name: 'KNDX (65/35)',
		density: 1880,
		a: 5.13e-5,
		n: 0.222,
		gamma: 1.133,
		Tc: 1720,
		M: 0.0396,
		description: 'Potassium Nitrate/Dextrose',
	},
	{
		name: 'KNSB (65/35)',
		density: 1841,
		a: 5.13e-5,
		n: 0.222,
		gamma: 1.137,
		Tc: 1600,
		M: 0.0396,
		description: 'Potassium Nitrate/Sorbitol',
	},
	{
		name: 'KNSU (65/35)',
		density: 1889,
		a: 8.26e-5,
		n: 0.319,
		gamma: 1.133,
		Tc: 1720,
		M: 0.0396,
		description: 'Potassium Nitrate/Sucrose',
	},
];

export const DEFAULT_PROPELLANT = PROPELLANTS[0];

export const DEFAULT_NOZZLE: NozzleConfig = {
	mode: 'auto',
	throatDiameter: 0.01524, // 15.24mm
	exitDiameter: 0.0762, // 76.2mm
	Cd: 0.98,
	ambientPressure: 101325, // 1 atm
	targetPressure: 2000 * 6894.76, // 2000 psi in Pa
	targetExpansion: 25,
};

// Physical constants
export const PHYSICS = {
	g0: 9.80665, // m/s² - standard gravity
	R: 8.314462618, // J/(mol·K) - universal gas constant
};

// Format number helper
export function formatNumber(value: number, decimals: number = 2): string {
	if (!isFinite(value)) return '--';
	if (Math.abs(value) < 0.01 || Math.abs(value) > 999999) {
		return value.toExponential(decimals);
	}
	return value.toFixed(decimals);
}

// Add commas to large numbers
export function addCommas(value: number): string {
	if (!isFinite(value)) return '--';
	return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
