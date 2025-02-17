import * as THREE from 'three';
import type { SurfaceColors } from './types';

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

// Water phase transitions
export type WaterPhase = 'ice' | 'liquid' | 'vapor';

export function determineWaterPhase(
	temperatureK: number,
	pressureAtm: number,
): WaterPhase {
	// Triple point of water: 273.16 K and 0.006 atm
	// Normal melting point: 273.15 K at 1 atm
	// Normal boiling point: 373.15 K at 1 atm

	// Simplified phase diagram - we'll use the normal melting/boiling points as primary references
	// and adjust slightly based on pressure

	// Pressure affects the melting point very little but affects the boiling point significantly
	const meltingPoint = 273.15 - (pressureAtm - 1) * 0.01; // Slight pressure dependence
	const boilingPoint = 373.15 + (pressureAtm - 1) * 10; // Strong pressure dependence

	if (temperatureK < meltingPoint) {
		return 'ice';
	} else if (temperatureK > boilingPoint) {
		return 'vapor';
	} else {
		return 'liquid';
	}
}

function hexToRgb(hex: string) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) {
		return { r: 0, g: 0, b: 0 };
	}
	return {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16),
	};
}

export function generatePlanetTextures(
	size: number,
	roughness: number,
	surfaceColors: SurfaceColors,
	seed?: number,
) {
	// Initialize random number generator with seed or current timestamp
	const rng = new Random(seed ?? Date.now());

	// Convert hex colors to RGB
	const baseColorRgb = hexToRgb(surfaceColors.base);
	const lowlandColorRgb = hexToRgb(surfaceColors.lowland);
	const midlandColorRgb = hexToRgb(surfaceColors.midland);
	const highlandColorRgb = hexToRgb(surfaceColors.highland);

	// Helper function to interpolate colors
	function interpolateColor(height: number) {
		if (height < 0.3) {
			// Interpolate between lowland and midland
			const t = height / 0.3;
			return {
				r:
					lowlandColorRgb.r +
					(midlandColorRgb.r - lowlandColorRgb.r) * t,
				g:
					lowlandColorRgb.g +
					(midlandColorRgb.g - lowlandColorRgb.g) * t,
				b:
					lowlandColorRgb.b +
					(midlandColorRgb.b - lowlandColorRgb.b) * t,
			};
		} else if (height < 0.7) {
			// Interpolate between midland and base
			const t = (height - 0.3) / 0.4;
			return {
				r: midlandColorRgb.r + (baseColorRgb.r - midlandColorRgb.r) * t,
				g: midlandColorRgb.g + (baseColorRgb.g - midlandColorRgb.g) * t,
				b: midlandColorRgb.b + (baseColorRgb.b - midlandColorRgb.b) * t,
			};
		} else {
			// Interpolate between base and highland
			const t = (height - 0.7) / 0.3;
			return {
				r: baseColorRgb.r + (highlandColorRgb.r - baseColorRgb.r) * t,
				g: baseColorRgb.g + (highlandColorRgb.g - baseColorRgb.g) * t,
				b: baseColorRgb.b + (highlandColorRgb.b - baseColorRgb.b) * t,
			};
		}
	}

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

	// // Generate random color variations
	// const baseColor = {
	// 	r: 139 + (rng.next() * 40 - 20),
	// 	g: 69 + (rng.next() * 20 - 10),
	// 	b: 19 + (rng.next() * 20 - 10),
	// };

	// const mountainColor = {
	// 	r: 169 + (rng.next() * 40 - 20),
	// 	g: 169 + (rng.next() * 40 - 20),
	// 	b: 169 + (rng.next() * 40 - 20),
	// };

	// const lowlandColor = {
	// 	r: 160 + (rng.next() * 40 - 20),
	// 	g: 82 + (rng.next() * 20 - 10),
	// 	b: 45 + (rng.next() * 20 - 10),
	// };

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
			const color = interpolateColor(height);
			colorData.data[i] = color.r;
			colorData.data[i + 1] = color.g;
			colorData.data[i + 2] = color.b;
			colorData.data[i + 3] = 255;

			// Normal map calculation
			// const s = 1 / size;
			// const hu = heightData.data[(y * size + ((x + 1) % size)) * 4] / 255;
			// const hd =
			// 	heightData.data[(y * size + ((x - 1 + size) % size)) * 4] / 255;
			// const hr = heightData.data[(((y + 1) % size) * size + x) * 4] / 255;
			// const hl =
			// 	heightData.data[(((y - 1 + size) % size) * size + x) * 4] / 255;

			// const normal = new THREE.Vector3(
			// 	(hu - hd) * roughness * 2,
			// 	(hr - hl) * roughness * 2,
			// 	1,
			// ).normalize();

			// Normal map calculation with smoother transitions
			const s = 1 / size;
			const hu = heightData.data[(y * size + ((x + 1) % size)) * 4] / 255;
			const hd =
				heightData.data[(y * size + ((x - 1 + size) % size)) * 4] / 255;
			const hr = heightData.data[(((y + 1) % size) * size + x) * 4] / 255;
			const hl =
				heightData.data[(((y - 1 + size) % size) * size + x) * 4] / 255;

			// Reduce the strength of the normal map based on roughness
			const normalStrength = Math.min(0.5, roughness);
			const normal = new THREE.Vector3(
				(hu - hd) * normalStrength,
				(hr - hl) * normalStrength,
				1.0,
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
