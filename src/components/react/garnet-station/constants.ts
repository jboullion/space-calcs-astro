export interface GridCoord {
	x: number;
	y: number;
	z: number;
}

export const MODULE_SIZE_METERS = 4.0;
export const TILE_THICKNESS_METERS = 0.5;

export const FACE_NEIGHBOR_OFFSETS: GridCoord[] = [
	{ x: 1, y: 0, z: -1 },
	{ x: 1, y: -1, z: 0 },
	{ x: 1, y: 0, z: 1 },
	{ x: 1, y: 1, z: 0 },
	{ x: -1, y: 0, z: -1 },
	{ x: -1, y: 1, z: 0 },
	{ x: -1, y: 0, z: 1 },
	{ x: -1, y: -1, z: 0 },
	{ x: 0, y: 1, z: 1 },
	{ x: 0, y: 1, z: -1 },
	{ x: 0, y: -1, z: 1 },
	{ x: 0, y: -1, z: -1 },
];

const S = 0.707107;

export const FACE_NORMALS: GridCoord[] = [
	{ x: S, y: 0, z: -S },
	{ x: S, y: -S, z: 0 },
	{ x: S, y: 0, z: S },
	{ x: S, y: S, z: 0 },
	{ x: -S, y: 0, z: -S },
	{ x: -S, y: S, z: 0 },
	{ x: -S, y: 0, z: S },
	{ x: -S, y: -S, z: 0 },
	{ x: 0, y: S, z: S },
	{ x: 0, y: S, z: -S },
	{ x: 0, y: -S, z: S },
	{ x: 0, y: -S, z: -S },
];
