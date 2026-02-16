import * as THREE from 'three';
import {
	FACE_NEIGHBOR_OFFSETS,
	FACE_NORMALS,
	MODULE_SIZE_METERS,
	type GridCoord,
} from './constants';

export function coordKey(coord: GridCoord): string {
	return `${coord.x},${coord.y},${coord.z}`;
}

export function isOrigin(coord: GridCoord): boolean {
	return coord.x === 0 && coord.y === 0 && coord.z === 0;
}

export function isValidBCC(coord: GridCoord): boolean {
	return (coord.x + coord.y + coord.z) % 2 === 0;
}

export function addCoords(a: GridCoord, b: GridCoord): GridCoord {
	return {
		x: a.x + b.x,
		y: a.y + b.y,
		z: a.z + b.z,
	};
}

export function getModuleSpacing(
	moduleSize = MODULE_SIZE_METERS,
	tileThickness = 0,
): number {
	return moduleSize * 0.707107 * ((moduleSize + tileThickness) / moduleSize);
}

export function gridToWorld(coord: GridCoord, spacing: number): THREE.Vector3 {
	return new THREE.Vector3(
		coord.x * spacing,
		coord.y * spacing,
		coord.z * spacing,
	);
}

export function getFaceIndexFromHitDirection(direction: THREE.Vector3): number {
	let bestFaceIndex = 0;
	let bestDot = -Infinity;

	for (let index = 0; index < FACE_NORMALS.length; index++) {
		const normal = FACE_NORMALS[index];
		const dot =
			direction.x * normal.x +
			direction.y * normal.y +
			direction.z * normal.z;
		if (dot > bestDot) {
			bestDot = dot;
			bestFaceIndex = index;
		}
	}

	return bestFaceIndex;
}

export function getNeighborCoordForFace(
	coord: GridCoord,
	faceIndex: number,
): GridCoord {
	const offset = FACE_NEIGHBOR_OFFSETS[faceIndex];
	return addCoords(coord, offset);
}
