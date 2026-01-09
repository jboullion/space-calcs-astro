import { physicsConstants, roundToDecimal } from '../utils';

export function calcSpinRads(radius: number, gravity: number) {
	const radiusM = radius * 1000;

	const result = Math.sqrt((gravity * physicsConstants.g) / radiusM);

	return roundToDecimal(result, 4);
}

export function calcG_Accel(radius: number, spinRads: number) {
	const radiusM = radius * 1000;

	return Math.pow(spinRads, 2) * radiusM;
}

export function calcGForceFromRPM(rpm: number, radius: number) {
	// Convert RPM to radians per second
	const radiansPerSecond = (rpm * 2 * Math.PI) / 60;

	// Convert radius to meters
	const radiusM = radius * 1000;

	// Calculate acceleration (ω²r)
	const acceleration = Math.pow(radiansPerSecond, 2) * radiusM;

	// Convert to G-force (divide by Earth's gravity)
	return acceleration / physicsConstants.g;
}
