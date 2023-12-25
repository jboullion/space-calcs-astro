<template>
	<div>
		<div
			id="transfer-window-canvas"
			class="canvas-wrapper border"
			style="position: relative; height: 500px; width: 100%"
		>
			<i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
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
import { planet, planetTextures, three } from './constants';

import type { Zone } from './constants';
import type { ITransferWindowForm, Vector3Tuple } from './types';

import { planets } from './planets';
import type { PlanetOrbit } from '../transfer-window-sdg/types';

const loading = ref(true);
const textureDir = '/textures/';

const animation = {
	prevTick: 0,
};

// const AURatio = 100000; // dividing our actual AU by this number to make it easier to work with
const AUtoDistance = 1000; // Turn AU into on screen distance

const props = defineProps<{
	formData: ITransferWindowForm;
}>();

type PlanetPosition = {
	[key: string]: Vector3Tuple;
};

var currentPositions: PlanetPosition = {
	sun: [0, 0, 0],
};

var orbitResolution = 2;

/**
 *
 *
 * SETUP
 *
 *
 */

onMounted(() => {
	loadModels();

	window.addEventListener('resize', setupScene, { passive: true });
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', setupScene);
});

/**
 *
 *
 * COMPUTED
 *
 *
 */

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

	planetTextures.mercury = await textureLoader.load(
		textureDir + '2k_mercury.jpg',
	);
	planetTextures.venus = await textureLoader.load(
		textureDir + '2k_venus_atmosphere.jpg',
	);
	planetTextures.earth = await textureLoader.load(
		textureDir + '4k_earth_day.jpg',
	);
	planetTextures.mars = await textureLoader.load(textureDir + '2k_mars.jpg');
	planetTextures.jupiter = await textureLoader.load(
		textureDir + '2k_jupiter.jpg',
	);
	planetTextures.saturn = await textureLoader.load(
		textureDir + '2k_saturn.jpg',
	);
	planetTextures.uranus = await textureLoader.load(
		textureDir + '2k_uranus.jpg',
	);
	planetTextures.neptune = await textureLoader.load(
		textureDir + '2k_neptune.jpg',
	);
	planetTextures.space = await textureLoader.load(
		textureDir + '2k_stars_milky_way.jpg',
	);

	setupScene();
}

