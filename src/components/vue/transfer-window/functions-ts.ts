import type { PlanetOrbit } from './types';
import { DtoR } from './functions';

export function calculateOrbitalPositionVector(
	planet: PlanetOrbit,
	degree: number,
	scale: number = 1000,
) {
	// Given which degree a planet is at, return the position vector

	// Get orbital data
	var e = planet['e'];
	var i = planet['i'];
	var a = planet['a'];
	var loPE = planet['loPE'];
	var loAN = planet['loAN'];
	//var center = planet['center'];

	// Eccentric degree is how far away it is from the periapsis
	var eccentricDegree = (360 + degree + loPE) % 360;

	// Find out the magnitude of the position vector
	var distance =
		(a * (1 - e * e)) / (1 + e * Math.cos(DtoR(eccentricDegree)));

	// Convert it into needed formats
	var degreesFromAN = DtoR(-degree - loAN);
	var o = DtoR(loAN);
	i = DtoR(i);

	// Calculate the X, Y and Z components
	var x =
		distance *
		(Math.cos(o) * Math.cos(degreesFromAN) -
			Math.sin(o) * Math.sin(degreesFromAN) * Math.cos(i)) *
		scale;
	var y =
		distance *
		(Math.sin(o) * Math.cos(degreesFromAN) +
			Math.cos(o) * Math.sin(degreesFromAN) * Math.cos(i)) *
		scale;
	var z = distance * (Math.sin(degreesFromAN) * Math.sin(i)) * scale;

	// Return position
	return [x, y, z];
}
