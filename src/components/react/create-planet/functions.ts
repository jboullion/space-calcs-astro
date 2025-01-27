import * as THREE from 'three';

// Seedable random number generator
class Random {
	private seed: number;

	constructor(seed: number) {
		this.seed = seed;
	}

	// Simple xorshift algorithm
	next(): number {
		let x = this.seed;
		x ^= x << 13;
		x ^= x >> 17;
		x ^= x << 5;
		this.seed = x;
		return (x >>> 0) / 4294967296;
	}
}

export function generatePlanetTextures(
	size: number,
	roughness: number,
	seed?: number,
) {
	// Initialize random number generator with seed or current timestamp
	const rng = new Random(seed ?? Date.now());

	// Helper function to create a canvas
	const createCanvas = () => {
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		return canvas;
	};

	// Create canvases for different texture maps
	const heightCanvas = createCanvas();
	const normalCanvas = createCanvas();
	const colorCanvas = createCanvas();

	const heightCtx = heightCanvas.getContext('2d')!;
	const normalCtx = normalCanvas.getContext('2d')!;
	const colorCtx = colorCanvas.getContext('2d')!;

	const heightData = heightCtx.createImageData(size, size);
	const normalData = normalCtx.createImageData(size, size);
	const colorData = colorCtx.createImageData(size, size);

	// Generate random phase offsets and frequencies for each octave
	const octaves = 4;
	const phases = Array.from({ length: octaves }, () => ({
		x: rng.next() * Math.PI * 2,
		y: rng.next() * Math.PI * 2,
		z: rng.next() * Math.PI * 2,
	}));

	const frequencies = Array.from({ length: octaves }, () => ({
		x: 4 + rng.next() * 4,
		y: 4 + rng.next() * 4,
		z: 4 + rng.next() * 4,
	}));

	// Generate random color variations
	const baseColor = {
		r: 139 + (rng.next() * 40 - 20),
		g: 69 + (rng.next() * 20 - 10),
		b: 19 + (rng.next() * 20 - 10),
	};

	const mountainColor = {
		r: 169 + (rng.next() * 40 - 20),
		g: 169 + (rng.next() * 40 - 20),
		b: 169 + (rng.next() * 40 - 20),
	};

	const lowlandColor = {
		r: 160 + (rng.next() * 40 - 20),
		g: 82 + (rng.next() * 20 - 10),
		b: 45 + (rng.next() * 20 - 10),
	};

	// Generate terrain
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const phi = (y / size) * Math.PI;
			const theta = (x / size) * 2 * Math.PI;

			const nx = Math.sin(phi) * Math.cos(theta);
			const ny = Math.sin(phi) * Math.sin(theta);
			const nz = Math.cos(phi);

			let height = 0;
			let frequency = 1;
			let amplitude = 1;

			for (let o = 0; o < octaves; o++) {
				const phase = phases[o];
				const freq = frequencies[o];

				height +=
					(Math.cos(
						nx * frequency * freq.x +
							phase.x +
							ny * frequency * freq.y,
					) +
						Math.sin(
							ny * frequency * freq.y +
								phase.y +
								nz * frequency * freq.z,
						) +
						Math.cos(
							nz * frequency * freq.z +
								phase.z +
								nx * frequency * freq.x,
						)) *
					amplitude;

				frequency *= 2;
				amplitude *= 0.5;
			}

			height = ((height / octaves) * 0.5 + 0.5) * roughness;
			const i = (y * size + x) * 4;

			// Height map
			heightData.data[i] = height * 255;
			heightData.data[i + 1] = height * 255;
			heightData.data[i + 2] = height * 255;
			heightData.data[i + 3] = 255;

			// Color map with interpolation
			const color =
				height < 0.4
					? lowlandColor
					: height > 0.7
					? mountainColor
					: baseColor;

			colorData.data[i] = color.r;
			colorData.data[i + 1] = color.g;
			colorData.data[i + 2] = color.b;
			colorData.data[i + 3] = 255;

			// Normal map calculation
			const s = 1 / size;
			const hu = heightData.data[(y * size + ((x + 1) % size)) * 4] / 255;
			const hd =
				heightData.data[(y * size + ((x - 1 + size) % size)) * 4] / 255;
			const hr = heightData.data[(((y + 1) % size) * size + x) * 4] / 255;
			const hl =
				heightData.data[(((y - 1 + size) % size) * size + x) * 4] / 255;

			const normal = new THREE.Vector3(
				(hu - hd) * roughness * 2,
				(hr - hl) * roughness * 2,
				1,
			).normalize();

			normalData.data[i] = (normal.x * 0.5 + 0.5) * 255;
			normalData.data[i + 1] = (normal.y * 0.5 + 0.5) * 255;
			normalData.data[i + 2] = normal.z * 255;
			normalData.data[i + 3] = 255;
		}
	}

	heightCtx.putImageData(heightData, 0, 0);
	normalCtx.putImageData(normalData, 0, 0);
	colorCtx.putImageData(colorData, 0, 0);

	return {
		heightMap: new THREE.CanvasTexture(heightCanvas),
		normalMap: new THREE.CanvasTexture(normalCanvas),
		colorMap: new THREE.CanvasTexture(colorCanvas),
	};
}
