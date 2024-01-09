<template>
	<div>
		<div
			id="transfer-window-canvas"
			class="canvas-wrapper border"
			style="position: relative; height: 600px; width: 100%"
		>
			<i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import {
// 	CSS2DObject,
// 	CSS2DRenderer,
// } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import { removeAllChildNodes } from '../utils';
import {
	planet,
	planetTextures,
	three,
	EPOCH,
	gravitationalParameter,
	Vector3,
} from './constants';

import type {
	PlanetOrbit,
	ITransferWindowForm,
	OrbitalDegree,
	OrbitalPosition,
	OrbitalTime,
	OrbitalVelocity,
	Vector3Tuple,
} from './types';

import { planets } from './planets';
import {
	M3S2toAU3Y2,
	convertTime,
	magnitude,
	subVec,
	multiplyVec,
	addVec,
	convertDistance,
} from './functions';

import { calculateOrbitalPositionVector } from './functions-ts';
// import { getGeometryRoughness } from 'three/examples/jsm/nodes/Nodes.js';

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

const currentPositions: PlanetPosition = {
	sun: [0, 0, 0],
};

// Time Variables
const clock = new THREE.Clock();
let lastTimeRatio = 1;
let timeRatio = 1;
const now = new Date();
let displayTime = now;
let currentTime = new Date('2010-05-05'); // May not actually be now, just when it is displayed
const newDate = ref(currentTime);
const timeDiff = displayTime.getTime() - currentTime.getTime();
const timeScale = 30; // Number of increments per second
const apparentTimeRate = 3600 * 24; // Rate at which time passes in sim seconds / real second
let timeRate = 3600 * 24 * 7; // Rate at which time passes in sim seconds / computational second
let timeIncrement = (timeRate * 1000) / timeScale; // Simulation time to add per time increment
const FPS = 4; // TODO: Increase to 24 or 30 when done testing

// Orbit Variables
const orbitResolution = 1; // Could probably reduce this to 1 or 0.5 to reduce the number of points calculated
const orbitalTimes: OrbitalTime = {};
const orbitalVelocities: OrbitalVelocity = {};
const orbitalPositions: OrbitalPosition = {};
const currentDegrees: OrbitalDegree = {
	sun: 0,
	mercury: 0,
	venus: 0,
	earth: 0,
	mars: 0,
	jupiter: 0,
	saturn: 0,
	uranus: 0,
	neptune: 0,
	pluto: 0,
};

const sphereGeo = new THREE.SphereGeometry(100, 16, 16);
const markerScale = (1 / 10) * (3 / 4);
const totalScale = Math.round(convertDistance('AU', 'M'));
const geoScale = totalScale;

/**
 *
 *
 * SETUP
 *
 *
 */

onMounted(async () => {
	await loadModels();

	// Setup planet data for current time
	planets.map((planet) => {
		generateOrbitalCoords(planet);
		generateOrbitalTimes(planet);
	});

	setupScene();

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

// function updateConstants() {
// 	var delta = clock.getDelta() * 60;

// 	timeRatio = delta / 1;

// 	if (timeRatio > 10) {
// 		if (lastTimeRatio > 10) {
// 			timeRatio = 10;
// 		} else {
// 			timeRatio = 1;
// 		}
// 	}

// 	lastTimeRatio = timeRatio;

// 	timeRate = apparentTimeRate * timeRatio;
// 	timeIncrement = timeRate * (1000 / timeScale);
// }

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

	planetTextures.space = await textureLoader.load(
		textureDir + '2k_stars_milky_way.jpg',
	);
}

function setupScene() {
	if (three.scene && three.canvas) {
		removeAllChildNodes(three.canvas);
		//clearZones();
	}

	setupThreeJS();
	setupSun();
	setupSpace();
	drawOrbits();

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
	const height = 600;

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
	const cameraZoomDistance = AUtoDistance * 60;

	let rendererSize = new THREE.Vector2();
	three.renderer.getSize(rendererSize);
	three.camera = new THREE.PerspectiveCamera(
		45,
		rendererSize.width / rendererSize.height,
		0.1,
		cameraZoomDistance * 2,
	);

	three.camera.position.z = cameraPositionDistance;
	three.camera.position.y -= cameraPositionDistance;
	three.camera.lookAt(0, 0, 0);

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

	const geometry = new THREE.SphereGeometry(sunRadius, 16, 16);
	const mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.set(Math.PI / 2, 0, 0);

	three.scene.add(mesh);
}

function setupSpace() {
	const cameraZoomDistance = AUtoDistance * 60;

	const spacegeometry = new THREE.SphereGeometry(cameraZoomDistance, 16, 16);
	const spacematerial = new THREE.MeshBasicMaterial({
		map: planetTextures.space,
		side: THREE.BackSide,
	});
	const space = new THREE.Mesh(spacegeometry, spacematerial);

	// rotate the sphere so the texture is facing the camera
	space.rotation.x = Math.PI / 2;

	three.scene.add(space);
}

function drawOrbits() {
	// Draw orbital lines for each planet

	// Iterate through all planets
	planets.map((planet) => {
		drawOrbit(planet);

		renderPlanet(planet);
	});
}

function createOrbit(
	planet: PlanetOrbit,
	startDegree: number,
	endDegree: number,
): THREE.BufferGeometry {
	// Create the ThreeJS geometry for the orbit track

	// Initialise variables
	const geometry = new THREE.BufferGeometry();
	let vertexes: THREE.Vector3[] = [];
	var degree = endDegree * orbitResolution;

	// Get the correct initial vertex
	if (degree < 360 * orbitResolution) {
		const vertex = new THREE.Vector3(
			orbitalPositions[planet.value][degree][0],
			orbitalPositions[planet.value][degree][1],
			orbitalPositions[planet.value][degree][2],
		);
		vertexes.push(vertex);
	} else {
		const vertex = new THREE.Vector3(
			orbitalPositions[planet.value][0][0],
			orbitalPositions[planet.value][0][1],
			orbitalPositions[planet.value][0][2],
		);
		vertexes.push(vertex);
	}

	// Iterate through all orbit points between given bounds and add it to the vertexes
	while (degree > startDegree * orbitResolution) {
		degree -= 1;
		var orbitalPosition = orbitalPositions[planet.value][degree];
		const orbitalPositionVertex = new THREE.Vector3(
			orbitalPosition[0],
			orbitalPosition[1],
			orbitalPosition[2],
		);
		vertexes.push(orbitalPositionVertex);
	}

	return geometry.setFromPoints(vertexes);
}

function drawOrbit(planet: PlanetOrbit) {
	// Create the orbit
	const fullOrbit = new THREE.Group();

	const geometry = createOrbit(planet, 0, 360);
	const orbitMaterial = new THREE.LineBasicMaterial({
		color: planet['trackColour'],
	});

	const orbitPath = new THREE.Line(geometry, orbitMaterial);

	fullOrbit.add(orbitPath);

	// Add the orbit as the orbit mesh
	three.scene.add(fullOrbit);
	planet['orbitMesh'] = fullOrbit;
}

// function findPeriod(a: number) {
// 	// Find the period of a planet given the center and semi-major axis

// 	const gravitationalParameterAU = M3S2toAU3Y2(gravitationalParameter);

// 	// Calculate from Keplar's second law
// 	return Math.pow(
// 		((4 * Math.pow(Math.PI, 2)) / gravitationalParameterAU) *
// 			Math.pow(a, 3),
// 		1 / 2,
// 	); // Period in years. 1AU = 1 year
// }

function getCurrentDegree(planet: PlanetOrbit, time: number) {
	// Get the data
	var a = planet['a'];
	var L = planet.loPE;

	// Find the excesss time since the epoch, less than the period for ease of computiation
	var period = planet.period;

	var tempEpoch = EPOCH.getTime();

	var milliseconds = time - tempEpoch; // Milliseconds between EPOCH and current time
	var years = milliseconds * convertTime('MS', 'Y', 1); // Years since EPOCH

	// Find the remainder of the time from epoch
	var remainder = years % period;

	while (remainder < 0) {
		// Find the remainder from epoch
		remainder += period;
	}

	// Start from the epoch position
	var nextDegree = Math.round(L * orbitResolution) % (360 * orbitResolution);

	// Find the point where it is different
	var diffPoint = orbitalTimes[planet.value][0];

	// Set the boundaries
	var lowBound = 0;
	var midBound = nextDegree;
	var highBound = 360 * orbitResolution - 1;

	// Find which of the two sections the value is in - and set bounds
	if (remainder > diffPoint) {
		highBound = midBound;
	} else {
		lowBound = midBound;
	}

	// Initialise the degree
	var testDegree;

	// While it hasn't finalised the limits
	while (highBound - lowBound > 1) {
		// Find the degree to test and the value at that degree
		testDegree = Math.ceil((lowBound + highBound) / 2);
		var testValue = orbitalTimes[planet.value][testDegree];

		// Figure out how to move the boundaries
		if (testValue > remainder) {
			highBound = testDegree;
		} else {
			lowBound = testDegree;
		}
	}

	// Set the degree afterwards to the highest bound
	nextDegree = highBound;

	return nextDegree;
}

// Deliver a planet location given the current time
function findPlanetLocation(planet: PlanetOrbit, time: number): Vector3Tuple {
	const period = planet.period;
	let tempEpoch = planet.epoch ?? EPOCH;
	const milliseconds = time - tempEpoch.getTime(); // Milliseconds between EPOCH and current time
	const elapsedYears = milliseconds * convertTime('MS', 'Y', 1); // Years since EPOCH
	const epochDegree = planet.epochDegree ?? Math.round(planet['rL']);

	// Calculate the remainder of the orbital period
	const totalOrbits = elapsedYears / period;
	const remainder = elapsedYears % period;

	// Convert the remainder to degrees
	const degreesMoved = totalOrbits * 360;
	const percentageAlong = degreesMoved % 1;

	// Calculate the current degree position in the orbit and normalize it to the range [0, 360]
	let nextDegree = Math.round((epochDegree + degreesMoved) % 360);

	nextDegree = nextDegree == 360 ? 0 : nextDegree;

	// Find the next position
	const nextPosition = orbitalPositions[planet.value][
		nextDegree
	] as Vector3Tuple;

	return nextPosition;

	// const nextPosition = orbitalPositions[planet.value][
	// 	nextDegree
	// ] as Vector3Tuple;

	// // Find out the previous position
	// let previousDegree = nextDegree - 1;
	// previousDegree = previousDegree == -1 ? 359 : previousDegree;

	// if (planet.value == 'earth') {
	// 	console.log(animation.prevTick, {
	// 		percentageAlong,
	// 		nextDegree,
	// 		previousDegree,
	// 	});
	// }

	// const previousPosition = orbitalPositions[planet.value][previousDegree];

	// let diffArray = subVec(nextPosition, previousPosition);
	// diffArray = multiplyVec(percentageAlong, diffArray);

	// // 	// Resolve it into a new position vector
	// return addVec(previousPosition, diffArray) as Vector3Tuple;

	//planet.currentPercentage =

	//return nextPosition;

	// // let diffArray = subVec(nextPosition, previousPosition);
	// // diffArray = multiplyVec(percentageAlong, diffArray);

	// // // 	// Resolve it into a new position vector
	// // return addVec(previousPosition, diffArray) as Vector3Tuple;

	// // //const nextPosition = orbitalPositions[planet.value][nextDegree];
	// const nextPosition = new Vector3(
	// 	orbitalPositions[planet.value][nextDegree][0],
	// 	orbitalPositions[planet.value][nextDegree][1],
	// 	orbitalPositions[planet.value][nextDegree][2],
	// );

	// // // Find out the previous position
	// // let previousDegree = nextDegree - 1;
	// // previousDegree = previousDegree == -1 ? 359 : previousDegree;

	// const previousPosition = new Vector3(
	// 	orbitalPositions[planet.value][previousDegree][0],
	// 	orbitalPositions[planet.value][previousDegree][1],
	// 	orbitalPositions[planet.value][previousDegree][2],
	// );

	// const exactPosition = interpolateBetweenVectors(
	// 	previousPosition,
	// 	nextPosition,
	// 	percentageAlong,
	// );

	// // if (planet.value == 'earth') {
	// // 	console.log({ previousPosition, exactPosition, nextPosition });
	// // }

	// const returnPosition: Vector3Tuple = [
	// 	exactPosition.x,
	// 	exactPosition.y,
	// 	exactPosition.z,
	// ];

	// return returnPosition;
}

function interpolateBetweenVectors(
	start: Vector3,
	end: Vector3,
	percentageAlong: number,
): Vector3 {
	// Ensure the percentage is clamped between 0 and 1
	const clampedPercentage = Math.max(0, Math.min(1, percentageAlong));

	// Use the lerp function to interpolate between the two vectors
	return Vector3.lerp(start, end, clampedPercentage);
}

// // Deliver a planet location given the current time
// function findPlanetLocation(planet: PlanetOrbit, time: number) {
// 	const L = planet['rL'];

// 	// Find the excesss time since the epoch, less than the period for ease of computiation
// 	const period = planet.period;
// 	let tempEpoch = EPOCH;
// 	if (planet['epoch']) {
// 		// If a custom epoch, use that
// 		tempEpoch = planet['epoch'];
// 	}
// 	const milliseconds = time - tempEpoch.getTime(); // Milliseconds between EPOCH and current time
// 	const years = milliseconds * convertTime('MS', 'Y', 1); // Years since EPOCH

// 	// Find the remainer of the time from epoch
// 	let remainder = years % period;
// 	while (remainder < 0) {
// 		// Find the remainder from epoch
// 		remainder += period;
// 	}

// 	// Start from the epoch position
// 	let nextDegree = Math.round(L * orbitResolution) % (360 * orbitResolution);

// 	// Find the point where it is different
// 	const diffPoint = orbitalTimes[planet.value][0];

// 	// Set the boundaries
// 	let lowBound = 0;
// 	const midBound = nextDegree;
// 	let highBound = 360 * orbitResolution - 1;

// 	// Find which of the two sections the value is in - and set bounds
// 	if (remainder > diffPoint) {
// 		highBound = midBound;
// 	} else {
// 		lowBound = midBound;
// 	}

// 	// Initialise the degree
// 	let testDegree;

// 	// While it hasn't finalised the limits
// 	while (highBound - lowBound > 1) {
// 		// Find the degree to test and the value at that degree
// 		testDegree = Math.ceil((lowBound + highBound) / 2);
// 		const testValue = orbitalTimes[planet.value][testDegree];

// 		// Figure out how to move the boundaries
// 		if (testValue > remainder) {
// 			highBound = testDegree;
// 		} else {
// 			lowBound = testDegree;
// 		}
// 	}

// 	// Set the degree afterwards to the highest bound
// 	nextDegree = highBound;

// 	// Find out the previous position
// 	const previousDegree =
// 		(nextDegree + 360 * orbitResolution - 1) % (360 * orbitResolution);

// 	const previousArray = orbitalPositions[planet.value][previousDegree];

// 	// if (planet.value == 'mars') {
// 	// 	console.log({ nextDegree, previousDegree, remainder });
// 	// }

// 	// Move it between positions to ensure smooth animation - this is rather than jerking it from position to position
// 	let percentageAlong =
// 		(remainder - orbitalTimes[planet.value][previousDegree]) /
// 		(orbitalTimes[planet.value][nextDegree] -
// 			orbitalTimes[planet.value][previousDegree]);

// 	// if (planet.value == 'mars') {
// 	// 	console.log({ nextDegree, highBound });
// 	// }

// 	if (isNaN(percentageAlong)) {
// 		// if an error is throw new Error("Something bad happened.")n, just pick halfway
// 		percentageAlong = 0.5;
// 	}

// 	// // Save the current position
// 	// currentDegrees[planet.value] =
// 	// 	(previousDegree + percentageAlong) / orbitResolution;

// 	// Find the next position
// 	const nextArray = orbitalPositions[planet.value][nextDegree];

// 	// Find the difference and moderate by the percentage along, and generate the new position vector
// 	let diffArray = subVec(nextArray, previousArray);
// 	diffArray = multiplyVec(percentageAlong, diffArray);

// 	// Resolve it into a new position vector
// 	const array = addVec(previousArray, diffArray);

// 	// Return current position vector
// 	return array;
// }

function findPlanetDegree(planet: PlanetOrbit, position: number[]) {
	// This entire thing is reverse-deriving it by the same method used to generate the initial coords

	// Get initial data
	var e = planet['e'];
	var i = planet['i'];
	var a = planet['a'];
	var loPE = planet['loPE'];
	var loAN = planet['loAN'];
	var center = planet['center'];

	// if (
	// 	center != 'sun' &&
	// 	name != 'luna' &&
	// 	name != 'the moon' &&
	// 	name != 'ship'
	// ) {
	// 	if (planets[center]['axialTilt']) {
	// 		if (!planets[name]['loANeff'] || !planets[name]['ieff']) {
	// 			calculateEffectiveParams(name);
	// 		}

	// 		loAN = planets[name]['loANeff'];
	// 		i = planets[name]['ieff'];
	// 	}
	// }

	// Eccentric degree is how far away it is from the periapsis
	//var eccentricDegree = (360 + degree + loPE) % 360;

	// Convert it into needed formats
	//var degreesFromAN = DtoR(-degree - loAN);

	if (i == 0) {
		i = 0.000001;
	}

	var o = DtoR(loAN);
	i = DtoR(i);

	var distance = magnitude(position);

	// Recalculate position - see earlier in the program

	// Find initial degrees from the ascending node, set up tests
	var degreesFromAN = Math.asin(position[2] / (distance * Math.sin(i)));

	var testXOne =
		distance *
		(Math.cos(o) * Math.cos(degreesFromAN) -
			Math.sin(o) * Math.sin(degreesFromAN) * Math.cos(i));
	var testYOne =
		distance *
		(Math.sin(o) * Math.cos(degreesFromAN) +
			Math.cos(o) * Math.sin(degreesFromAN) * Math.cos(i));

	var degreesFromANTwo = (Math.PI - degreesFromAN) % (2 * Math.PI);

	var testXTwo =
		distance *
		(Math.cos(o) * Math.cos(degreesFromANTwo) -
			Math.sin(o) * Math.sin(degreesFromANTwo) * Math.cos(i));
	var testYTwo =
		distance *
		(Math.sin(o) * Math.cos(degreesFromANTwo) +
			Math.cos(o) * Math.sin(degreesFromANTwo) * Math.cos(i));

	// Create test positions
	var primary = [position[0], position[1], position[2]];
	var testOne = [testXOne, testYOne, position[2]];
	var testTwo = [testXTwo, testYTwo, position[2]];

	var distOne = magnitude(subVec(primary, testOne));
	var distTwo = magnitude(subVec(primary, testTwo));

	// Decide which section of the inverse sin to use based on which is closer
	if (distOne < distTwo) {
		degreesFromAN = RtoD(degreesFromAN);
	} else {
		degreesFromAN = RtoD(degreesFromANTwo);
	}

	// Find final degree
	var degree = -degreesFromAN - loAN;

	return ((360 - degree) % 360) - 1 / orbitResolution;
}

function generateOrbitalTimes(planet: PlanetOrbit) {
	// Calculate where the planet should be at a given time

	// Get the correct data
	var a = planet['a'];
	var L = planet['rL'] ?? planet['loPE'];
	//var center = planet["center"];
	var gravitationalParameter = planet.gravParam;
	gravitationalParameter = M3S2toAU3Y2(gravitationalParameter);

	// The inital degree starts at its position at epoch - because the time is zero at 0 remainer time
	var degree = Math.round(L * orbitResolution) % (360 * orbitResolution);

	// Initialise storage variables
	orbitalTimes[planet.value] = {};
	orbitalVelocities[planet.value] = {};
	orbitalTimes[planet.value][degree] = 0;

	// Initialise iterator variables
	var timesum = 0;
	var counter = 1;

	// Iterate through each degree and find the time at each
	while (counter < 360 * orbitResolution) {
		// Move the degree forward
		degree = (degree + 1) % (360 * orbitResolution);
		var currentDegree = degree % (360 * orbitResolution);

		// Find the positions, and the distance between
		var arrayOne = orbitalPositions[planet.value][currentDegree];
		var arrayTwo =
			orbitalPositions[planet.value][
				(currentDegree + 1) % (360 * orbitResolution)
			];

		var distance = magnitude(subVec(arrayOne, arrayTwo));

		// Find the velocity at this point
		var velocity = 1;

		// Math.pow(
		// 	gravitationalParameter * (2 / magnitude(arrayOne) - 1 / a),
		// 	0.5,
		// );

		// Also store this velocity in the orbital velocities part
		orbitalVelocities[planet.value][degree] = {
			velocity: velocity,
			distance: distance,
			time: distance / velocity,
		};

		// Additive time calculated by how long it takes to get between that small segment
		timesum += distance / velocity;
		orbitalTimes[planet.value][degree] = timesum;

		// Move the counter foward
		counter += 1;
	}

	// Finish it off by making the last be the full period
	degree =
		(Math.round(L * orbitResolution) - 1 + 360 * orbitResolution) %
		(360 * orbitResolution);

	orbitalTimes[planet.value][degree] = planet.period;
}

function generateOrbitalCoords(planet: PlanetOrbit) {
	// Iterate through and calculate all orbital positions for a planet and store them.

	// Initialise the degree and co-ordinates
	var degree = 360;
	var coords = [];

	while (degree > 0) {
		// Iterate through every one of the 360 * orbitResolution points and add to array
		degree -= 1 / orbitResolution;
		var array = calculateOrbitalPositionVector(
			planet,
			degree,
			AUtoDistance,
		);
		coords.push(array);
	}

	// Store for later use to prevent excessive calculation
	orbitalPositions[planet.value] = coords;
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

	const now = Math.round((FPS * window.performance.now()) / 1000);

	if (now == animation.prevTick) return;
	// only do logic updates once every fixed frame. To reduce logic calls.
	// updateConstants();
	// Move time forward only during simulation
	currentTime = new Date(currentTime.getTime() + timeIncrement);
	// displayTime = new Date(currentTime.getTime() + timeDiff);

	updatePlanets();

	animation.prevTick = now;
}

function updatePlanets() {
	planets.map((planet) => {
		updatePlanet(planet);
	});
}

function updatePlanet(planet: PlanetOrbit) {
	if (!planet.planetMesh) return;

	const position = findPlanetLocation(
		planet,
		currentTime.getTime(),
	) as Vector3Tuple;

	planet.planetMesh.position.set(...position);
}

// Called once during startup to create the planet and fix some values
function renderPlanet(planet: PlanetOrbit) {
	// Create the planetary surface and marker
	const material = new THREE.MeshLambertMaterial({
		side: THREE.FrontSide,
		color: planet.colour,
		emissive: planet.colour,
		emissiveIntensity: 0.8,
	});

	const geometry = new THREE.SphereGeometry(20, 16, 16); // planet.r * 100000
	planet.planetMesh = new THREE.Mesh(geometry, material);
	planet.planetMesh.rotation.set(Math.PI / 2, 0, 0);

	updatePlanet(planet);

	three.scene.add(planet.planetMesh);
}
</script>
