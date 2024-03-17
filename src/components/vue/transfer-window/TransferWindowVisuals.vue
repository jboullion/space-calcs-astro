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
	AU3Y2toM3S2,
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
interface OrbitResult {
	tof: number;
	points: THREE.Vector3[];
}

interface LambertResult {
	v1: number[];
	v2: number[];
}

function calculateIPTransfer() {
	// Import and format names correctly
	var properNameTwo = props.formData.destination.name; //document.getElementById('toTarget').value.replace('The ', '');
	var nameOne = props.formData.origin.value; //document.getElementById('fromTarget').value.toLowerCase();
	var nameTwo = props.formData.destination.value; //document.getElementById('toTarget').value.toLowerCase();

	// Decide which mode of Lambert calculation should be used
	// TODO: Set up a prop for porkchop plot generation on formData
	twoStage = false; //!document.getElementById('IPPorkchop').checked;

	if (nameOne == nameTwo) {
		// TODO: Prevent this situation from happening in the form
	} else {
		const originMeters = AU3Y2toM3S2(props.formData.origin.a);
		const destinationMeters = AU3Y2toM3S2(props.formData.destination.a);

		var rOrigin = [originMeters, 0, 0]; //.originOrbit; // document.getElementById('fromDistanceAbove').value;
		var rDestination = [destinationMeters, 0, 0]; //.destinationOrbit; //document.getElementById('fromDistanceAbove').value;

		// Define parameters for Lambert transfer
		const muSun = 1.32712440018e20; // Gravitational parameter of the Sun in m^3/s^2

		// Calculate points for the Lambert transfer orbit
		const porkchopData = calculateLambertOrbitPoints(
			rOrigin,
			rDestination,
			muSun,
			1000,
		);

		console.log({ porkchopData });

		// // get the deltaV for first and second burn
		// porkchopData
		// const [v1, v2] = lambertTransfer(rOrigin, rDestination, tof);

		// // Process the results to generate the Porkchop plot data
		// const tofValues = porkchopData.map(entry => entry.tof);
		// const dvValues = porkchopData.map(entry => {
		// 	// Calculate delta-v here if needed
		// 	return 0; // Dummy value, replace with actual calculation
		// });

		// // Generate the Porkchop plot visualization using the obtained data
		// // You can use a plotting library like Plotly.js to create the plot
		// // Example Plotly.js code:
		// const data = [{
		// 	z: dvValues,
		// 	x: tofValues,
		// 	y: tofValues,
		// 	type: 'contour'
		// }];
		// Plotly.newPlot('porkchopPlot', data);
	}
}

// Function to calculate Lambert transfer orbit points

interface LambertResult {
	v1: number[];
	v2: number[];
}

interface OrbitResult {
	tof: number;
	points: THREE.Vector3[];
}

