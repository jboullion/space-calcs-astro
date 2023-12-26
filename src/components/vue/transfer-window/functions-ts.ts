import type { PlanetOrbit } from './types';
import { DtoR } from './functions';

export function calculateOrbitalPositionVector(
	planet: PlanetOrbit,
	degree: number,
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
			Math.sin(o) * Math.sin(degreesFromAN) * Math.cos(i));
	var y =
		distance *
		(Math.sin(o) * Math.cos(degreesFromAN) +
			Math.cos(o) * Math.sin(degreesFromAN) * Math.cos(i));
	var z = distance * (Math.sin(degreesFromAN) * Math.sin(i));

	// // Deal with axial tilts of moons (the moon/luna are excepted due to its odd orbit)
	// // The only parameters I could find were discounting axial tilt - I think due to how odd it is
	// if (
	// 	center != 'sun' &&
	// 	name != 'luna' &&
	// 	name != 'the moon' &&
	// 	name != 'ship'
	// ) {
	// 	if (planets[center]['axialTilt']) {
	// 		// Calculates angular momentum vector, rotate by the rotation of the parent axial tilt from Z+
	// 		// Then recalculate moderated orbital parameters based on this angular momentum

	// 		var axisAN;
	// 		var iAxis;

	// 		if (!planet['loANeff'] || !planet['ieff']) {
	// 			calculateEffectiveParams(name);
	// 		}
	// 		axisAN = planet['loANeff'];
	// 		iAxis = planet['ieff'];

	// 		// Recalculate position - see earlier in the program
	// 		var degreesFromAxisAN = DtoR(-degree - axisAN);
	// 		var oAxis = DtoR(axisAN);
	// 		iAxis = DtoR(iAxis);
	// 		x =
	// 			distance *
	// 			(Math.cos(oAxis) * Math.cos(degreesFromAxisAN) -
	// 				Math.sin(oAxis) *
	// 					Math.sin(degreesFromAxisAN) *
	// 					Math.cos(iAxis));
	// 		y =
	// 			distance *
	// 			(Math.sin(oAxis) * Math.cos(degreesFromAxisAN) +
	// 				Math.cos(oAxis) *
	// 					Math.sin(degreesFromAxisAN) *
	// 					Math.cos(iAxis));
	// 		z = distance * (Math.sin(degreesFromAxisAN) * Math.sin(iAxis));
	// 	}
	// }

	// Return position
	return [x, y, z];
}
