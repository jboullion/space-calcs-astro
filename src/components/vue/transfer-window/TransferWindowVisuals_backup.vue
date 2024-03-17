<template>
	<div class="calc-form">
		<div class="d-flex justify-content-between mb-3">
			<button
				class="btn btn-primary btn-lg px-5"
				@click="calculateIPTransfer()"
			>
				<i class="fas fa-calculator"></i>
			</button>
			<button class="btn btn-primary btn-lg px-5" @click="playTransfer">
				<i class="fas" :class="playClass"></i>
			</button>
			<h3 class="mb-0">{{ currentDateString }}</h3>
		</div>
		<div
			id="transfer-window-canvas"
			class="canvas-wrapper border"
			style="position: relative; padding-top: 75%; width: 100%"
		>
			<i
				v-if="loading"
				class="fas fa-cog fa-spin mb-0 h1 position-absolute top-50 start-50"
			></i>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import {
// 	CSS2DObject,
// 	CSS2DRenderer,
// } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import { throttle } from '../../../utils/utils';
import {
	planet,
	planetTextures,
	three,
	EPOCH,
	gravitationalParameter,
	gravitationalParameterAU,
} from './constants';

import type {
	PlanetOrbit,
	ITransferWindowForm,
	OrbitalPosition,
	OrbitalTime,
	OrbitalVelocity,
	Vector3Tuple,
	ScalarInput,
	VectorInput,
	TransferFormat,
	TransferData,
	Maneuver,
} from './types';

import { SUN, planets } from './planets';
import {
	M3S2toAU3Y2,
	convertTime,
	magnitude,
	subVec,
	multiplyVec,
	addVec,
	parseScalarInput,
	calculateSynodicPeriod,
	divide,
	multiply,
	add,
	subtract,
	parseVectorInput,
	outputScalar,
	vectorMagnitude,
	outputVector,
	cos,
	pow,
	sin,
	tan,
	convertDistance,
	vectorToAngle,
	DtoR,
	RtoD,
	setMagnitude,
	angleBetweenVectors,
	calculateTime,
	validTransfer,
} from './functions';

import { calculateOrbitalPositionVector } from './functions-ts';
// import { getGeometryRoughness } from 'three/examples/jsm/nodes/Nodes.js';

const props = defineProps<{
	formData: ITransferWindowForm;
}>();

const loading = ref(true);
const textureDir = '/textures/';
const play = ref(false);

// const AURatio = 100000; // dividing our actual AU by this number to make it easier to work with
const AUtoDistance = 1000; // Turn AU into on screen distance
const animation = {
	prevTick: 0,
	complete: false,
	FPS: 24,
};

// Time Variables
let currentTime = ref(new Date()); // May not actually be now, just when it is displayed
const timeScale = 30; // Number of increments per second
let timeRate = 3600 * 24 * 7; // Rate at which time passes in sim seconds / computational second
let timeIncrement = (timeRate * 1000) / timeScale; // Simulation time to add per time increment

// Orbit Variables
const orbitResolution = 1; // Could probably reduce this to 1 or 0.5 to reduce the number of points calculated
const orbitalTimes: OrbitalTime = {};
const orbitalVelocities: OrbitalVelocity = {};
const orbitalPositions: OrbitalPosition = {};

// Transfer Variables
let transitWindows: {
	[key: number]: any;
} = {};
let totalCalculations = 0;
let inSecondStage = false;
let storedWindows: TransferFormat[] = [];
let lowestDeltaVee: ScalarInput = parseScalarInput(Math.pow(10, 10), 'm/s');
let transTime: Date;
let twoStage = false;
let lastTimeRatio = 1;
let timeRatio = 1;
let lowestData: TransferFormat;
let storedTransferData: TransferData;
let returnData: any;
let timeEstimateUpdated = false;
let messageUpdated = false;

const debouncedResize = throttle(onWindowResize, 32);
/**
 *
 *
 * SETUP
 *
 *
 */

onMounted(async () => {
	await loadModels();

	updateCoords();

	setupScene();

	window.addEventListener('resize', debouncedResize, { passive: true });
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', debouncedResize);
});

/**
 *
 *
 * COMPUTED
 *
 *
 */
const playClass = computed(() => {
	if (!animation.complete) {
		if (!play.value) {
			return 'fa-play';
		} else {
			return 'fa-pause';
		}
	} else {
		return 'fa-undo';
	}
});

const currentDateString = computed(() => {
	const options = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	};

	// @ts-ignore
	return currentTime.value.toLocaleDateString('en-us', options);
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
	// planetTextures.sun = await textureLoader.load(textureDir + '2k_sun.jpg');

	planetTextures.space = await textureLoader.load(
		textureDir + '2k_stars_milky_way.jpg',
	);
}

function setupScene() {
	setupThreeJS();
	setupSceneObjects();

	loading.value = false;

	if (!animation.prevTick) {
		animate();
	}
}

function setupSceneObjects() {
	if (three.scene) {
		clearScene();
	}

	setupSun();
	setupSpace();
	drawOrbits();
}

function clearScene(): void {
	while (three.scene.children.length > 0) {
		three.scene.remove(three.scene.children[0]);
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

	updateRenderSize();
	setupCamera();

	// three.labelRenderer = new CSS2DRenderer();

	// three.labelRenderer.setSize(width, height);
	// three.labelRenderer.domElement.style.position = 'absolute';
	// three.labelRenderer.domElement.style.top = '0px';
	// three.labelRenderer.domElement.style.pointerEvents = 'none';
	// three.canvas.appendChild(three.labelRenderer.domElement);

	// Lights
	three.scene.add(new THREE.AmbientLight(0x404040));

	// TODO: Possibly create a point light for the sun
	//const light = new THREE.DirectionalLight(0xffffff, 0.5);
	//three.scene.add(light);

	// // GUI
	// this.three.gui = new dat.GUI( { autoPlace: false } );
	// this.three.canvas.appendChild(this.three.gui.domElement);
}

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

function setupCamera() {
	if (!three.renderer) return;

	// Camera
	const cameraPositionDistance = AUtoDistance * 2.5;
	const cameraZoomDistance = AUtoDistance * 100;

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
		//map: planetTextures.sun,
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

function animate() {
	if (!three.renderer) return;
	if (!three.controls) return;
	if (loading.value) return;

	requestAnimationFrame(animate);

	three.controls.update();

	//this.three.camera.position.clamp(this.three.minMovement, this.three.maxMovement);
	three.renderer.render(three.scene, three.camera);
	if (three.labelRenderer)
		three.labelRenderer.render(three.scene, three.camera);

	// clamp to fixed framerate

	const now = Math.round((animation.FPS * window.performance.now()) / 1000);

	if (now == animation.prevTick) return;

	if (!play.value) return;

	// Move time forward only during simulation
	currentTime.value = new Date(currentTime.value.getTime() + timeIncrement);

	updatePlanets();

	animation.prevTick = now;
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

/**
 * SETUP Functions
 */
function playTransfer() {
	if (animation.complete) {
		return;
	}

	play.value = !play.value;
}

function updatePlanets() {
	planets.map((planet) => {
		updatePlanet(planet);
	});
}

function updateCoords() {
	// Setup planet data for current time
	planets.map((planet) => {
		generateOrbitalCoords(planet);
		generateOrbitalTimes(planet);
	});
}

function updatePlanet(planet: PlanetOrbit) {
	if (!planet.planetMesh) return;

	const position = findPlanetLocation(
		planet,
		currentTime.value.getTime(),
	) as Vector3Tuple;

	planet.planetMesh.position.set(...position);
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

// Deliver a planet location given the current time
function findPlanetLocation(planet: PlanetOrbit, time: number): Vector3Tuple {
	const period = planet.period;
	let tempEpoch = planet.epoch ?? EPOCH;
	const milliseconds = time - tempEpoch.getTime(); // Milliseconds between EPOCH and current time
	const elapsedYears = milliseconds * convertTime('MS', 'Y', 1); // Years since EPOCH
	const epochDegree = planet.epochDegree ?? Math.round(planet['rL']);

	// Calculate the remainder of the orbital period
	const totalOrbits = elapsedYears / period;

	// Convert the remainder to degrees
	const degreesMoved = totalOrbits * 360;
	const percentageAlong = degreesMoved % 1;

	// Calculate the current degree position in the orbit and normalize it to the range [0, 360]
	let nextDegree = Math.floor((epochDegree + degreesMoved) % 360);

	nextDegree = nextDegree == 360 ? 0 : nextDegree;

	const nextPosition = orbitalPositions[planet.value][
		nextDegree
	] as Vector3Tuple;

	let previousDegree = nextDegree - 1;
	previousDegree = previousDegree == -1 ? 359 : previousDegree;

	const previousPosition = orbitalPositions[planet.value][previousDegree];

	let diffArray = subVec(nextPosition, previousPosition);
	diffArray = multiplyVec(percentageAlong, diffArray);

	// Resolve it into a new position vector
	return addVec(previousPosition, diffArray) as Vector3Tuple;
}

/**
 * TRANSFER FUNCTIONS
 */

function calculateIPTransfer() {
	// Calculate an interplanetary transfer

	// Set the initial transit time - this is used for evaluating efficiency
	transTime = new Date();

	// // Stop a transit if one is in progress
	// if (shipEndTime) {
	// 	endShipTransit();
	// }

	// // Hide the delta vee display, to reset
	// document.getElementById('deltaVeeDisplay').style.display = 'none';

	// Clear maneuvers list
	let maneuvers: Maneuver[] = [];

	// Import and format names correctly
	var properNameTwo = props.formData.destination.name; //document.getElementById('toTarget').value.replace('The ', '');
	var nameOne = props.formData.origin.value; //document.getElementById('fromTarget').value.toLowerCase();
	var nameTwo = props.formData.destination.value; //document.getElementById('toTarget').value.toLowerCase();

	// Decide which mode of Lambert calculation should be used
	// TODO: Set up a prop for porkchop plot generation on formData
	twoStage = false; //!document.getElementById('IPPorkchop').checked;

	if (nameOne == nameTwo) {
		// Stop them fron transferring between the same planets - doesn't really work
		// TODO: Figure out how to show an error to the user. Possibly do so on the form side?
		// swal('Error', 'You must select two different planets', 'error');
	} else {
		// Import parking orbit parameters
		var fromRadius = props.formData.originOrbit; // document.getElementById('fromDistanceAbove').value;
		var toRadius = props.formData.destinationOrbit; //document.getElementById('fromDistanceAbove').value;

		// Add Trans-NAME Injection to the maneuvers list - This is moving out to escape velocity
		maneuvers.push({
			name: 'T' + properNameTwo[0] + 'I',
			title: 'Trans-' + properNameTwo + ' Injection',
			deltaVee: calculateEscapeVelocity(
				props.formData.origin,
				fromRadius,
			),
		});

		// Stop people from activating transfer  too many times
		// TODO: Freeze the form while the transfer is in progress?
		// document.getElementById('IPTransferButton').disabled = true;
		// document.getElementById('ILTransferButton').disabled = true;

		// Run the main transfer engine
		calculateLambertTransfer(
			props.formData.origin,
			props.formData.destination,
			fromRadius,
			toRadius,
		);

		storedTransferData = {
			//@ts-ignore
			maneuvers: maneuvers,
			originPlanet: props.formData.origin,
			destinationPlanet: props.formData.destination,
			properNameTwo: properNameTwo,
			fromRadius: fromRadius,
			toRadius: toRadius,
		};

		delayIPTransfer();
	}
}

// // TODO: Set up THREE.JS stop rendering function.
// function startTransferCalc() {
// 	// Stop all calculation and rendering while calculating a transfer
// 	calculatingTransfer = true;

// 	// Stop asking for animation frames
// 	cancelAnimationFrame(animator);
// }

// Lambert Ballistic Transfer Calculator Functions

function calculateLambertTransfer(
	originPlanet: PlanetOrbit,
	destinationPlanet: PlanetOrbit,
	originOrbit: number,
	destinationOrbit: number,
) {
	// Calculate the transfer between two planets
	// I will try and explain the maths, but to see the full derivations, check the credits page - I've used the same variable names

	// // Disable logged transfer
	// loggedTransfer = false;

	// Stop the simulation from running to speed it up
	// TODO: Set up THREE.JS stop rendering function.
	// startTransferCalc();

	// // Reset all systems - stop people from messing it up while the program is busy
	// document.getElementById('disabledCover').style.display = 'block';
	// if (!webVR) {
	// 	document.getElementById('shipViewDiv').style.display = 'block';
	// }

	// TODO: Reset previous transfer calculations
	// resetShipSystems();

	// Initialise empty transit windows
	transitWindows = {};

	// Bring up the loading screen
	loading.value = true;

	// document.getElementById('loadingScreen').style.display = 'block';
	// if (stereoDisp) {
	// 	document.getElementById('loadingScreenAux').style.display = 'block';
	// }

	// // Get the initial Message
	// message =
	// 	loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

	// Import needed variables
	//var center = planets[nameOne]['center'];
	var startTime = currentTime.value.getTime();
	var aOne = parseScalarInput(originPlanet['a'], 'AU');
	var aTwo = parseScalarInput(destinationPlanet['a'], 'AU');

	// // Find and convert gravitational parameter
	// var gravitationalParameter = parseScalarInput(
	// 	findGravParam(center),
	// 	'm^3/s^2',
	// );

	// Calculate periods
	// var periodOne = parseScalarInput(
	// 	findPeriod(aOne.value * convertDistance('M', 'AU'), center),
	// 	'y',
	// );
	// var periodTwo = parseScalarInput(
	// 	findPeriod(aTwo.value * convertDistance('M', 'AU'), center),
	// 	'y',
	// );
	var synodicPeriod = parseScalarInput(
		calculateSynodicPeriod(originPlanet.period, destinationPlanet.period),
		'y',
	); // Synodic Period in years

	// Calculate boundary limits on the iterator
	var smallPeriod;
	if (originPlanet.period > destinationPlanet.period) {
		smallPeriod = destinationPlanet.period;
	} else {
		smallPeriod = originPlanet.period;
	}
	var tofMargin = divide(smallPeriod, parseScalarInput(Math.pow(10, 7), ''));

	// Get a guesstimate of the semi-latus rectum (p)
	var largeSemiMajor;
	var smallSemiMajor;
	var largeE;
	var smallE;
	if (aOne.value > aTwo.value) {
		largeSemiMajor = aOne;
		smallSemiMajor = aTwo;
		largeE = parseScalarInput(originPlanet['e'], '');
		smallE = parseScalarInput(destinationPlanet['e'], '');
	} else {
		largeSemiMajor = aTwo;
		smallSemiMajor = aOne;
		largeE = parseScalarInput(originPlanet['e'], '');
		smallE = parseScalarInput(destinationPlanet['e'], '');
	}

	// Define bounding parameters - this is a VERY rough (hence why the rest is needed) Hohmann transfer orbit for dynamic calculation and estimation
	var outerPoint = multiply(
		largeSemiMajor,
		add(parseScalarInput(1, ''), largeE),
	);
	var innerPoint = multiply(
		smallSemiMajor,
		subtract(parseScalarInput(1, ''), smallE),
	);

	var transitA = divide(add(outerPoint, innerPoint), parseScalarInput(2, ''));
	//var transitA = ((largeSemiMajor * (1 + largeE)) + (smallSemiMajor * (1 - smallE))) / 2;

	const transitPeriod = findPeriod(
		// @ts-ignore
		transitA.value * convertDistance('M', 'AU'),
	);
	var periodT = parseScalarInput(transitPeriod, 'y');
	//var periodT = findPeriod(transitA, center);

	// Define the resolution - this means looking at resolution squared windows
	var resolution = 100; //200;
	if ((timeRatio + lastTimeRatio) / 2 > 1.5 && !twoStage) {
		console.log(
			'Calculating Low Resolution Transfer - Slow Running Computer',
		);
		resolution = 100;
	}
	totalCalculations = 0;

	// Two-stage transfer calculation data
	var globalResolution = 200;
	var firstResolution = 20; // This MUST divide cleanly into the global resolution
	var secondResolution = globalResolution / firstResolution;
	var windowsNum = 5;
	storedWindows = [];
	if (twoStage) {
		resolution = firstResolution;
	}
	inSecondStage = false;

	// Define limits
	var upperTransitBound = 0.3; //0.9; TODO: SET THIS BACK TO 0.9
	var lowerTransitBound = 0.1;
	// @ts-ignore
	var increment = divide(
		synodicPeriod,
		parseScalarInput(resolution, ''),
	) as ScalarInput;
	// @ts-ignore
	var timeIncrement = divide(
		multiply(
			parseScalarInput(upperTransitBound - lowerTransitBound, ''),
			periodT,
		),
		parseScalarInput(resolution, ''),
	) as ScalarInput;

	console.log({ increment, timeIncrement });

	//var timeIncrement = (upperTransitBound - lowerTransitBound) * periodT / resolution;

	// // Define the radial position vectors
	// var rOne = [];
	// var rTwo = [];

	// Keep track of the data - lowest data contains the best transit data, the lowest DV keeps track of whether a new one is better
	// @ts-ignore
	lowestData = {};
	lowestDeltaVee = parseScalarInput(Math.pow(10, 10), 'm/s');

	// Keep track of the timing of the transfer in the consolte
	console.log('Calculating Transfer...');

	var calcData = {
		startTime: startTime,
		gravParam: gravitationalParameter,
		tofMargin: tofMargin,
		distOne: originOrbit,
		distTwo: destinationOrbit,
		synPeriod: synodicPeriod,
		windowsNum: windowsNum,
	};

	for (
		var deptTime = 0;
		deptTime < synodicPeriod.value;
		deptTime += increment.value
	) {
		// Iterate through departure times - once it reaches the synodic period, it should have found one

		// Clear out a window so it can assign more transfers
		transitWindows[deptTime] = {};

		for (
			var travelTime = periodT.value * lowerTransitBound;
			travelTime < periodT.value * upperTransitBound;
			travelTime += timeIncrement.value
		) {
			// Iterate through transit times
			setTimeout(
				function (deptTime, travelTime) {
					// Set timeout to allow program to function for computation - parameters passed at other end

					calculateTransferWindow(
						deptTime,
						travelTime,
						originPlanet,
						destinationPlanet,
						calcData,
					);
				},
				0,
				deptTime,
				travelTime,
			); // This passes the parameters inside so it doesn't calculate 40,000 of just the final variables
		}
	}

	if (twoStage) {
		// TOOD: Set up two stage transfer once single stage is working
		// var miscData = {
		// 	secondResolution: secondResolution,
		// };
		// setTimeout(function () {
		// 	// Wait for the transfer calculator to finish up BEFORE running this - it must have found the best one
		// 	secondTransferStage(
		// 		nameOne,
		// 		nameTwo,
		// 		increment.value,
		// 		timeIncrement.value,
		// 		miscData,
		// 		calcData,
		// 	);
		// }, 0);
	} else {
		setTimeout(function () {
			// Wait for the transfer calculator to finish up BEFORE running this - it must have found the best one
			finaliseTransferCalc();
		}, 0);
	}
}

function finaliseTransferCalc() {
	console.log('Deriving Parameters...');

	finishLambertCalculation();

	// // Keep track  of name data for eventual display
	// //lowestData["nameOne"] = nameOne;
	// //lowestData["nameTwo"] = nameTwo;

	// // Open up the user UI and let them use it again
	// if (!webVR) {
	// 	document.getElementById('shipViewDiv').style.display = 'block';
	// }
	// document.getElementById('loadingScreen').style.display = 'none';
	// document.getElementById('loadingScreenAux').style.display = 'none';
	// document.getElementById('disabledCover').style.display = 'none';

	// // Let the user know it's done
	// console.log(
	// 	'Lambert Transfer Calculated: ' +
	// 		round((new Date().getTime() - transTime.getTime()) / 1000, 2) +
	// 		's',
	// );
	// console.log('Calculated with ' + totalCalculations + ' windows analysed');
	// swal({
	// 	title: 'Transfer Calculated',
	// 	html: 'Look at the simulation for the gray ship and its orbit, or the bottom right for the &Delta;V Breakdown',
	// 	type: 'success',
	// }).then((result) => {
	// 	if (result.value) {
	// 		// Resume simulation running
	// 		endTransferCalc();
	// 	}
	// });
}

function finishLambertCalculation() {
	// Finalise the lambert calculation for display

	// var center = planets[lowestData['nameOne']]['center'];
	console.log({ lowestData });

	// Extract the position and velocity vectors for ease
	var r = lowestData['pos'];
	var v = lowestData['vel'];

	var r2 = lowestData['pos2'];
	var v2 = lowestData['vel2'];

	// // Log the data just to be sure for debugging
	// console.log(lowestData);

	// Initialise the final choices
	var selectedR;
	var selectedV;
	var selectedTime;

	if (magnitude(r) < magnitude(r2)) {
		// Look at the higher energy planet, tends to be more accurate (not by much, but a bit)
		selectedR = r;
		selectedV = v;
		selectedTime = lowestData['depTime'];
	} else {
		selectedR = r2;
		selectedV = v2;
		selectedTime = lowestData['capTime'];
	}

	selectedR = r;
	selectedV = v;
	selectedTime = lowestData['depTime'];

	// Upon recieveing parameters, proceed to return data and signal success
	// @ts-ignore
	lowestData['params'] = paramsFromVec(selectedR, selectedV, selectedTime);

	// Return data to IP or IL transfer
	returnData = lowestData;
	transitData = lowestData;
}

function paramsFromVec(r: number, v: number, time: number) {
	// Calculate orbital parameters given orbital state vectors and a given time
	// IMPORTANT NOTE - I will try to explain the equations, but the derivations/explanations are not here (because that's not what this is). It's in the credits section BTW

	// Define some needed axes
	var z = [0, 0, 1];
	var x = [1, 0, 0];

	// H is the angular momentum vector (without the mass)
	var h = crossProduct(r, v);

	if (h[0] == 0 && h[1] == 0) {
		// If angular velocity is straight up, deflect negligibly to avoid divide by 0 errors
		h = [0, 0.0000000000001, 1];
	}

	// N is the nodes vector - point towards ascending node with relation to the ecliptic
	var n = crossProduct(z, h);

	// Eccentricity is split to make it more easily maintainable
	var ePartOne = multiplyVec(
		Math.pow(magnitude(v), 2) - gravitationalParameter / magnitude(r),
		r,
	);
	var ePartTwo = multiplyVec(dotProduct(r, v), v);

	// E is the eccentricity vector - points at the periapsis with a magnitude equal to the eccentricity
	var e = multiplyVec(1 / gravitationalParameter, subVec(ePartOne, ePartTwo));

	// A is the semi-major axis, this is a reverse vis-viva equation
	var a =
		1 /
		(2 / magnitude(r) - Math.pow(magnitude(v), 2) / gravitationalParameter);

	// I is the orbital inclination
	var i = RtoD(Math.acos(h[2] / magnitude(h)));

	// L is the mean longitude at epoch - NOTE THAT THIS EQUATION IS NOT USED, L is calculated separately
	var L =
		(360 +
			RtoD(Math.acos(dotProduct(e, r) / (magnitude(e) * magnitude(r))))) %
		360;

	// Calculate the longitude of the Ascending Node
	var loAN = (360 + RtoD(Math.acos(n[0] / magnitude(n)))) % 360;
	if (n[1] < 0) {
		// Flip to loAN if it is around the way, the inverse cos function can't explain everytihing
		loAN = 360 - loAN;
	}

	// Make sure it's got the right magnitude (0-loAN-360)
	loAN = loAN % 360;

	// Calculate the longitude of the PEriapsis
	var aoPE = RtoD(
		Math.acos(dotProduct(n, e) / (magnitude(n) * magnitude(e))),
	);
	if (e[2] < 0) {
		aoPE = 360 - aoPE;
	}

	var loPE = (aoPE + loAN) % 360;

	var params = {
		// Set the parameters
		e: magnitude(e),
		a: a,
		i: i,
		loAN: loAN,
		loPE: loPE % 360,
	};

	// Find the position at a given time
	var A = RtoD(Math.acos(dotProduct(e, r) / (magnitude(e) * magnitude(r))));
	if (dotProduct(r, v) < 0) {
		A = 360 - A;
	}
	var rL = (A + loPE) % 360;

	// // Initialise the ship
	// planets['ship'] = params;
	// planets['ship']['center'] = center;
	// planets['ship']['epoch'] = time;
	// planets['ship'].viewingClass = {
	// 	minorBody: false,
	// 	minorSatellite: false,
	// 	expanse: false,
	// 	expanseHide: false,
	// 	easterEgg: false,
	// };
	// planets['ship'].mapClass = {};

	// // Clear the ship out - it was needed only for the existing functions to run
	// delete planets['ship'];

	// Return the correct parameters
	// params['rL'] = rL;
	return params;
}

function calculateTransferWindow(
	deptTime: number,
	travelTimeSec: number,
	originPlanet: PlanetOrbit,
	destinationPlanet: PlanetOrbit,
	miscData: any,
) {
	// Calculate an individual transfer window

	// Get the raw data
	var rawDTime = deptTime;
	var rawTTime = travelTimeSec;

	// Add another to the total calculations for efficiency tracking
	totalCalculations += 1;

	// Parse all input data
	var startTime = miscData.startTime;
	var gravitationalParameter = miscData.gravParam;
	var tofMargin = miscData.tofMargin;
	var distOne = miscData.distOne;
	var distTwo = miscData.distTwo;
	var synodicPeriod = miscData.synPeriod;
	var windowsNum = miscData.windowsNum;

	const travelTime = parseScalarInput(travelTimeSec, 's') as ScalarInput;

	// Find initial variables for first planet
	var departingTime = new Date(
		startTime + deptTime * convertTime('S', 'MS', 1),
	);
	var rOne = parseVectorInput(
		findPlanetLocation(originPlanet, departingTime.getTime()),
		'AU',
	);
	var departingVelocity = parseVectorInput(
		findVelocity(originPlanet, departingTime.getTime()),
		'AU/y',
	);

	// Find initial variables for second planet
	var arrivingTime = new Date(
		departingTime.getTime() + outputScalar(travelTime, 'ms'),
	);
	var rTwo = parseVectorInput(
		findPlanetLocation(destinationPlanet, arrivingTime.getTime()),
		'AU',
	);
	var arrivingVelocity = parseVectorInput(
		findVelocity(destinationPlanet, arrivingTime.getTime()),
		'AU/y',
	);

	// console.log({
	// 	departingTime,
	// 	arrivingTime,
	// 	rOne,
	// 	rTwo,
	// 	departingVelocity,
	// 	arrivingVelocity,
	// });

	// Define some handy variables for the magnitudes of vectors
	var rOneMag = vectorMagnitude(rOne);
	var rTwoMag = vectorMagnitude(rTwo);

	// Find deltaV
	var deltaV = parseScalarInput(
		angleBetweenVectors(outputVector(rOne, 'AU'), outputVector(rTwo, 'AU')),
		'degrees',
	);

	// Calculate k,m,l
	var k = multiply(multiply(rOneMag, rTwoMag), subtract(1, cos(deltaV)));
	var m = multiply(multiply(rOneMag, rTwoMag), add(1, cos(deltaV)));
	var l = add(rOneMag, rTwoMag);
	//var k = rOneMag * rTwoMag * (1 - Math.cos(deltaV));
	//var m = rOneMag * rTwoMag * (1 + Math.cos(deltaV));
	//var l = rOneMag + rTwoMag;

	// Important bounders for the iterator
	var pi = divide(k, add(l, pow(multiply(2, m), 0.5)));
	var pii = divide(k, subtract(l, pow(multiply(2, m), 0.5)));
	//var pi = k / (l + Math.pow(2 * m, 0.5));
	//var pii = k / (l - Math.pow(2 * m, 0.5));

	// Some misc variables
	var low;
	var high;
	var p1;
	var p2;

	// The starting boundaries affect the results quite a bit
	var startSeed = 2000000; // This MUST be >= 1

	if (deltaV.value > Math.PI) {
		// These are limits defined by the maths, just roll with it
		low = parseScalarInput(0, 'm');
		high = pii;
		p1 = add(
			multiply(0.5 + 1 / startSeed, subtract(pii, pi)),
			pi,
		) as unknown as ScalarInput;
		p2 = add(
			multiply(0.5 - 1 / startSeed, subtract(pii, pi)),
			pi,
		) as unknown as ScalarInput;
	} else {
		low = pi;
		//p1 = ((0.5 + 1 / startSeed) * (pii - pi)) + pi;
		//p2 = ((0.5 - 1 / startSeed) * (pii - pi)) + pi;
		p1 = add(
			multiply(0.5 + 1 / startSeed, subtract(pii, pi)),
			pi,
		) as unknown as ScalarInput;
		p2 = add(
			multiply(0.5 - 1 / startSeed, subtract(pii, pi)),
			pi,
		) as unknown as ScalarInput;
		high = parseScalarInput(Infinity, 'm');
	}

	// Calculate the first times
	var t1 = calculateTime(
		p1,
		rOne,
		rTwo,
		k,
		l,
		m,
		deltaV,
		gravitationalParameter,
	);
	var t2 = calculateTime(
		p2,
		rOne,
		rTwo,
		k,
		l,
		m,
		deltaV,
		gravitationalParameter,
	);

	// How many passes of the iterator before it hits the escape system
	var numTries = Math.pow(10, 2);

	// Iterative convergence algorithm for semi-latus rectum

	while (
		Math.abs(t2.value - travelTime.value) > tofMargin.value &&
		// @ts-ignore
		!isNaN(p2.value) &&
		numTries >= 0 &&
		// @ts-ignore
		p2.value < high.value &&
		// @ts-ignore
		p2.value > low.value
	) {
		var pnew = add(
			p2,
			divide(
				multiply(subtract(travelTime, t2), subtract(p2, p1)),
				subtract(t2, t1),
			),
		); // Linear convergence

		// Update variables for the next go
		p1 = p2;
		p2 = pnew;
		t1 = t2;
		t2 = calculateTime(
			p2,
			rOne,
			rTwo,
			k,
			l,
			m,
			deltaV,
			gravitationalParameter,
		);
		numTries -= 1;
	}

	// Final semi-latus rectum is the selected one
	var p = p2;

	// Calculate f
	var f = subtract(1, multiply(divide(rTwoMag, p), subtract(1, cos(deltaV))));
	//var f = 1 - (rTwoMag / p) * (1 - Math.cos(deltaV));

	// Change parameter to keep units consistent
	//gravitationalParameter = gravitationalParameter * convertTime("Y", "S", -2);

	// Calculate more variables that don't have a physical correlate - see previous maths comment
	var g = divide(
		multiply(multiply(rOneMag, rTwoMag), sin(deltaV)),
		pow(multiply(gravitationalParameter, p), 0.5),
	);
	//var g = rOneMag * rTwoMag * Math.sin(deltaV) / Math.pow(gravitationalParameter * p, 0.5);
	var fDot = multiply(
		multiply(
			pow(divide(gravitationalParameter, p), 0.5),
			tan(divide(deltaV, 2)),
		),
		subtract(
			subtract(divide(subtract(1, cos(deltaV)), p), divide(1, rOneMag)),
			divide(1, rTwoMag),
		),
	);
	//var fDot = Math.pow(gravitationalParameter / p, 0.5) * Math.tan(deltaV / 2) * (((1 - Math.cos(deltaV)) / p) - (1 / rOneMag) - (1 / rTwoMag));
	var gDot = subtract(
		1,
		multiply(divide(rOneMag, p), subtract(1, cos(deltaV))),
	);
	//var gDot = 1 - (rOneMag / p) * (1 - Math.cos(deltaV));

	// Calculate initial and final velocities - relative to FRAME not to PLANETS
	var vOne = divide(subtract(rTwo, multiply(f, rOne)), g);
	var vTwo = add(multiply(fDot, rOne), multiply(gDot, vOne));
	//var vOne = multiplyVec((1 / g), subVec(rTwo, multiplyVec(f, rOne)));
	//var vTwo = addVec(multiplyVec(fDot, rOne), multiplyVec(gDot, vOne));

	// Change parameter back for other equations
	//gravitationalParameter = gravitationalParameter * convertTime("S", "Y", -2);

	// Determing velocites in m/s, not m/year
	//vOne = multiplyVec(convertTime("S", "Y", -1), vOne);
	//vTwo = multiplyVec(convertTime("S", "Y", -1), vTwo);

	// Calculate Capture and transfer delta vees
	var DCO = vectorMagnitude(subtract(vTwo, arrivingVelocity));
	var DTO = vectorMagnitude(subtract(vOne, departingVelocity));

	//var DCO = magnitude(subVec(vTwo, arrivingVelocity)) * convertSpeed("AU/Y", "M/S");
	//var DTO = magnitude(subVec(vOne, departingVelocity)) * convertSpeed("AU/Y", "M/S");

	// These are the gravitational ones - escape velocities
	var DCOGrav = parseScalarInput(0, 'm/s');
	var DTOGrav = parseScalarInput(0, 'm/s');
	var deltaVee = parseScalarInput(0, 'm/s');

	DTOGrav = parseScalarInput(
		calculateEscapeVelocity(originPlanet, distOne) +
			calculateExtraVelocity(DTO.value, originPlanet, distOne),
		'm/s',
	);

	// @ts-ignore
	deltaVee = add(
		deltaVee,
		parseScalarInput(
			calculateEscapeVelocity(originPlanet, distOne) +
				calculateExtraVelocity(DTO.value, originPlanet, distOne),
			'm/s',
		),
	);

	// If not aerobraking, deal with orbit and satellite possibilities
	if (!props.formData.aerobrake) {
		DCOGrav = parseScalarInput(
			calculateEscapeVelocity(destinationPlanet, distTwo) +
				calculateExtraVelocity(DCO.value, destinationPlanet, distTwo),
			'm/s',
		);

		// @ts-ignore
		deltaVee = add(
			deltaVee,
			parseScalarInput(
				calculateEscapeVelocity(destinationPlanet, distTwo) +
					calculateExtraVelocity(
						DCO.value,
						destinationPlanet,
						distTwo,
					),
				'm/s',
			),
		);
	}

	// Calculate the semi-major axis for verification
	//var a = (m * k * p) / (((2 * m) - Math.pow(l, 2)) * Math.pow(p, 2) + (2 * k * l * p) - Math.pow(k, 2));
	var a = divide(
		multiply(multiply(m, k), p),
		add(
			multiply(subtract(multiply(2, m), pow(l, 2)), pow(p, 2)),
			subtract(multiply(multiply(k, 2), multiply(l, p)), pow(k, 2)),
		),
	);

	// Format ALL THE LOGGING DATA
	var formatData: TransferFormat = {
		pos: outputVector(rOne, 'AU') as Vector3Tuple,
		vel: outputVector(vOne, 'AU/y') as Vector3Tuple,
		TO: DTO.value,
		CO: DCO.value,
		TOGrav: DTOGrav.value,
		COGrav: DCOGrav.value,
		capTime: arrivingTime,
		depTime: departingTime,
		pos2: outputVector(rTwo, 'AU') as Vector3Tuple,
		vel2: outputVector(vTwo, 'AU/y') as Vector3Tuple,
		depVel: outputVector(departingVelocity, 'AU/y') as Vector3Tuple,
		arrVel: outputVector(arrivingVelocity, 'AU/y') as Vector3Tuple,
		predictedTime: outputScalar(t2, 'y'),
		tTime: outputScalar(travelTime, 'y'),
		timeDiff:
			(Math.abs(t2.value - travelTime.value) / travelTime.value) * 100 +
			'%',
		a: outputScalar(a, 'AU'),
		misc: {
			// @ts-ignore
			p: p.value,
			// @ts-ignore
			highP: high.value,
			// @ts-ignore
			lowP: low.value,
			// @ts-ignore
			m: m.value,
			// @ts-ignore
			k: k.value,
			// @ts-ignore
			l: l.value,
			// @ts-ignore
			f: f.value,
			// @ts-ignore
			g: g.value,
			// @ts-ignore
			fDot: fDot.value,
			// @ts-ignore
			gDot: gDot.value,
		},
		numTries: numTries,
		gravParam: gravitationalParameter,
		dTime: deptTime,
		deltaVee: deltaVee.value,
		originPlanet: originPlanet,
		destinationPlanet: destinationPlanet,
		rawDTime: rawDTime,
		rawTTime: rawTTime,
	};

	if (miscData.index) {
		formatData.index = miscData.index;
	}

	if (!transitWindows[deptTime]) {
		// Open up the departure time JSON if not initialised
		transitWindows[deptTime] = {};
	}

	// Log the data
	transitWindows[deptTime][outputScalar(travelTime, 'y')] = formatData;

	// If it is an invaid transfer, disregard as the most efficient. Invalid is hyperbolic, not number values, or if the convergence went outside allowed boundaries

	if (validTransfer(formatData)) {
		console.log('validTransfer');
		// Decide which lowest data tracking method
		if (twoStage && !inSecondStage) {
			// Choose whether to add a new piece of data
			if (storedWindows.length < windowsNum) {
				storedWindows.push(formatData);
			} else if (deltaVee.value < storedWindows[0].deltaVee) {
				storedWindows[0] = formatData;
			}

			storedWindows.sort(function (x: TransferFormat, y: TransferFormat) {
				// This sorts is in descending order, highest first
				let xdv = x.deltaVee;
				let ydv = y.deltaVee;

				return ydv - xdv;
			});
		} else {
			if (deltaVee.value < lowestDeltaVee.value) {
				// If it's better, set it as the new best
				lowestDeltaVee = deltaVee;
				lowestData = formatData;
			}
		}
	}

	// Update the estimated time message
	if ((new Date().getTime() / 1000) % 0.5 < 0.1) {
		if (timeEstimateUpdated == false) {
			var elapsedTime =
				(new Date().getTime() - transTime.getTime()) / 1000;
			var predictedTime =
				(elapsedTime * (synodicPeriod.value - deptTime)) / deptTime;
			// lastTimeMessage =
			// 	'<br><br>Estimated time remaining<br>' +
			// 	Math.round(predictedTime) +
			// 	' s';

			timeEstimateUpdated = true;
		}
	} else {
		timeEstimateUpdated = false;
	}

	// Update witty text
	var seconds = (new Date().getTime() / 1000) % 4;
	if (seconds < 1) {
		// Update the message after 4 seconds
		if (messageUpdated == false) {
			// message =
			// 	loadingMessages[
			// 		Math.floor(Math.random() * loadingMessages.length)
			// 	];
			messageUpdated = true;
		}
	} else {
		messageUpdated = false;
	}
}

function findVelocity(planet: PlanetOrbit, time: number) {
	// Return velocity at a given time of a planet

	// Find position and then the degree to match with other knowledge
	var position = findPlanetLocation(planet, time);
	var degree =
		Math.round((360 + vectorToAngle(position)) * orbitResolution) %
		(360 * orbitResolution);

	var newDegree = Math.round(
		findPlanetDegree(planet, position) * orbitResolution,
	);
	if (!isNaN(newDegree)) {
		degree = (360 * orbitResolution + newDegree) % (360 * orbitResolution);
	}

	// Find the infintesimal change in distance and time
	var deltaTime =
		orbitalTimes[planet.value][(degree + 1) % (360 * orbitResolution)] -
		orbitalTimes[planet.value][degree];
	//deltaTime = findPeriod(planets[name].a, planets[name].center)
	var deltaDist = subVec(
		orbitalPositions[planet.value][(degree + 1) % (360 * orbitResolution)],
		orbitalPositions[planet.value][degree],
	);

	// Velocity = distance / time, except to find a vector velocity, use a vector distance
	var velocityVec = multiplyVec(1 / deltaTime, deltaDist);

	const posMag = magnitude(position);
	// console.log({ posMag });
	// console.log({ gravitationalParameterAU });
	// console.log({ planet });
	// Set the magnitude of the velocity according to the viz-viva equation
	const velMagStep =
		gravitationalParameterAU * (2 / posMag - 1 / planet['a']);
	var velMag = Math.sqrt(velMagStep);
	//console.log({ gravitationalParameterAU, posMag, planet });
	// console.log({ velMagStep });
	// console.log({ velMag });
	velocityVec = setMagnitude(velocityVec, velMag);

	//console.log({ velocityVec });

	// Return the velocity in vector form
	return velocityVec;
}

function findPlanetDegree(planet: PlanetOrbit, position: Vector3Tuple) {
	// This entire thing is reverse-deriving it by the same method used to generate the initial coords

	// Get initial data
	var e = planet['e'];
	var i = planet['i'];
	var a = planet['a'];
	var loPE = planet['loPE'];
	var loAN = planet['loAN'];

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

function calculateEscapeVelocity(
	centerBody: PlanetOrbit,
	initalRadiusAbove: number,
) {
	// Calculate the escape velocity of a body

	// Get initial data
	var r = centerBody['r'] * convertDistance('AU', 'KM', 1);
	var gravParam = centerBody.gravParam; //findGravParam(centerBody);

	// Calculate the total radius
	var radiusTotal = (r + initalRadiusAbove) * convertDistance('KM', 'M', 1);

	// Plug it into the escape velocity formula
	var deltaVee =
		Math.pow((2 * gravParam) / radiusTotal, 0.5) -
		Math.pow(gravParam / radiusTotal, 0.5);

	return deltaVee;
}

function calculateExtraVelocity(
	velocity: number,
	planet: PlanetOrbit,
	radius: number,
) {
	// Calculate the excess velocity at the bottom of a hyperbolic trajectory given the velocity at insertion

	// Get inital numbers
	var SOIGravParam = planet.gravParam;
	var insertionVelocity = velocity;

	// Find the size of the SOI and the velocity at the edge
	var planetSOI = planet['SOI'] * convertDistance('AU', 'M', 1);
	var exitSOIA =
		1 / (2 / planetSOI + Math.pow(insertionVelocity, 2) / SOIGravParam);

	// Calculate height above the planet
	var planetRadius = planet['r'] * convertDistance('AU', 'KM', 1);
	var radiusTotal = (planetRadius + radius) * convertDistance('KM', 'M', 1);

	// Calculate the speed at exiting the SOI
	var deltaVeeExit = Math.pow(
		SOIGravParam * (2 / radiusTotal + 1 / exitSOIA),
		0.5,
	);

	// Return the speed without the escape velcity - this is the hyperbolic EXCESS velocity
	return deltaVeeExit - Math.pow((2 * SOIGravParam) / radiusTotal, 0.5);
}

function findPeriod(a: number) {
	// Find the period of a planet given the center and semi-major axis

	// Calculate from Keplar's second law
	return Math.pow(
		((4 * Math.pow(Math.PI, 2)) / gravitationalParameterAU) *
			Math.pow(a, 3),
		1 / 2,
	); // Period in years. 1AU = 1 year
}

// function findGravParam(centerBody: PlanetOrbit, isSun = false) {
// 	if (isSun) {
// 		return SUN.mass * gravitationalConstant;
// 	} else {
// 		return centerBody.gravParam
// 	}
// }

function delayIPTransfer() {
	// Set timeouts to get the results afterwards - Lambert uses these to stop program shutdown during computation
	if (twoStage) {
		setTimeout(function () {
			setTimeout(function () {
				finishIPTransfer();
			}, 0);
		}, 0);
	} else {
		setTimeout(function () {
			setTimeout(function () {
				finishIPTransfer();
			}, 0);
		}, 0);
	}
}

function finishIPTransfer() {
	// Finish off the IP Transfer

	// Parse stored data
	var maneuvers = storedTransferData.maneuvers;
	var originPlanet = storedTransferData.originPlanet;
	var destinationPlanet = storedTransferData.destinationPlanet;
	var properNameTwo = storedTransferData.properNameTwo ?? 'pn2';
	var fromRadius = storedTransferData.fromRadius;
	var toRadius = storedTransferData.toRadius;

	// Keep the returned data in a local variable
	var array = returnData;

	// Calculate the extra velocity needed for the transfer (note that these two both happen at once from the parking orbit)
	var deltaVeeExit = calculateExtraVelocity(
		array['TO'],
		originPlanet,
		fromRadius,
	);
	maneuvers.push({
		// Add NAME Transfer orbit in the maneuvers list
		name: properNameTwo[0] + 'TO',
		title: properNameTwo + ' Transfer Orbit',
		deltaVee: deltaVeeExit,
	});

	// Set ship parameters
	shipParameters = array['params'];

	// Find hyperbolic excess velocity at arrival
	var deltaVeeEnter = calculateExtraVelocity(
		array['CO'],
		destinationPlanet,
		toRadius,
	);

	// Add the next two maneuvers - Both occur at the final parking orbit
	maneuvers.push({
		name: properNameTwo[0] + 'CO',
		hide: props.formData.aerobrake,
		title: properNameTwo + ' Capture Orbit',
		deltaVee: deltaVeeEnter,
	});
	maneuvers.push({
		name: properNameTwo[0] + 'OI',
		hide: props.formData.aerobrake,
		title: properNameTwo + ' Orbit Insertion',
		deltaVee: calculateEscapeVelocity(destinationPlanet, toRadius),
	});

	// Show the maneuver list
	// displayManeuvers(maneuvers, array);

	// Start the ship display
	shipCenter = 'sun';
	//startShipDisplay(array['depTime'], array['capTime'], array['capTime']);

	// // Reset everything for more transfers
	// document.getElementById('IPTransferButton').disabled = false;
	// document.getElementById('ILTransferButton').disabled = false;

	// Calculate total delta vee
	var DV =
		calculateEscapeVelocity(destinationPlanet, toRadius) +
		deltaVeeExit +
		deltaVeeEnter +
		calculateEscapeVelocity(originPlanet, fromRadius);

	// Print the porkchop
	//printPorkchop(array.dTime, array.tTime, returnData['deltaVee']);
}

/**
 * Watchers
 */
watch(
	() => props.formData.departureDateMin,
	(newVal: Date) => {
		currentTime.value = newVal;
		setupSceneObjects();
	},
);
</script>
