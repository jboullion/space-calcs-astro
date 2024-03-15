<template>
	<div id="solar-energy__results" class="col-lg-8 calc-form">
		<div
			id="solar-energy-canvas"
			class="canvas-wrapper border"
			style="position: relative; height: 500px; width: 100%"
		>
			<i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
		</div>
		<div class="p-2 rounded border">
			<table class="table mb-0">
				<tbody>
					<tr class="" title="L = L☉ * (R / R☉)² * (T / T☉)⁴">
						<th>Star Luminosity</th>
						<td class="text-end">
							{{ luminosity.toExponential(4) }} W
						</td>
					</tr>
					<tr class="" title="A = 4𝝅R²">
						<th>Orbit Sphere Size</th>
						<td class="text-end">
							{{ orbitSphereSize.toExponential(4) }} m²
						</td>
					</tr>
					<tr class="" title="E1 = L / A">
						<th>Energy Reaching Planet (Insolation)</th>
						<td class="text-end">
							{{ formatNumber(planetInsolation) }} W/m²
						</td>
					</tr>
					<tr class="" title="E2 = E1 * (100 - Atm%)">
						<th>Available Energy at Surface</th>
						<td class="text-end">
							{{ formatNumber(availableEnergyOnSurface) }} W/m²
						</td>
					</tr>
					<tr class="border-0" title="P = E2 * Eff%">
						<th class="border-0">Solar Panel Potential</th>
						<td class="text-end border-0">
							{{ formatNumber(solarPanelPotential) }} W/m²
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="result-chart my-4">
			<!-- <div
        id="efficiency-chart"
        v-show="showResult == 'efficiency'"
        style="width: 100%; height: 400px"
      ></div> -->
			<!-- <div
        id="fuel-chart"
        v-show="showResult == 'fuel'"
        style="width: 100%; height: 400px"
      ></div>
      <div
        id="c3-chart"
        v-show="showResult == 'c3'"
        style="width: 100%; height: 400px"
      ></div> -->
		</div>
	</div>
</template>

<script lang="ts" setup>
import {
	computed,
	onBeforeMount,
	onBeforeUnmount,
	onMounted,
	ref,
	watch,
} from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
	CSS2DObject,
	CSS2DRenderer,
} from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import { physicsConstants, formatNumber, removeAllChildNodes } from '../utils';
import { throttle } from '../../../utils/utils';
import { planet, planetTextures, three } from './constants';

import type { SolarEnergyForm, Zone } from './constants';

const loading = ref(true);
const textureDir = '/textures/';

const animation = {
	prevTick: 0,
};

// const AURatio = 100000; // dividing our actual AU by this number to make it easier to work with
const AUtoDistance = 1000; // Turn AU into on screen distance

const props = defineProps<{
	formData: SolarEnergyForm;
}>();

const throttledResize = throttle(onWindowResize, 32);

/**
 *
 *
 * SETUP
 *
 *
 */

onMounted(() => {
	loadModels();

	window.addEventListener('resize', throttledResize, { passive: true });
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', throttledResize);
});

function updateRenderSize() {
	if (!three.canvas) return;
	if (!three.renderer) return;

	const width = three.canvas.getBoundingClientRect().width;
	const height = width * 0.75;

	// Update aspect ratio
	three.camera.aspect = width / height;

	// Update the camera's projection matrix
	three.camera.updateProjectionMatrix();

	three.renderer.setSize(width, height);
	three.canvas.style.paddingTop = `0px`;
}

function onWindowResize() {
	updateRenderSize();
}

/**
 *
 *
 * COMPUTED
 *
 *
 */

// const starTemperature = computed(() => {
//   return props.formData.starTemperature ** 4;
// });

const luminosity = computed(() => {
	// L = L☉ * (R / R☉)² * (T / T☉)⁴
	return (
		physicsConstants.sunLuminosity *
		((props.formData.starRadius * physicsConstants.sunRadius) /
			physicsConstants.sunRadius) **
			2 *
		(props.formData.starTemperature / physicsConstants.sunTemp) ** 4
	);

	// alternative L = σ * A * T⁴
	// return (
	//   physicsConstants.stefanBoltzmann * starArea.value * starTemperature.value
	// );
});

const orbitSphereSize = computed(() => {
	return (
		4 *
		Math.PI *
		(props.formData.planetOrbit * physicsConstants.AU * 1000) ** 2
	);
});

const planetInsolation = computed(() => {
	return luminosity.value / orbitSphereSize.value;
});

