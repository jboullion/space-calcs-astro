import type { NumberUnits, Units } from './forms/types';

// depricated: we use formatNumbers now
export function addCommas(value: number, decimals: number = 0) {
	return formatNumber(value, decimals);
}

export function formatNumber(value: number, decimals: number = 2) {
	return value.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export const clampNumber = (num: number, min: number, max: number) =>
	Math.min(Math.max(num, min), max);

// Used to deep clone an object. May want to use a more robust method in the future
export function deepClone(obj: Object) {
	return JSON.parse(JSON.stringify(obj));
}

export function roundToDecimal(num: number, decimalPlaces: number = 2) {
	const decimals = Math.pow(10, decimalPlaces);
	return Math.round(num * decimals + Number.EPSILON) / decimals;
}

/**
 *
 *
 * Conversions
 *
 *
 */

// export const meters = {
//     toFeet: (m: number) => m * 3.28084,
//     toMiles: (m: number) => m * 0.000621371,
//     toKm: (m: number) => m / 1000,
// };

export const lengthUnits: Units[] = [
	{
		label: 'm',
		value: 0.001,
	},
	{
		label: 'km',
		value: 1,
	},
	{
		label: 'ft',
		value: 0.0003048,
	},
	{
		label: 'mi',
		value: 1.60934,
	},
];

export const longDistanceUnits: Units[] = [
	{
		label: 'km',
		value: 1,
	},
	{
		label: 'mi',
		value: 1.60934,
	},
	{
		label: 'AU',
		value: 149597870.7,
	},
	{
		label: 'ly',
		value: 9460730472580.8,
	},
	// {
	//     label: 'pc',
	//     value: 30856775814671.0,
	// },
];

export const accelerationUnits: Units[] = [
	{
		label: 'm/s²',
		value: 1,
	},
	{
		label: 'km/s²',
		value: 1000,
	},
	{
		label: 'g',
		value: 9.80665,
	},
	{
		label: 'ft/s²',
		value: 0.3048,
	},
];

export const velocityUnits: Units[] = [
	{
		label: 'm/s²',
		value: 1,
	},
	{
		label: 'km/s²',
		value: 1000,
	},
	{
		label: 'ft/s²',
		value: 0.3048,
	},
];

export const massUnits: Units[] = [
	{
		label: 'g',
		value: 0.001,
	},
	{
		label: 'kg',
		value: 1,
	},
	{
		label: 'tonne',
		value: 1000,
	},
	{
		label: 'lbs',
		value: 2.20462,
	},
];

export const densityUnits: Units[] = [
	{ label: 'g/cm³', value: 1 },
	{ label: 'kg/m³', value: 0.001 },
	{ label: 'g/mL', value: 1 },
	{ label: 'g/L', value: 0.001 },
	{ label: 'lb/in³', value: 0.036127292 },
	{ label: 'lb/ft³', value: 0.06242796 },
	{ label: 'oz/in³', value: 0.578036672 },
];

export const energyUnits: Units[] = [
	{ label: 'J', value: 1 },
	{ label: 'kJ', value: 1000 },
	{ label: 'cal', value: 239.00573614 }, // International Steam Table Calorie
	{ label: 'kcal', value: 239005.73614 }, // International Steam Table Calorie
	// { label: 'eV', value: 6.242e21 },
	// { label: 'BTU', value: 947.81707775 },
	// { label: 'ft-lb', value: 737562.14928 },
	{ label: 'Wh', value: 3600 },
	{ label: 'kWh', value: 3600000 },
	{ label: 'MWh', value: 3600000000 },
	{ label: 'GWh', value: 3600000000000 },
	{ label: 'TWh', value: 3600000000000000 },
	// Add more units as needed
];

export const hourUnits = [
	{ label: 'seconds', value: 1 },
	{ label: 'minutes', value: 60 },
	{ label: 'hours', value: 3600 },
];

export const longTimeUnits = [
	{ label: 'days', value: 86400 },
	{ label: 'weeks', value: 604800 },
	{ label: 'years', value: 31536000 },
	{ label: 'decades', value: 315360000 },
	{ label: 'centuries', value: 3153600000 },
	{ label: 'millennia', value: 31536000000 },
];

// export const timeUnits = [
//     // { label: 'milliseconds', value: 1000 },
//     { label: 'seconds', value: 1 },
//     // { label: "microseconds", value: 1e+6 },
//     // { label: "nanoseconds", value: 1e+9 },
//     { label: 'minutes', value: 1 / 60 },
//     { label: 'hours', value: 1 / 3600 },
//     { label: "days", value: 1 / 86400 },
//     { label: "weeks", value: 1 / 604800 },
//     { label: "years", value: 1 / 31536000 },
//     // Add more units as needed
// ];

export const highSpeedUnits: Units[] = [
	{ label: 'm/s', value: 1 },
	{ label: 'km/s', value: 1000 },
	{ label: 'ft/s', value: 0.3048 },
	{ label: 'mi/s', value: 1609.34 },
	{ label: 'c', value: 299792458 },
	{ label: 'Mach', value: 340.3 },
];

export function convertUnitValue(
	value: number,
	newUnit: NumberUnits,
	oldUnit: NumberUnits,
	deciminalPlaces: number = 2,
) {
	const conversionValue = oldUnit.value / newUnit.value;

	value = value * conversionValue;

	return roundToDecimal(value, deciminalPlaces);
}

export const physicsConstants = {
	g: 9.80665, // m/s
	gravityConstant: 0.000000000066743, //6.67408 * Math.pow(10, -11), // m3 kg-1 s-2
	c3Deceleration: 1.5, // km/s
	c: 299792458, // m/s
	escVe: 11.186, // km/s,
	GM: 1.327e11, // km^3/s^2
	foot: 0.3048, // m
	mile: 5280, // ft
	quarterPI: Math.PI / 4, // radians
	AU: 149597870.7, // km
	earthMass: 5.972e24, // kg
	earthRadius: 6371, // km
	marsRadius: 3389.5, // km
	marsMass: 6.39e23, // kg
	moonRadius: 1737.4, // km
	moonMass: 7.34767309e22, // kg
	sunMass: 1.989e30, // kg
	sunRadius: 696340, // km
	sunLuminosity: 3.828e26, // W
	sunTemp: 5778, // K
	stefanBoltzmann: 5.670367e-8, // Stefan-Boltzmann constant in W/m²K⁴
	solarConstant: 1361, // W/m² Energy absorbed per square meter at the top of the atmosphere
	amstrongLimit: 6.3,
	radiansPerSecToRpm: 9.54929, // 30 / Math.PI
	rpmToRadiansPerSec: 0.10471, // Math.PI / 30
	idealGasConstant: 8.3144, // J/(mol·K)
};

export function gTom2s(g: number) {
	return g * physicsConstants.g;
}

export function m2sTog(m2s: number) {
	return m2s / physicsConstants.g;
}

export function mTofeet(m: number) {
	return m * physicsConstants.foot;
}

export function mToKm(m: number) {
	return m * 1000;
}

export function mToMiles(m: number) {
	return m * physicsConstants.foot * 5280;
}

export function mpsToKph(m: number) {
	return m * 0.277777778; // 1000 / 3600
}

export function mpsToMph(m: number) {
	return m * ((physicsConstants.foot * 5280) / 3600);
}

export function rpmToRadians(rpm: number) {
	return rpm * (Math.PI / 30);
}

export function rpmToDegrees(rpm: number) {
	return radiansToDegrees(rpmToRadians(rpm));
}

export function radiansToDegrees(radians: number) {
	return radians / (Math.PI / 180);
}

export function radiansPerSecToRpm(radians: number) {
	return radians / 0.10471975511965977; //(Math.PI / 30)
}

export function relativeDifference(a: number, b: number) {
	return Math.abs((a - b) / ((a + b) / 2)); // 100 *
}

export function kToC(k: number) {
	return k - 273.15;
}

export function calculateGravitationalForce(
	mass1: number,
	mass2: number,
	distance: number,
): number {
	const gravitationalConstant = physicsConstants.gravityConstant; // m³/kg s²

	const force = (gravitationalConstant * mass1 * mass2) / distance ** 2;
	return force;
}

export function calculateMaxTensileStress(
	gravitationalForce: number,
	crossSectionalArea: number,
) {
	const maxTensileStress = gravitationalForce / crossSectionalArea;
	return maxTensileStress;
}

export function calculateCrossSectionalArea(
	maxTension: number,
	allowableTensileStress: number,
): number {
	const crossSectionalArea = maxTension / allowableTensileStress;
	return crossSectionalArea;
}

/**
 * Return the difference in time between two clocks moving at different velocities.
 * @param properTime Seconds
 * @param velocity % speed of light
 */
export function calculateTimeDilation(
	properTime: number,
	velocity: number,
): number {
	const speedOfLight = physicsConstants.c;

	const dilationFactor = 1 / Math.sqrt(1 - velocity ** 2 / speedOfLight ** 2);
	const dilatedTime = properTime * dilationFactor;

	return dilatedTime;
}

/**
 *
 * THREE JS
 *
 */

export function removeAllChildNodes(parent: HTMLElement) {
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}
}

/**
 * Local Storage & Cookies
 */

export function getWithExpiry(key: string) {
	const itemStr = localStorage.getItem(key);
	// if the item doesn't exist, return null
	if (!itemStr) {
		return null;
	}
	const item = JSON.parse(itemStr);
	const now = new Date();
	// compare the expiry time of the item with the current time
	if (now.getTime() > item.expiry) {
		// If the item is expired, delete the item from storage
		// and return null
		localStorage.removeItem(key);
		return null;
	}
	return item.value;
}

export function setWithExpiry(key: string, value: any, ttl: number) {
	const now = new Date();

	// `item` is an object which contains the original value
	// as well as the time when it's supposed to expire
	const item = {
		value: value,
		expiry: now.getTime() + ttl,
	};
	localStorage.setItem(key, JSON.stringify(item));
}

// Avoid various timezone issues by just getting a date object with no time
export function createDateFromInput(dateString: string) {
	const [year, month, day] = dateString
		.split('-')
		.map((num) => parseInt(num, 10));
	return new Date(year, month - 1, day);
}

// Avoid various timezone issues by just getting a date object with no time
export function createDateFromDate(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
