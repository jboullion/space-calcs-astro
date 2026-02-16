import * as THREE from 'three';

const RHOMBIC_DODECAHEDRON_FACES: [number, number, number, number][] = [
	[3, 8, 1, 13],
	[1, 8, 5, 11],
	[5, 8, 7, 12],
	[7, 8, 3, 10],
	[0, 9, 2, 13],
	[2, 9, 6, 10],
	[6, 9, 4, 12],
	[4, 9, 0, 11],
	[7, 10, 6, 12],
	[2, 10, 3, 13],
	[4, 11, 5, 12],
	[1, 11, 0, 13],
];

export function createRhombicDodecahedronGeometry(
	moduleSizeMeters: number,
): THREE.BufferGeometry {
	const radius = moduleSizeMeters / 2;
	const scale = radius / Math.sqrt(2);

	const vertices: THREE.Vector3[] = [];

	for (const sz of [-1, 1]) {
		for (const sy of [-1, 1]) {
			for (const sx of [-1, 1]) {
				vertices.push(new THREE.Vector3(sx * scale, sy * scale, sz * scale));
			}
		}
	}

	vertices.push(new THREE.Vector3(2 * scale, 0, 0));
	vertices.push(new THREE.Vector3(-2 * scale, 0, 0));
	vertices.push(new THREE.Vector3(0, 2 * scale, 0));
	vertices.push(new THREE.Vector3(0, -2 * scale, 0));
	vertices.push(new THREE.Vector3(0, 0, 2 * scale));
	vertices.push(new THREE.Vector3(0, 0, -2 * scale));

	const positions: number[] = [];

	for (const [a, b, c, d] of RHOMBIC_DODECAHEDRON_FACES) {
		const v0 = vertices[a];
		const v1 = vertices[b];
		const v2 = vertices[c];
		const v3 = vertices[d];

		positions.push(
			v0.x,
			v0.y,
			v0.z,
			v1.x,
			v1.y,
			v1.z,
			v2.x,
			v2.y,
			v2.z,
		);
		positions.push(
			v0.x,
			v0.y,
			v0.z,
			v2.x,
			v2.y,
			v2.z,
			v3.x,
			v3.y,
			v3.z,
		);
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute(
		'position',
		new THREE.Float32BufferAttribute(positions, 3),
	);
	geometry.computeVertexNormals();

	return geometry;
}