const availableEnergyOnSurface = computed(() => {
	return (
		planetInsolation.value *
		((100 - props.formData.atmosphereAbsorption) / 100)
	);
});

const solarPanelPotential = computed(() => {
	const solarPotential =
		availableEnergyOnSurface.value *
		(props.formData.solarPanelEfficiency / 100);

	return solarPotential;
});

/**
 *
 *
 * THREE JS
 *
 *
 */

async function loadModels() {
	const textureLoader = new THREE.TextureLoader();
	// TODO: Do we want to load these dynamically instead of on load?
	planetTextures.sun = await textureLoader.load(textureDir + '2k_sun.jpg');

	// planetTextures.mercury = await textureLoader.load(
	//     textureDir + '2k_mercury.jpg',
	// );
	// planetTextures.venus = await textureLoader.load(
	//     textureDir + '2k_venus_atmosphere.jpg',
	// );
	// planetTextures.earth = await textureLoader.load(
	//     textureDir + '4k_earth_day.jpg',
	// );
	// planetTextures.mars = await textureLoader.load(textureDir + '2k_mars.jpg');
	// planetTextures.jupiter = await textureLoader.load(
	//     textureDir + '2k_jupiter.jpg',
	// );
	// planetTextures.saturn = await textureLoader.load(
	//     textureDir + '2k_saturn.jpg',
	// );
	// planetTextures.uranus = await textureLoader.load(
	//     textureDir + '2k_uranus.jpg',
	// );
	// planetTextures.neptune = await textureLoader.load(
	//     textureDir + '2k_neptune.jpg',
	// );

	loading.value = false;
	setupScene();
}

function setupScene() {
	if (loading.value) return;

	if (three.scene && three.canvas) {
		removeAllChildNodes(three.canvas);
		clearZones();
	}

	setupThreeJS();
	setupSun();
	setupZones();
	// setupPlanet();

	if (!animation.prevTick) {
		animate();
	}
}

function setupThreeJS() {
	three.scene = new THREE.Scene();
	planet.group = new THREE.Group();

	// Renderer
	three.renderer = new THREE.WebGLRenderer({
		antialias: true,
		logarithmicDepthBuffer: true,
	}); // { alpha: true }
	three.canvas = document.getElementById('solar-energy-canvas');

	if (!three.canvas) return;

	three.canvas.appendChild(three.renderer.domElement);

	const width = three.canvas.getBoundingClientRect().width;
	const height = 500;

	three.renderer.setSize(width, height);

	three.labelRenderer = new CSS2DRenderer();

	three.labelRenderer.setSize(width, height);
	three.labelRenderer.domElement.style.position = 'absolute';
	three.labelRenderer.domElement.style.top = '0px';
	three.labelRenderer.domElement.style.pointerEvents = 'none';
	three.canvas.appendChild(three.labelRenderer.domElement);

	updateCamera();

	// Lights
	three.scene.add(new THREE.AmbientLight(0x404040));

	// TODO: Possibly create a point light for the sun
	//const light = new THREE.DirectionalLight(0xffffff, 0.5);
	//three.scene.add(light);

	// // GUI
	// this.three.gui = new dat.GUI( { autoPlace: false } );
	// this.three.canvas.appendChild(this.three.gui.domElement);
}

function updateCamera() {
	if (!three.renderer) return;

	// Camera
	let baseDistance = props.formData.planetOrbit;

	if (props.formData.starRadius > 250) {
		baseDistance = props.formData.starRadius / 20;
	}

	const cameraPositionDistance = baseDistance * AUtoDistance * 2.5;
	const cameraZoomDistance = baseDistance * AUtoDistance * 5;

	let rendererSize = new THREE.Vector2();
	three.renderer.getSize(rendererSize);
	three.camera = new THREE.PerspectiveCamera(
		45,
		rendererSize.width / rendererSize.height,
		0.1,
		cameraZoomDistance * 2,
	);

	three.camera.position.z = cameraPositionDistance;

	// this.three.controls.enableZoom = false;

	// Controls
	three.controls = new OrbitControls(three.camera, three.renderer.domElement);
	// three.controls.enableDamping = true;
	// three.controls.dampingFactor = 0.05;
	three.controls.maxDistance = cameraZoomDistance;
	three.controls.minDistance = 100;
}

