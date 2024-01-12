import * as THREE from 'three';
import type { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { M3S2toAU3Y2 } from './functions';

export type SolarEnergyForm = {
	starRadius: number; // Solar radii
	starTemperature: number; // K
	planetOrbit: number; // AU
	atmosphereAbsorption: number; // 0-X% Earth atmosphere
	solarPanelEfficiency: number; // 0-100% of light reflected
	showLabels: boolean;
};

export type Zone = {
	name: string;
	color: number;
	emissive: number;
	innerRadius: number;
	outerRadius: number;
	opacity: number;
};

export interface PlanetTextures {
	sun: THREE.Texture | null;
	mercury: THREE.Texture | null;
	venus: THREE.Texture | null;
	earth: THREE.Texture | null;
	mars: THREE.Texture | null;
	jupiter: THREE.Texture | null;
	saturn: THREE.Texture | null;
	uranus: THREE.Texture | null;
	neptune: THREE.Texture | null;
	space: THREE.Texture | null;
}

export const planetTextures: PlanetTextures = {
	sun: null,
	mercury: null,
	venus: null,
	earth: null,
	mars: null,
	jupiter: null,
	saturn: null,
	uranus: null,
	neptune: null,
	space: null,
};

export const planet = {
	mesh: new THREE.Mesh(),
	clouds: new THREE.Mesh(),
	axis: new THREE.Vector3(),
	geometry: new THREE.SphereGeometry(),
	material: new THREE.Material(),
	group: new THREE.Group() as THREE.Group,
};

export const three = {
	canvas: null as HTMLElement | HTMLCanvasElement | null,
	renderer: null as THREE.WebGLRenderer | null,
	scene: new THREE.Scene(),
	labelRenderer: null as CSS2DRenderer | null,
	renderOrder: 0,
	camera: new THREE.PerspectiveCamera(),
	controls: null as OrbitControls | null,
	// group: null,
	// stats: null, // used for debugging
	// gui: null, // used for debugging
	// raycaster: null,
	// mouse: null,
	// minMovement: null as THREE.Vector3 | null,
	// maxMovement: null as THREE.Vector3 | null,
};

export type StarType = { value: string; name: string };

export const bolometricCorrection = [
	{
		starType: 'M',
		value: -2,
	},
	{
		starType: 'K',
		value: -0.8,
	},
	{
		starType: 'G',
		value: -0.4,
	},
	{
		starType: 'F',
		value: -0.15,
	},
	{
		starType: 'A',
		value: -0.3,
	},
	{
		starType: 'B',
		value: -2,
	},
];

export const gravitationalConstant = 6.67408 * Math.pow(10, -11); // m3 kg-1 s-2
export const EPOCH = new Date(2000, 0, 1, 12, 0, 0, 0); // January 2000, 12h terrestrial

// Set default mass to sun
let SolMass = 1.98855 * Math.pow(10, 30);

// // Reverse-derive from orbit of the Earth
// SolMass = AU3Y2toM3S2(4 * Math.PI * Math.PI) / gravitationalConstant;

// Calculate the gravitational parameter
export const gravitationalParameter = SolMass * gravitationalConstant; // m3 s-2
export const gravitationalParameterAU = M3S2toAU3Y2(gravitationalParameter);

export const MS_SECOND = 1000;
export const MS_MINUTE = 60 * 1000;
export const MS_HOUR = 60 * 60 * 1000;
export const MS_DAY = 24 * 60 * 60 * 1000;
export const MS_YEAR = 365.25 * 24 * 60 * 60 * 1000;
