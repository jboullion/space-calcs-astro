import type { GridCoord } from './constants';
import { isValidBCC } from './grid';

export type ProceduralShape =
	| 'hollow-box'
	| 'hollow-sphere'
	| 'cylinder';

export interface ProceduralParams {
	shape: ProceduralShape;
	sizeX: number;
	sizeY: number;
	sizeZ: number;
	wallThickness: number;
	offsetX: number;
	offsetY: number;
	offsetZ: number;
	centerOnOffset: boolean;
}

export function generateProceduralCoords(params: ProceduralParams): GridCoord[] {
	switch (params.shape) {
		case 'hollow-box':
			return generateHollowBoxCoords(params);
		case 'hollow-sphere':
			return generateHollowSphereCoords(params);
		case 'cylinder':
			return generateCylinderCoords(params);
		default:
			return [];
	}
}

function generateHollowBoxCoords(params: ProceduralParams): GridCoord[] {
	const coords: GridCoord[] = [];

	for (let x = 0; x < params.sizeX; x++) {
		for (let y = 0; y < params.sizeY; y++) {
			for (let z = 0; z < params.sizeZ; z++) {
				if (
					isOnBoxShell(
						x,
						y,
						z,
						params.sizeX,
						params.sizeY,
						params.sizeZ,
						params.wallThickness,
					)
				) {
					const coord = applyOffset(x, y, z, params);
					if (isValidBCC(coord)) {
						coords.push(coord);
					}
				}
			}
		}
	}

	return coords;
}

function generateHollowSphereCoords(params: ProceduralParams): GridCoord[] {
	const coords: GridCoord[] = [];

	const radius = (params.sizeX + params.sizeY + params.sizeZ) / 6;
	const innerRadius = Math.max(0, radius - params.wallThickness);
	const diameter = Math.ceil(radius * 2);
	const centerX = radius;
	const centerY = radius;
	const centerZ = radius;

	for (let x = 0; x <= diameter; x++) {
		for (let y = 0; y <= diameter; y++) {
			for (let z = 0; z <= diameter; z++) {
				const inOuter = isInSphere(x, y, z, centerX, centerY, centerZ, radius);
				const inInner = isInSphere(x, y, z, centerX, centerY, centerZ, innerRadius);
				if (inOuter && !inInner) {
					const coord = applyOffset(x, y, z, params);
					if (isValidBCC(coord)) {
						coords.push(coord);
					}
				}
			}
		}
	}

	return coords;
}
function generateCylinderCoords(params: ProceduralParams): GridCoord[] {
	const coords: GridCoord[] = [];
	const radiusX = params.sizeX / 2;
	const radiusY = params.sizeY / 2;
	const centerX = radiusX;
	const centerY = radiusY;

	for (let x = 0; x < params.sizeX; x++) {
		for (let y = 0; y < params.sizeY; y++) {
			const dx = (x - centerX) / radiusX;
			const dy = (y - centerY) / radiusY;
			const distSq = dx * dx + dy * dy;

			if (distSq <= 1) {
				const innerRadiusX = Math.max(0, radiusX - params.wallThickness);
				const innerRadiusY = Math.max(0, radiusY - params.wallThickness);
				const innerDX = innerRadiusX > 0 ? (x - centerX) / innerRadiusX : 999;
				const innerDY = innerRadiusY > 0 ? (y - centerY) / innerRadiusY : 999;
				const innerDistSq = innerDX * innerDX + innerDY * innerDY;

				for (let z = 0; z < params.sizeZ; z++) {
					const onWall = innerDistSq > 1;
					const onCap =
						z < params.wallThickness || z >= params.sizeZ - params.wallThickness;

					if (onWall || onCap) {
						const coord = applyOffset(x, y, z, params);
						if (isValidBCC(coord)) {
							coords.push(coord);
						}
					}
				}
			}
		}
	}

	return coords;
}
function isOnBoxShell(
	x: number,
	y: number,
	z: number,
	sizeX: number,
	sizeY: number,
	sizeZ: number,
	thickness: number,
): boolean {
	const nearMinX = x < thickness;
	const nearMaxX = x >= sizeX - thickness;
	const nearMinY = y < thickness;
	const nearMaxY = y >= sizeY - thickness;
	const nearMinZ = z < thickness;
	const nearMaxZ = z >= sizeZ - thickness;
	return nearMinX || nearMaxX || nearMinY || nearMaxY || nearMinZ || nearMaxZ;
}

function isInSphere(
	x: number,
	y: number,
	z: number,
	centerX: number,
	centerY: number,
	centerZ: number,
	radius: number,
): boolean {
	const dx = x - centerX;
	const dy = y - centerY;
	const dz = z - centerZ;
	return dx * dx + dy * dy + dz * dz <= radius * radius;
}

function applyOffset(
	x: number,
	y: number,
	z: number,
	params: ProceduralParams,
): GridCoord {
	let offsetX = params.offsetX;
	let offsetY = params.offsetY;
	let offsetZ = params.offsetZ;

	if (params.centerOnOffset) {
		offsetX -= Math.floor(params.sizeX / 2);
		offsetY -= Math.floor(params.sizeY / 2);
		offsetZ -= Math.floor(params.sizeZ / 2);
	}

	return {
		x: x + offsetX,
		y: y + offsetY,
		z: z + offsetZ,
	};
}