function getSunColor() {
	if (props.formData.starTemperature > 11000) {
		return 0x5555ff;
	} else if (props.formData.starTemperature > 7500) {
		return 0xffffff;
	} else if (props.formData.starTemperature > 5000) {
		return 0xffff00;
	} else if (props.formData.starTemperature > 3600) {
		return 0xffa500;
	} else if (props.formData.starTemperature > 2500) {
		return 0xaa0000;
	} else {
		return 0x220000;
	}
}

function setupSun() {
	if (!three.scene) return;

	const material = new THREE.MeshLambertMaterial({
		map: planetTextures.sun,
		side: THREE.FrontSide,
		color: getSunColor(),
		emissive: getSunColor(),
		emissiveIntensity: 0.8,
	});

	// This is the radius of the sun in the simulation. NOT ACCURATE. Just a visual representation.
	const sunRadius = 4.7 * props.formData.starRadius;

	const geometry = new THREE.SphereGeometry(sunRadius, 32, 32);
	const mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.set(Math.PI / 2, 0, 0);

	three.scene.add(mesh);
}

function clearZones() {
	three.renderOrder = 0;

	if (three.labelRenderer) three.labelRenderer.domElement.innerHTML = '';

	for (var i = three.scene.children.length - 1; i >= 0; i--) {
		// @ts-ignore
		if (!three.scene.children[i].geometry) continue;

		if (
			// @ts-ignore
			three.scene.children[i].geometry.type !== 'ExtrudeGeometry' &&
			// @ts-ignore
			three.scene.children[i].geometry.type !== 'SphereGeometry'
		)
			continue;

		three.scene.remove(three.scene.children[i]);
	}
}

function setupZones() {
	// At large star sizes the orbit is too small to see
	let orbitWidth = Math.max(
		4 + Math.floor(props.formData.starRadius / 3),
		10,
	);

	orbitWidth = Math.min(100, orbitWidth);

	const planetOrbit: Zone = {
		name: 'Planet Orbit',
		color: 0xea6730,
		emissive: 0xea6730,
		innerRadius: props.formData.planetOrbit * AUtoDistance,
		outerRadius: props.formData.planetOrbit * AUtoDistance + orbitWidth,
		opacity: 1,
	};

	createOrbit(planetOrbit, orbitWidth);

	const earthOrbit: Zone = {
		name: 'Earth Orbit',
		color: 0x0000ff,
		emissive: 0x0000ff,
		innerRadius: 1 * AUtoDistance,
		outerRadius: 1 * AUtoDistance + orbitWidth,
		opacity: 1,
	};

	const marsOrbit: Zone = {
		name: 'Mars Orbit',
		color: 0xff0000,
		emissive: 0xff0000,
		innerRadius: 1.5 * AUtoDistance,
		outerRadius: 1.5 * AUtoDistance + orbitWidth,
		opacity: 1,
	};

	const venusOrbit: Zone = {
		name: 'Venus Orbit',
		color: 0xffff00,
		emissive: 0xffff00,
		innerRadius: 0.7 * AUtoDistance,
		outerRadius: 0.7 * AUtoDistance + orbitWidth,
		opacity: 1,
	};

	const mercuryOrbit: Zone = {
		name: 'Mercury Orbit',
		color: 0xcccccc,
		emissive: 0xcccccc,
		innerRadius: 0.4 * AUtoDistance,
		outerRadius: 0.4 * AUtoDistance + orbitWidth,
		opacity: 1,
	};

	createOrbit(earthOrbit);
	createOrbit(marsOrbit);
	createOrbit(venusOrbit);
	createOrbit(mercuryOrbit);

	if (props.formData.planetOrbit > 3 || props.formData.starRadius > 200) {
		const jupiterOrbit: Zone = {
			name: 'Jupiter Orbit',
			color: 0xffaa00,
			emissive: 0xffaa00,
			innerRadius: 5.2 * AUtoDistance,
			outerRadius: 5.2 * AUtoDistance + orbitWidth,
			opacity: 1,
		};

		createOrbit(jupiterOrbit);
	}

	if (props.formData.planetOrbit > 7 || props.formData.starRadius > 300) {
		const saturnOrbit: Zone = {
			name: 'Saturn Orbit',
			color: 0xaaaa00,
			emissive: 0xaaaa00,
			innerRadius: 9.5 * AUtoDistance,
			outerRadius: 9.5 * AUtoDistance + orbitWidth,
			opacity: 1,
		};

		createOrbit(saturnOrbit);
	}

	if (props.formData.planetOrbit > 15 || props.formData.starRadius > 400) {
		const uranusOrbit: Zone = {
			name: 'Uranus Orbit',
			color: 0x00aaff,
			emissive: 0x00aaff,
			innerRadius: 19.8 * AUtoDistance,
			outerRadius: 19.8 * AUtoDistance + orbitWidth,
			opacity: 1,
		};

		createOrbit(uranusOrbit);
	}

	if (props.formData.planetOrbit > 25 || props.formData.starRadius > 500) {
		const neptuneOrbit: Zone = {
			name: 'Neptune Orbit',
			color: 0x0033ff,
			emissive: 0x0033ff,
			innerRadius: 30 * AUtoDistance,
			outerRadius: 30 * AUtoDistance + orbitWidth,
			opacity: 1,
		};

		createOrbit(neptuneOrbit);
	}

	if (props.formData.planetOrbit > 30 || props.formData.starRadius > 600) {
		const plutoOrbit: Zone = {
			name: 'Pluto Orbit',
			color: 0xa020f0,
			emissive: 0xa020f0,
			innerRadius: 39 * AUtoDistance,
			outerRadius: 39 * AUtoDistance + orbitWidth,
			opacity: 1,
		};

		createOrbit(plutoOrbit);
	}
}

