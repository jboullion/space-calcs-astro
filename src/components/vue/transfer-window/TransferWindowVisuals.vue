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

import { removeAllChildNodes } from '../utils';
import {
	planet,
	planetTextures,
	three,
	EPOCH,
	gravitationalParameter,
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
import { getGeometryRoughness } from 'three/examples/jsm/nodes/Nodes.js';

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

const now = new Date();
let displayTime = now;
let currentTime = new Date(); // May not actually be now, just when it is displayed
const newDate = ref(currentTime);
const timeDiff = displayTime.getTime() - currentTime.getTime();
const timeScale = 30; // Number of increments per second
const apparentTimeRate = 3600 * 24; // Rate at which time passes in sim seconds / real second
const timeRate = 3600 * 24 * 7; // Rate at which time passes in sim seconds / computational second
const timeIncrement = (timeRate * 1000) / timeScale; // Simulation time to add per time increment

// Orbit Variables
const orbitResolution = 1; // Could probably reduce this to 1 or 0.5 to reduce the number of points calculated
const orbitalTimes: OrbitalTime = {};
const orbitalVelocities: OrbitalVelocity = {};
const orbitalPositions: OrbitalPosition = {};
const currentDegrees: OrbitalDegree = {};

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
	// 	textureDir + '2k_mercury.jpg',
	// );
	// planetTextures.venus = await textureLoader.load(
	// 	textureDir + '2k_venus_atmosphere.jpg',
	// );
	// planetTextures.earth = await textureLoader.load(
	// 	textureDir + '4k_earth_day.jpg',
	// );
	// planetTextures.mars = await textureLoader.load(textureDir + '2k_mars.jpg');
	// planetTextures.jupiter = await textureLoader.load(
	// 	textureDir + '2k_jupiter.jpg',
	// );
	// planetTextures.saturn = await textureLoader.load(
	// 	textureDir + '2k_saturn.jpg',
	// );
	// planetTextures.uranus = await textureLoader.load(
	// 	textureDir + '2k_uranus.jpg',
	// );
	// planetTextures.neptune = await textureLoader.load(
	// 	textureDir + '2k_neptune.jpg',
	// );
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

	// Find the center and central coordinates
	//const centerCoords = [0, 0, 0];

	// Find where the planet should be
	//const planetLocation = findPlanetLocation(planet, currentTime.getTime());
	// currentPositions[planet.value] = addVec(
	// 	planetLocation,
	// 	centerCoords,
	// ) as Vector3Tuple;
}

/**
 *
 * @param a Create an elipse curve for the orbit. For simple visualizatinos this is really nice!
 * @param planet The planet to use from the planets.ts constants
 */
// function createOrbit(planet: PlanetOrbit) {
// 	// Define the EllipseCurve parameters
// 	const aX = 0;
// 	const aY = 0;
// 	const xRadius = planet.a * AUtoDistance; // Semi-major axis
// 	const yRadius = (planet.semiMinorAxis ?? planet.a) * AUtoDistance; // Semi-minor axis
// 	const aStartAngle = 0;
// 	const aEndAngle = 2 * Math.PI;
// 	const aClockwise = false;
// 	const aRotation = 0;

// 	// Eccentricity of the ellipse (example value)
// 	const eccentricity = planet.e;

// 	// Calculate the offset (focal distance)
// 	const focalDistance = xRadius * eccentricity;

// 	// Create the EllipseCurve
// 	const ellipseCurve = new THREE.EllipseCurve(
// 		aX,
// 		aY,
// 		xRadius,
// 		yRadius,
// 		aStartAngle,
// 		aEndAngle,
// 		aClockwise,
// 		aRotation,
// 	);

// 	// Convert the EllipseCurve to a Path and then to a BufferGeometry
// 	//const path = new THREE.Path(ellipseCurve.getPoints(100)); // 100 points for smoothness
// 	const geometry = new THREE.BufferGeometry().setFromPoints(
// 		ellipseCurve.getPoints(100),
// 	);

// 	// Create the Line material
// 	const material = new THREE.LineBasicMaterial({ color: planet.trackColour });

// 	// Create the Line using the geometry and material
// 	const orbit = new THREE.Line(geometry, material);

// 	// Rotate the orbit to the correct inclination / plane
// 	orbit.rotation.x = planet.i * (Math.PI / 180);
// 	orbit.position.x = -focalDistance;

// 	// Add the orbit line to the scene
// 	three.scene.add(orbit);
// }

