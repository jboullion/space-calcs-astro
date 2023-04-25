// depricated: we use formatNumbers now
export function addCommas(value: number, decimals: number = 0) {
  return formatNumber(value, decimals);
}

export function formatNumber(value: number, decimals: number = 0) {
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals });
}

export const clampNumber = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max);

// Used to deep clone an object. May want to use a more robust method in the future
export function deepClone(obj: Object) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 *
 *
 * Conversions
 *
 *
 */
export const physicsConstants = {
  g: 9.80665, // m/s
  gravityConstant: 0.000000000066743, //6.67408 * Math.pow(10, -11), // m3 kg-1 s-2
  c3Deceleration: 1.5, // km/s
  escVe: 11.186, // km/s,
  GM: 1.327e11, // km^3/s^2
  foot: 0.3048, // m
  mile: 5280, // ft
  quarterPI: Math.PI / 4, // radians
  AU: 149597870.7, // km
  sunRadius: 696340, // km
  sunLuminosity: 3.828e26, // W
  sunTemp: 5778, // K
  stefanBoltzmann: 5.670367e-8, // Stefan-Boltzmann constant in W/m²K⁴
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