function createOrbit(orbit: Zone, zIndex: number = 0) {
	var extrudeSettings = {
		depth: 3,
		steps: 1,
		bevelEnabled: false,
		curveSegments: 24,
	};

	var arcShape = new THREE.Shape();
	arcShape.absarc(0, 0, orbit.outerRadius, 0, Math.PI * 2, false);

	var holePath = new THREE.Path();
	holePath.absarc(
		0,
		0,
		orbit.innerRadius, // This would be the radius of the smaller circle
		0,
		Math.PI * 2,
		true,
	);
	arcShape.holes.push(holePath);

	const zoneMaterial = new THREE.LineDashedMaterial({
		color: orbit.color,
		side: THREE.FrontSide, // DoubleSide, BackSide
		opacity: orbit.opacity,
		transparent: true,
		depthWrite: false,
		linewidth: 100,
		scale: 1,
		dashSize: 300,
		gapSize: 100,
	});

	const zoneGeometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);

	const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
	three.renderOrder++;
	zoneMesh.position.z = zIndex;

	three.scene.add(zoneMesh);

	if (props.formData.showLabels) {
		zoneMesh.layers.enableAll();

		const labelDiv = document.createElement('div');
		labelDiv.className = 'label';
		labelDiv.textContent = orbit.name;
		labelDiv.style.backgroundColor = 'transparent';
		labelDiv.style.color = 'white';
		labelDiv.style.fontSize = '12px';
		labelDiv.style.fontFamily = 'sans-serif';
		labelDiv.style.padding = '0.5em';
		labelDiv.style.borderRadius = '0.5em';
		labelDiv.style.pointerEvents = 'none';
		labelDiv.style.textAlign = 'center';
		labelDiv.style.opacity = '0.8';
		// labelDiv.style.border = "1px solid white";

		const label = new CSS2DObject(labelDiv);
		//const side = zoneMesh.renderOrder % 2 == 0 ? 1 : -1;
		const upOrDown = three.renderOrder % 2 == 0 ? 1 : -1;
		label.position.set(0, upOrDown * orbit.outerRadius - 80, 0);
		// @ts-ignore
		label.center.set(0, 1);
		zoneMesh.add(label);
		label.layers.set(0);
	}
}

/**
 * ANIMATE
 */
function animate() {
	if (!three.renderer) return;
	if (!three.controls) return;

	requestAnimationFrame(animate);

	three.controls.update();

	//this.three.camera.position.clamp(this.three.minMovement, this.three.maxMovement);
	three.renderer.render(three.scene, three.camera);
	if (three.labelRenderer)
		three.labelRenderer.render(three.scene, three.camera);

	// clamp to fixed framerate
	const now = Math.round((30 * window.performance.now()) / 1000);

	if (now == animation.prevTick) return;

	animation.prevTick = now;
}

/**
 * WATCHERS
 */
watch(props.formData, (newValue, oldValue) => {
	//updateCamera();
	const baseDistance = props.formData.planetOrbit;
	const cameraZoomDistance = baseDistance * AUtoDistance * 4;
	three.camera.far = cameraZoomDistance * 2;
	three.camera.updateProjectionMatrix();
	if (three.controls) {
		three.controls.maxDistance = cameraZoomDistance;
	}

	clearZones();
	setupSun();
	setupZones();
	updateCamera();
});
</script>