function lambertTransfer(
	mu: number,
	r1: number[],
	r2: number[],
	tof: number,
	M = 0,
	N = 0,
	tolerance = 1e-8,
	maxIter = 100,
): LambertResult {
	function lambertFunction(
		z: number,
		r1: number[],
		r2: number[],
		A: number,
		B: number,
	): number {
		const sqrtC = Math.sqrt(calculateC(r1, r2));
		const sqrtSinTheta = Math.sqrt(1 - sqrtC / (rNorm(r1) * rNorm(r2)));
		const sinTheta = Math.min(sqrtC / (rNorm(r1) * rNorm(r2)), 1);
		const f =
			(A * Math.sqrt(2) * (1 - (z * sqrtSinTheta) / 2)) / z ** 1.5 -
			Math.sqrt(2) *
				Math.sqrt(mu) *
				(tof -
					(z * sqrtSinTheta) / 2 +
					(A ** 1.5 * calculateF(z, sinTheta) +
						B * sqrtC * calculateG(z, sinTheta) -
						sqrtC * A) /
						Math.sqrt(mu));
		return f;
	}

	// Compute necessary quantities
	const r1Norm = Math.sqrt(r1.reduce((sum, val) => sum + val ** 2, 0));
	const r2Norm = Math.sqrt(r2.reduce((sum, val) => sum + val ** 2, 0));

	const c = [
		r1[1] * r2[2] - r1[2] * r2[1],
		r1[2] * r2[0] - r1[0] * r2[2],
		r1[0] * r2[1] - r1[1] * r2[0],
	];
	const sinTheta = Math.min(
		Math.sqrt(c.reduce((sum, val) => sum + val ** 2, 0)) /
			(r1Norm * r2Norm),
		1,
	);
	const theta = Math.asin(sinTheta);
	const dTheta = Math.PI - theta;

	// Compute orbit determination parameters A and B
	const A = Math.sqrt(r1Norm * r2Norm * (1 + Math.cos(theta)));
	const B = Math.sqrt(r1Norm * r2Norm * (1 - Math.cos(theta)));

	// Compute guess for the z value
	let zGuess = 0;
	if (sinTheta > 1e-6) {
		zGuess = Math.acosh(
			(r1Norm + r2Norm + A) / Math.sqrt(4 * r1Norm * r2Norm),
		);
	} else {
		zGuess = Math.sqrt(
			r1Norm ** 2 + r2Norm ** 2 - 2 * r1Norm * r2Norm * Math.cos(theta),
		);
	}

	// Implement Newton-Raphson method to solve Lambert's problem
	let zRoot = zGuess;
	let iter = 0;
	let fValue = lambertFunction(zRoot, r1, r2, A, B);

	while (Math.abs(fValue) > tolerance && iter < maxIter) {
		const fPrime =
			(A * Math.sqrt(1 - (zRoot / 2 / Math.sinh(zRoot)) ** 2) - B) /
			(2 * zRoot - A * (1 - zRoot / 2 / Math.tanh(zRoot)));
		zRoot -= fValue / fPrime;
		fValue = lambertFunction(zRoot, r1, r2, A, B);
		iter++;
	}

	console.log({ dTheta, r1Norm, r2Norm, A, zRoot });

	// Compute Lagrange coefficients
	const A0 =
		(Math.sin(dTheta) * Math.sqrt(1 - (r1Norm + r2Norm) ** 2 / A ** 2)) /
		Math.sin(zRoot);
	const A1 =
		((r1Norm + r2Norm) / A) * Math.sqrt(zRoot / Math.tanh(zRoot) - 1);
	const A2 =
		((r1Norm - r2Norm) / A) * Math.sqrt(zRoot / Math.tanh(zRoot) + 1);

	console.log({ A0 });

	// Compute initial and final velocities
	const v1 = [
		(r2[0] - A0 * r1[0] - (A1 * c[0]) / r1Norm) *
			Math.sqrt(mu / (A * Math.tanh(zRoot))),
		(r2[1] - A0 * r1[1] - (A1 * c[1]) / r1Norm) *
			Math.sqrt(mu / (A * Math.tanh(zRoot))),
		(r2[2] - A0 * r1[2] - (A1 * c[2]) / r1Norm) *
			Math.sqrt(mu / (A * Math.tanh(zRoot))),
	];
	const v2 = [
		(A2 * r2[0] - r1[0] - (A0 * c[0]) / r2Norm) *
			Math.sqrt(mu / (A * Math.tanh(zRoot))),
		(A2 * r2[1] - r1[1] - (A0 * c[1]) / r2Norm) *
			Math.sqrt(mu / (A * Math.tanh(zRoot))),
		(A2 * r2[2] - r1[2] - (A0 * c[2]) / r2Norm) *
			Math.sqrt(mu / (A * Math.tanh(zRoot))),
	];

	return { v1, v2 };
}

function calculateLambertOrbitPoints(
	r1: number[],
	r2: number[],
	mu: number,
	numPoints: number,
): OrbitResult[] {
	const results: OrbitResult[] = [];
	// Iterate over a range of possible time of flight values
	for (let i = 0; i < 100; i++) {
		const tof = i * 24 * 3600; // Convert each iteration to seconds (assuming 1 day steps)
		const { v1, v2 } = lambertTransfer(mu, r1, r2, tof);
		const r1Vector = new THREE.Vector3(r1[0], r1[1], r1[2]);
		const r2Vector = new THREE.Vector3(r2[0], r2[1], r2[2]);
		const points: THREE.Vector3[] = [r1Vector];
		for (let j = 1; j < numPoints; j++) {
			const t = j / (numPoints - 1);
			const r = r1Vector.clone().lerp(r2Vector, t);
			const v = v1[0] > 0 ? v1 : v2; // Select the appropriate velocity vector
			const vVector = new THREE.Vector3(v[0], v[1], v[2]);
			const h = r.clone().cross(vVector).normalize();
			const orbitPoint = r.clone().applyAxisAngle(h, Math.PI / 2);
			points.push(orbitPoint);
		}
		points.push(r2Vector);
		results.push({ tof, points });
	}
	return results;
}

function calculateC(r1: number[], r2: number[]): number {
	return r1[0] * r2[1] - r1[1] * r2[0];
}

function rNorm(r: number[]): number {
	return Math.sqrt(r.reduce((sum, val) => sum + val ** 2, 0));
}

function calculateF(z: number, sinTheta: number): number {
	return (z * Math.sqrt(sinTheta) - Math.pow(z, 2) / 2) / 2 - 1;
}

function calculateG(z: number, sinTheta: number): number {
	return (z * Math.sqrt(sinTheta) - z) / Math.pow(z, 1.5);
}

function finaliseTransferCalc() {
	console.log('Deriving Parameters...');

	finishLambertCalculation();
}

function finishLambertCalculation() {}

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