function setupScene() {
	if (three.scene && three.canvas) {
		removeAllChildNodes(three.canvas);
		//clearZones();
	}

	console.log('setupScene');

	setupThreeJS();
	setupSun();
	setupSpace();
	drawOrbits();
	// setupZones();
	// setupPlanet();
	// setupOrbits();

	loading.value = false;

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
	three.canvas = document.getElementById('transfer-window-canvas');

	if (!three.canvas) return;

	three.canvas.appendChild(three.renderer.domElement);

	const width = three.canvas.getBoundingClientRect().width;
	const height = 500;

	three.renderer.setSize(width, height);

	// three.labelRenderer = new CSS2DRenderer();

	// three.labelRenderer.setSize(width, height);
	// three.labelRenderer.domElement.style.position = 'absolute';
	// three.labelRenderer.domElement.style.top = '0px';
	// three.labelRenderer.domElement.style.pointerEvents = 'none';
	// three.canvas.appendChild(three.labelRenderer.domElement);

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
	const cameraPositionDistance = AUtoDistance * 2.5;
	const cameraZoomDistance = AUtoDistance * 50;

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

function setupSun() {
	if (!three.scene) return;

	const material = new THREE.MeshLambertMaterial({
		map: planetTextures.sun,
		side: THREE.FrontSide,
		color: 0xffa500,
		emissive: 0xffff00,
		emissiveIntensity: 0.8,
	});

	const sunRadius = 4.7;

	const geometry = new THREE.SphereGeometry(sunRadius, 32, 32);
	const mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.set(Math.PI / 2, 0, 0);

	three.scene.add(mesh);
}

function setupSpace() {
	const cameraZoomDistance = AUtoDistance * 50;

	const spacegeometry = new THREE.SphereGeometry(cameraZoomDistance, 16, 16);
	const spacematerial = new THREE.MeshBasicMaterial({
		map: planetTextures.space,
		side: THREE.BackSide,
	});
	const space = new THREE.Mesh(spacegeometry, spacematerial);

	three.scene.add(space);
}

function drawOrbits() {
	// Draw orbital lines for each planet

	// Iterate through all planets
	planets.map((planet) => {
		createOrbit(planet);
		// // The sun is special, so don't do it

		// // Create the orbit
		// var fullOrbit = new THREE.Group();

		// // If orbit opacity is on, and not in low res
		// if (!lowRes && orbitOpacity) {
		// 	// Split the orbit into 360 * orbitOpacityRes segments for individual opacity control
		// 	var opacity = baseOrbitOpacity;
		// 	for (var i = 0; i < 360 * orbitOpacityRes; i++) {
		// 		var degree = i / orbitOpacityRes;
		// 		var nextDegree = (i + 1) / orbitOpacityRes;
		// 		var planetOrbit = createOrbit(planet, degree, nextDegree);
		// 		var orbitMaterial = new THREE.LineBasicMaterial({
		// 			color: planet['trackColour'],
		// 			transparent: true,
		// 			opacity: opacity,
		// 		});
		// 		var orbitPath = new THREE.Line(planetOrbit, orbitMaterial);
		// 		three.scene.add(orbitPath);
		// 		orbitPath.scale.set(totalScale, totalScale, totalScale);
		// 		fullOrbit.add(orbitPath);
		// 	}
		// } else {
		// 	// Make one solid orbit for ease of computation
		// 	opacity = 1;

		// 	var planetOrbit = createOrbit(planet, 0, 360);
		// 	var orbitMaterial = new THREE.LineBasicMaterial({
		// 		color: planet['trackColour'],
		// 		transparent: true,
		// 		opacity: opacity,
		// 	});
		// 	var orbitPath = new THREE.Line(planetOrbit, orbitMaterial);
		// 	three.scene.add(orbitPath);
		// 	orbitPath.scale.set(totalScale, totalScale, totalScale);
		// 	fullOrbit.add(orbitPath);
		// }

		// // Add the orbit as the orbit mesh
		// three.scene.add(fullOrbit);
		// planet['orbitMesh'] = fullOrbit;

		// // Find the center and central coordinates
		// // var center = planet['center'];
		// // var centerCoords = currentPositions[center];
		// var centerCoords = [0, 0, 0];

		// // Find where the planet should be
		// var planetLocation = findPlanetLocation(planet, currentTime);
		// currentPositions[planet.value] = addVec(planetLocation, centerCoords) as Vector3Tuple;

		// // Don't initially display the moon orbits - saves computation
		// planet['orbitMesh'].visible = false;
	});
}

function createOrbit(planet: PlanetOrbit) {
	// Define the EllipseCurve parameters
	const aX = 0;
	const aY = 0;
	const xRadius = planet.a * AUtoDistance; // Semi-major axis
	const yRadius = (planet.semiMinorAxis ?? planet.a) * AUtoDistance; // Semi-minor axis
	const aStartAngle = 0;
	const aEndAngle = 2 * Math.PI;
	const aClockwise = false;
	const aRotation = 0;

	// Eccentricity of the ellipse (example value)
	const eccentricity = planet.e;

	// Calculate the offset (focal distance)
	const focalDistance = xRadius * eccentricity;

	// Create the EllipseCurve
	const ellipseCurve = new THREE.EllipseCurve(
		aX,
		aY,
		xRadius,
		yRadius,
		aStartAngle,
		aEndAngle,
		aClockwise,
		aRotation,
	);

	// Convert the EllipseCurve to a Path and then to a BufferGeometry
	//const path = new THREE.Path(ellipseCurve.getPoints(100)); // 100 points for smoothness
	const geometry = new THREE.BufferGeometry().setFromPoints(
		ellipseCurve.getPoints(100),
	);

	// Create the Line material
	const material = new THREE.LineBasicMaterial({ color: planet.trackColour });

	// Create the Line using the geometry and material
	const orbit = new THREE.Line(geometry, material);

	// Rotate the orbit to the correct inclination / plane
	orbit.rotation.x = planet.i * (Math.PI / 180);
	orbit.position.x = -focalDistance;

	// Add the orbit line to the scene
	three.scene.add(orbit);
}

// function createOrbit(planet: PlanetOrbit, startDegree: number, endDegree: number) {
// 	// Create the ThreeJS geometry for the orbit track

// 	// Initialise variables
// 	var geometry = new THREE.BufferGeometry();
// 	var vertexes = [];
// 	var degree = endDegree * orbitResolution;

// 	// // Get the correct initial vertex
// 	// if (degree < 360 * orbitResolution) {
// 	// 	geometry.vertices.push(threeVector(orbitalPositions[name][degree]));
// 	// } else {
// 	// 	geometry.vertices.push(threeVector(orbitalPositions[name][0]));
// 	// }

// 	// Iterate through all orbit points between given bounds and add it to the vertexes
// 	while (degree > startDegree * orbitResolution) {
// 		degree -= 1;
// 		var orbitalPosition = orbitalPositions[name][degree];

// 		//geometry.vertices.push(threeVector(orbitalPosition));
// 		vertexes.push(orbitalPosition[0], orbitalPosition[1], orbitalPosition[2]);
// 	}

// 	// Return the geometry
// 	return geometry;
// }

// Planetary Rendering

// function setupZones() {
// 	// At large star sizes the orbit is too small to see
// 	// let orbitWidth = Math.max(
// 	// 	4 + Math.floor(props.formData.starRadius / 3),
// 	// 	10,
// 	// );

// 	// orbitWidth = Math.min(100, orbitWidth);

// 	let orbitWidth = 6;

// 	const planetOrbit: Zone = {
// 		name: 'Planet Orbit',
// 		color: 0xea6730,
// 		emissive: 0xea6730,
// 		innerRadius: props.formData.planetOrbit * AUtoDistance,
// 		outerRadius: props.formData.planetOrbit * AUtoDistance + orbitWidth,
// 		opacity: 1,
// 	};

// 	createOrbit(planetOrbit, orbitWidth);

// 	const earthOrbit: Zone = {
// 		name: 'Earth Orbit',
// 		color: 0x0000ff,
// 		emissive: 0x0000ff,
// 		innerRadius: 1 * AUtoDistance,
// 		outerRadius: 1 * AUtoDistance + orbitWidth,
// 		opacity: 1,
// 	};

// 	const marsOrbit: Zone = {
// 		name: 'Mars Orbit',
// 		color: 0xff0000,
// 		emissive: 0xff0000,
// 		innerRadius: 1.5 * AUtoDistance,
// 		outerRadius: 1.5 * AUtoDistance + orbitWidth,
// 		opacity: 1,
// 	};

// 	const venusOrbit: Zone = {
// 		name: 'Venus Orbit',
// 		color: 0xffff00,
// 		emissive: 0xffff00,
// 		innerRadius: 0.7 * AUtoDistance,
// 		outerRadius: 0.7 * AUtoDistance + orbitWidth,
// 		opacity: 1,
// 	};

// 	const mercuryOrbit: Zone = {
// 		name: 'Mercury Orbit',
// 		color: 0xcccccc,
// 		emissive: 0xcccccc,
// 		innerRadius: 0.4 * AUtoDistance,
// 		outerRadius: 0.4 * AUtoDistance + orbitWidth,
// 		opacity: 1,
// 	};

// 	createOrbit(earthOrbit);
// 	createOrbit(marsOrbit);
// 	createOrbit(venusOrbit);
// 	createOrbit(mercuryOrbit);

// 	if (props.formData.planetOrbit > 3 || props.formData.starRadius > 200) {
// 		const jupiterOrbit: Zone = {
// 			name: 'Jupiter Orbit',
// 			color: 0xffaa00,
// 			emissive: 0xffaa00,
// 			innerRadius: 5.2 * AUtoDistance,
// 			outerRadius: 5.2 * AUtoDistance + orbitWidth,
// 			opacity: 1,
// 		};

// 		createOrbit(jupiterOrbit);
// 	}

// 	if (props.formData.planetOrbit > 7 || props.formData.starRadius > 300) {
// 		const saturnOrbit: Zone = {
// 			name: 'Saturn Orbit',
// 			color: 0xaaaa00,
// 			emissive: 0xaaaa00,
// 			innerRadius: 9.5 * AUtoDistance,
// 			outerRadius: 9.5 * AUtoDistance + orbitWidth,
// 			opacity: 1,
// 		};

// 		createOrbit(saturnOrbit);
// 	}

// 	if (props.formData.planetOrbit > 15 || props.formData.starRadius > 400) {
// 		const uranusOrbit: Zone = {
// 			name: 'Uranus Orbit',
// 			color: 0x00aaff,
// 			emissive: 0x00aaff,
// 			innerRadius: 19.8 * AUtoDistance,
// 			outerRadius: 19.8 * AUtoDistance + orbitWidth,
// 			opacity: 1,
// 		};

// 		createOrbit(uranusOrbit);
// 	}

// 	if (props.formData.planetOrbit > 25 || props.formData.starRadius > 500) {
// 		const neptuneOrbit: Zone = {
// 			name: 'Neptune Orbit',
// 			color: 0x0033ff,
// 			emissive: 0x0033ff,
// 			innerRadius: 30 * AUtoDistance,
// 			outerRadius: 30 * AUtoDistance + orbitWidth,
// 			opacity: 1,
// 		};

// 		createOrbit(neptuneOrbit);
// 	}

// 	if (props.formData.planetOrbit > 30 || props.formData.starRadius > 600) {
// 		const plutoOrbit: Zone = {
// 			name: 'Pluto Orbit',
// 			color: 0xa020f0,
// 			emissive: 0xa020f0,
// 			innerRadius: 39 * AUtoDistance,
// 			outerRadius: 39 * AUtoDistance + orbitWidth,
// 			opacity: 1,
// 		};

// 		createOrbit(plutoOrbit);
// 	}
// }

// function createOrbit(orbit: Zone, zIndex: number = 0) {
// 	var extrudeSettings = {
// 		depth: 3,
// 		steps: 1,
// 		bevelEnabled: false,
// 		curveSegments: 24,
// 	};

// 	var arcShape = new THREE.Shape();
// 	arcShape.absarc(0, 0, orbit.outerRadius, 0, Math.PI * 2, false);

// 	var holePath = new THREE.Path();
// 	holePath.absarc(
// 		0,
// 		0,
// 		orbit.innerRadius, // This would be the radius of the smaller circle
// 		0,
// 		Math.PI * 2,
// 		true,
// 	);
// 	arcShape.holes.push(holePath);

// 	const zoneMaterial = new THREE.LineDashedMaterial({
// 		color: orbit.color,
// 		side: THREE.FrontSide, // DoubleSide, BackSide
// 		opacity: orbit.opacity,
// 		transparent: true,
// 		depthWrite: false,
// 		linewidth: 100,
// 		scale: 1,
// 		dashSize: 300,
// 		gapSize: 100,
// 	});

// 	const zoneGeometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);

// 	const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
// 	three.renderOrder++;
// 	zoneMesh.position.z = zIndex;

// 	three.scene.add(zoneMesh);

// 	// if (props.formData.showLabels) {
// 	// 	zoneMesh.layers.enableAll();

// 	// 	const labelDiv = document.createElement('div');
// 	// 	labelDiv.className = 'label';
// 	// 	labelDiv.textContent = orbit.name;
// 	// 	labelDiv.style.backgroundColor = 'transparent';
// 	// 	labelDiv.style.color = 'white';
// 	// 	labelDiv.style.fontSize = '12px';
// 	// 	labelDiv.style.fontFamily = 'sans-serif';
// 	// 	labelDiv.style.padding = '0.5em';
// 	// 	labelDiv.style.borderRadius = '0.5em';
// 	// 	labelDiv.style.pointerEvents = 'none';
// 	// 	labelDiv.style.textAlign = 'center';
// 	// 	labelDiv.style.opacity = '0.8';
// 	// 	// labelDiv.style.border = "1px solid white";

// 	// 	const label = new CSS2DObject(labelDiv);
// 	// 	//const side = zoneMesh.renderOrder % 2 == 0 ? 1 : -1;
// 	// 	const upOrDown = three.renderOrder % 2 == 0 ? 1 : -1;
// 	// 	label.position.set(0, upOrDown * orbit.outerRadius - 80, 0);
// 	// 	// @ts-ignore
// 	// 	label.center.set(0, 1);
// 	// 	zoneMesh.add(label);
// 	// 	label.layers.set(0);
// 	// }
// }

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
	const cameraZoomDistance = AUtoDistance * 4;
	three.camera.far = cameraZoomDistance * 2;
	three.camera.updateProjectionMatrix();
	if (three.controls) {
		three.controls.maxDistance = cameraZoomDistance;
	}

	//clearZones();
	setupSun();
	//setupZones();
	updateCamera();
});
</script>
