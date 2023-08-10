export type SolarEnergyForm = {
    starRadius: number; // Solar radii
    starTemperature: number; // K
    planetOrbit: number; // AU
    atmosphereAbsorption: number; // 0-X% Earth atmosphere
    solarPanelEfficiency: number; // 0-100% of light reflected
    showLabels: boolean;
};

import * as THREE from 'three';
import type { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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