function findPeriod(a: number, planet: PlanetOrbit) {
	// Find the period of a planet given the center and semi-major axis

	// Calculate from Keplar's second law
	return Math.pow(
		((4 * Math.pow(Math.PI, 2)) / gravitationalParameter) * Math.pow(a, 3),
		1 / 2,
	); // Period in years. 1AU = 1 year
}

function getCurrentDegree(planet: PlanetOrbit, time: number) {
	// Get the data
	var a = planet['a'];
	var L = planet.loPE;

	// Find the excesss time since the epoch, less than the period for ease of computiation
	var period = findPeriod(a, planet);

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

function findPlanetLocation(planet: PlanetOrbit, time: number) {
	// TODO: We need to find a way to calculate the position of the planet at a given time
	// I believe we have all the orbital positions calculated, but now we need to find where in that orbit a planet is at a given time
	// Ideally we will find the # of degrees from the epoch time, and then find the position at that degree

	// // // Deliver a planet location given the current time
	// // Get the data
	// var a = planet['a'];
	// var L = planet.loPE;

	// // Find the excesss time since the epoch, less than the period for ease of computiation
	// var period = findPeriod(a, planet);

	// var tempEpoch = EPOCH.getTime();

	// var milliseconds = time - tempEpoch; // Milliseconds between EPOCH and current time
	// var years = milliseconds * convertTime('MS', 'Y', 1); // Years since EPOCH

	// // Find the remainder of the time from epoch
	// var remainder = years % period;

	// while (remainder < 0) {
	// 	// Find the remainder from epoch
	// 	remainder += period;
	// }

	// const currentDegree = Math.floor(360 / 1 + remainder);
	// var diffPoint = orbitalPositions[planet.value][0];
	// console.log({ period });

	// Reference date: Jan 12, 2000
	const reference_date = EPOCH.getTime();
	// Orbital period of Earth in days (approximate)
	const orbital_period_days = planet.period;

	// Current date
	const current_date = EPOCH.getTime();

	// Calculate the number of days since the reference date
	const elapsed_days =
		(current_date - reference_date) / (1000 * 60 * 60 * 24);

	// Calculate the percentage of the orbital period completed
	const orbital_progress =
		(elapsed_days % orbital_period_days) / orbital_period_days;

	// Calculate the position in degrees (0 to 360)
	const position_degrees = Math.floor(orbital_progress * 360);

	console.log({ elapsed_days, position_degrees });

	// Return current position vector
	return orbitalPositions[planet.value][position_degrees] as Vector3Tuple;

	// // Get the data
	// var a = planet['a'];
	// var L = planet.loPE;

	// // Find the excesss time since the epoch, less than the period for ease of computiation
	// var period = findPeriod(a, planet);

	// var tempEpoch = EPOCH.getTime();

	// var milliseconds = time - tempEpoch; // Milliseconds between EPOCH and current time
	// var years = milliseconds * convertTime('MS', 'Y', 1); // Years since EPOCH

	// // Find the remainder of the time from epoch
	// var remainder = years % period;

	// while (remainder < 0) {
	// 	// Find the remainder from epoch
	// 	remainder += period;
	// }

	// // console.log({ time });

	// // Start from the epoch position
	// //var nextDegree = currentDegrees[planet.value]; //Math.round(L * orbitResolution) % (360 * orbitResolution);
	// var nextDegree = Math.round(L * orbitResolution) % (360 * orbitResolution);

	// // Find the point where it is different
	// var diffPoint = orbitalTimes[planet.value][0];

	// // Set the boundaries
	// var lowBound = 0;
	// var midBound = nextDegree;
	// var highBound = 360 * orbitResolution - 1;

	// // Find which of the two sections the value is in - and set bounds
	// if (remainder > diffPoint) {
	// 	highBound = midBound;
	// } else {
	// 	lowBound = midBound;
	// }

	// // Initialise the degree
	// var testDegree;

	// // While it hasn't finalised the limits
	// while (highBound - lowBound > 1) {
	// 	// Find the degree to test and the value at that degree
	// 	testDegree = Math.ceil((lowBound + highBound) / 2);
	// 	var testValue = orbitalTimes[planet.value][testDegree];

	// 	// Figure out how to move the boundaries
	// 	if (testValue > remainder) {
	// 		highBound = testDegree;
	// 	} else {
	// 		lowBound = testDegree;
	// 	}
	// }

	// // Set the degree afterwards to the highest bound
	// nextDegree = highBound;

	// // Find out the previous position
	// var previousDegree =
	// 	(nextDegree + 360 * orbitResolution - 1) % (360 * orbitResolution);
	// var previousArray = orbitalPositions[planet.value][previousDegree];

	// // Move it between positions to ensure smooth animation - this is rather than jerking it from position to position
	// var percentageAlong =
	// 	(remainder - orbitalTimes[planet.value][previousDegree]) /
	// 	(orbitalTimes[planet.value][nextDegree] -
	// 		orbitalTimes[planet.value][previousDegree]);
	// if (isNaN(percentageAlong)) {
	// 	// if an error is throw new Error("Something bad happened.")n, just pick halfway
	// 	percentageAlong = 0.5;
	// }

	// currentDegrees[planet.value] =
	// 	(previousDegree + percentageAlong) / orbitResolution;

	// // Find the next position
	// var nextArray = orbitalPositions[planet.value][nextDegree];

	// // Find the difference and moderate by the percentage along, and generate the new position vector
	// var diffArray = subVec(nextArray, previousArray);
	// diffArray = multiplyVec(percentageAlong, diffArray);

	// // Resolve it into a new position vector
	// var array = addVec(previousArray, diffArray);

	// // Return current position vector
	// return array;
}

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

// function findVelocity(planet: PlanetOrbit, time: number) {
// 	// Return velocity at a given time of a planet

// 	// Find position and then the degree to match with other knowledge
// 	var position = findPlanetLocation(planet, time);
// 	var degree =
// 		Math.round((360 + vectorToAngle(position)) * orbitResolution) %
// 		(360 * orbitResolution);

// 	var newDegree = Math.round(
// 		findPlanetDegree(planet, position) * orbitResolution,
// 	);
// 	if (!isNaN(newDegree)) {
// 		degree = (360 * orbitResolution + newDegree) % (360 * orbitResolution);
// 	}

// 	// Find the infintesimal change in distance and time
// 	var deltaTime =
// 		orbitalTimes[planet.value][(degree + 1) % (360 * orbitResolution)] -
// 		orbitalTimes[planet.value][degree];
// 	//deltaTime = findPeriod(planets[name].a, planets[name].center)
// 	var deltaDist = subVec(
// 		orbitalPositions[planet.value][(degree + 1) % (360 * orbitResolution)],
// 		orbitalPositions[planet.value][degree],
// 	);

// 	// Velocity = distance / time, except to find a vector velocity, use a vector distance
// 	var velocityVec = multiplyVec(1 / deltaTime, deltaDist);

// 	// Set the magnitude of the velocity according to the viz-viva equation
// 	var velMag = Math.sqrt(
// 		M3S2toAU3Y2(planet.gravParam) *
// 			(2 / magnitude(position) - 1 / planet['a']),
// 	);
// 	velocityVec = setMagnitude(velocityVec, velMag);

// 	// Return the velocity in vector form
// 	return velocityVec;
// }

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

		//console.log({ arrayOne, arrayTwo });
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

	orbitalTimes[planet.value][degree] = findPeriod(a, planet);
	// console.log('orbitalTimes', orbitalTimes);
	// console.log(
	// 	'orbitalTimes[planet.value][degree]',
	// 	orbitalTimes[planet.value][degree],
	// );
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
	const now = Math.round((30 * window.performance.now()) / 1000);

	if (now == animation.prevTick) return;
	// only do logic updates once every fixed frame. To reduce logic calls.

	// // Move time forward only during simulation
	// currentTime = new Date(currentTime.getTime() + timeIncrement);
	// displayTime = new Date(currentTime.getTime() + timeDiff);

	//updatePlanets();

	animation.prevTick = now;
}

// function updatePlanets() {
// 	planets.map((planet) => {
// 		updatePlanet(planet);
// 	});
// }

function updatePlanet(planet: PlanetOrbit) {
	if (!planet.planetMesh) return;
	// Move planet to correct position and rotation

	// Gather needed data
	//var L = planet['rL'] ?? planet['loPE'];
	//var center = planet['center'];
	var centerCoords = [0, 0, 0]; //currentPositions[center];

	// Find position relative to the center and to Sol

	var relCenterPos = findPlanetLocation(planet, currentTime.getTime());
	console.log({ relCenterPos });

	var relSolPos = addVec(relCenterPos, centerCoords) as Vector3Tuple;

	// // Update current positions
	// currentPositions[planet.value] = relSolPos;

	//console.log({ relSolPos });

	planet.planetMesh.position.set(...relSolPos);
}

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
