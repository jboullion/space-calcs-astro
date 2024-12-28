<template>
	<div
		id="oneill-canvas"
		class="canvas-wrapper border"
		style="position: relative; height: 500px; width: 100%"
	>
		<i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
	</div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ONeillCylinderForm } from './types';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// import {
//   CSS2DObject,
//   CSS2DRenderer,
// } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { formatNumber, physicsConstants, roundToDecimal } from '../utils';
import { throttle } from '../../../utils/utils';
import { calcG_Accel, calcSpinRads } from './functions';

const props = defineProps<{
	formData: ONeillCylinderForm;
}>();

const loading = ref(true);

const three = {
	canvas: null as HTMLElement | HTMLCanvasElement | null,
	renderer: null as THREE.WebGLRenderer | null,
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera(),
	controls: null as OrbitControls | null,
	station: new THREE.Mesh(),
	floors: new THREE.Group(),
	group: new THREE.Group(),
	// stats: null, // used for debugging
	// gui: null, // used for debugging
	// raycaster: null,
	// mouse: null,
	minMovement: null as THREE.Vector3 | null,
	maxMovement: null as THREE.Vector3 | null,
};

const animation = {
	FPS: 30, // In order to ensure things run smoothly on all devices we need to set a fixed framerate
	prevTick: 0, // track the last tick timestamp
	rotationSpeed: 0.1, // This tells threeJS how fast to move and is based on the rpm
	radians: 6, // there are 6 radians in a circle. This helps us to calculate full rotations
};

const curveSegments = 12;

const throttledResize = throttle(onWindowResize, 32);

onMounted(() => {
	load();

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

// Computed Properties ------------------------------

const stationWidth = computed(() => {
	// const maxDimenstion = Math.max(
	//     props.formData.structure.radius,
	//     props.formData.structure.cylinderLength / 2,
	// );
	// return maxDimenstion * 2;

	return props.formData.structure.cylinderLength;
});

const internalRadius = computed(() => {
	return (
		props.formData.structure.radius -
		props.formData.structure.shellWallThickness / 1000
	);
});

function rpmToUpdateSpeed(rpm: number) {
	return (rpm / (animation.FPS * 60)) * animation.radians;
}

const rotationSpeed = computed(() => {
	return rpmToUpdateSpeed(props.formData.movementOptions.rotationSpeed); //(formData.value.rpm / (this.animation.FPS * 60)) * this.animation.radians;
});

const spinRads = computed(() => {
	const { radius, surfaceGravity } = props.formData.structure;

	const result = calcSpinRads(radius, surfaceGravity);

	return roundToDecimal(result, 4);
});

const G_Accel = computed(() => {
	return calcG_Accel(props.formData.structure.radius, spinRads.value);
});

// const rpm = computed(() => {
// 	const { radius, surfaceGravity } = props.formData.structure;

// 	const radiusM = radius * 1000;

// 	//const soilDensity = 1500; //TODO: Do we really need this value?
// 	const wallDepth = 0; //addedShielding.value / soilDensity + props.formData.structure.shellWallThickness;

// 	const result =
// 		Math.sqrt(G_Accel.value / (radiusM - wallDepth)) *
// 		physicsConstants.radiansPerSecToRpm;

// 	return result;
// });

// End Computed Properties ------------------------------

async function load() {
	//const loader = new GLTFLoader();

	// TODO: DON'T USE SPACEMAN MODEL!? It is an awesome model, but pretty big. Just use a 6ft cylinder...or nothing
	//models.spaceman = await loader.loadAsync("/models/lowres_spacex_suit.glb");

	//   const textureLoader = new THREE.TextureLoader();
	//   //textures.space = await textureLoader.load('/textures/2k_stars.jpg');
	//   textures.earth = textureLoader.load("/textures/2k_earth_daymap.jpg");
	//   textures.mars = textureLoader.load("/textures/2k_mars.jpg");
	//   textures.moon = textureLoader.load("/textures/2k_moon.jpg");

	loading.value = false;
	setupScene();
}

function removeAllChildNodes(parent: HTMLElement) {
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}
}

function setupScene() {
	if (loading.value) return;

	//needsUpdate.value = false;

	if (three.scene && three.canvas) {
		removeAllChildNodes(three.canvas);
	}

	// stopTrace();

	// TODO: Ideally we wouldn't have to setup ThreeJS on each scene. Just update station + spaceman
	setupThreeJS();

	// setupSpaceman();
	// setupRing();

	setupStation();

	if (!animation.prevTick) {
		animate();
	}
}

function setupThreeJS() {
	three.scene = new THREE.Scene();
	three.group = new THREE.Group();
	three.floors = new THREE.Group();

	// Renderer
	three.renderer = new THREE.WebGLRenderer({
		antialias: true,
		logarithmicDepthBuffer: true,
	}); // { alpha: true }
	three.canvas = document.getElementById('oneill-canvas');

	if (!three.canvas) return;

	three.canvas.appendChild(three.renderer.domElement);

	const width = three.canvas.getBoundingClientRect().width;
	const height = 500;

	three.renderer.setSize(width, height);

	// Camera
	const cameraDistance = stationWidth.value;
	three.camera = new THREE.PerspectiveCamera(
		45,
		width / height,
		0.1,
		cameraDistance * 5,
	);

	three.camera.position.z = cameraDistance;

	// Controls
	three.controls = new OrbitControls(three.camera, three.renderer.domElement);
	three.controls.maxDistance = cameraDistance * 4;
	three.controls.minDistance = cameraDistance / 2;

	// Lights
	three.scene.add(new THREE.AmbientLight(0x404040));
	const light = new THREE.DirectionalLight(0xffffff, 0.5);
	three.scene.add(light);

	// Stats
	// three.stats = Stats()
	// three.stats.dom.style.position = 'absolute';
	// three.canvas.appendChild(three.stats.dom);

	// // GUI
	// three.gui = new dat.GUI( { autoPlace: false } );
	// three.canvas.appendChild(three.gui.domElement);

	three.scene.add(three.group);
}

function setupAxesHelper() {
	const axesHelper = new THREE.AxesHelper(
		props.formData.structure.radius / 10,
	); // 500 is size
	//axesHelper.position.set(three.spaceman.position.x, three.spaceman.position.y, three.spaceman.position.z,)
	//three.group.add(axesHelper);
	three.scene.add(axesHelper);
}

function setupStation() {
	// TODO: Give user option to toggle "see inside"
	const seeInside = false; //formData.value.seeInside;
	const materialType = seeInside ? THREE.BackSide : THREE.FrontSide; // DoubleSide
	const stationMaterial = new THREE.MeshPhongMaterial({
		color: 0xdddddd,
		side: materialType,
	});

	//   if (formData.value.showEnvironment) {
	//     displayPlanet();
	//   }

	// ? NOTE: Not currently used
	// if (formData.value.showLocalAxis) {
	// setupAxesHelper();
	// }

	// Build station
	buildCylinderStation(stationMaterial);

	three.group.position.z = -props.formData.structure.cylinderLength / 2;

	// else if (formData.value.type.shape === "funnel") {
	//   buildFunnelStation(stationMaterial);
	// }

	//   if (formData.value.showGravityRule) {
	//     setupRuler();
	//   }
}

function buildCylinderStation(material: THREE.Material) {
	var extrudeSettings = {
		depth: props.formData.structure.cylinderLength,
		steps: 1,
		bevelEnabled: false,
		curveSegments: curveSegments,
	};

	var arcShape = new THREE.Shape();
	arcShape.absarc(
		0,
		0,
		props.formData.structure.radius,
		0,
		Math.PI * 2,
		false,
	);

	//   if (formData.value.hollow) {
	var holePath = new THREE.Path();
	holePath.absarc(0, 0, internalRadius.value, 0, Math.PI * 2, true);
	arcShape.holes.push(holePath);
	//   }

	var geometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);

	three.station = new THREE.Mesh(geometry, material);

	three.group.add(three.station);

	buildFloors();
	buildCaps();
}

function buildFloors() {
	if (props.formData.internal.levels < 1) return;

	var extrudeSettings = {
		depth: props.formData.structure.cylinderLength,
		steps: 1,
		bevelEnabled: false,
		curveSegments: curveSegments,
	};

	if (props.formData.structure.caps.value === 'concave') {
		extrudeSettings.depth -= props.formData.structure.radius / 2;
	}

	const floorHeight = props.formData.internal.levelHeight / 1000;

	const seeInside = false;
	const materialType = seeInside ? THREE.BackSide : THREE.FrontSide; // DoubleSide
	const floorMaterial = new THREE.MeshPhongMaterial({
		color: 0xaacccc,
		side: materialType,
	});

	for (let i = 0; i < props.formData.internal.levels; i++) {
		const currentFloorHeight = internalRadius.value - floorHeight * i;

		var arcShape = new THREE.Shape();
		arcShape.absarc(0, 0, currentFloorHeight, 0, Math.PI * 2, false);

		//   if (formData.value.hollow) {

		// TODO: How thick are the floors
		var holePath = new THREE.Path();
		holePath.absarc(
			0,
			0,
			currentFloorHeight - floorHeight,
			0,
			Math.PI * 2,
			true,
		);
		arcShape.holes.push(holePath);

		// NOTE: Minor hack to inset each floor so it can be seen
		extrudeSettings.depth -= 0.1;

		var geometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);

		const floor = new THREE.Mesh(geometry, floorMaterial);

		if (props.formData.structure.caps.value === 'concave') {
			floor.position.z = props.formData.structure.radius;
		}

		three.floors.add(floor);
	}

	three.group.add(three.floors);
}

function buildCaps() {
	switch (props.formData.structure.caps.value) {
		case 'flat':
			buildFlatCaps();
			break;
		case 'convex':
			buildConvexCaps();
			break;
		case 'concave':
			buildConcaveCaps();
			break;
		// default:
		//     buildFlatCaps();
	}
}

function buildFlatCaps() {
	const capHeight = 1;

	const capMaterial = new THREE.MeshPhongMaterial({
		color: 0xeeeeee,
		side: THREE.FrontSide,
	});

	const capGeometry = new THREE.CylinderGeometry(
		props.formData.structure.radius,
		props.formData.structure.radius,
		capHeight,
		curveSegments * 2,
	);

	const cap = new THREE.Mesh(capGeometry, capMaterial);
	cap.rotation.x = Math.PI / 2;
	cap.position.z -= capHeight / 2;

	three.group.add(cap);
}

function buildConvexCaps() {
	const capMaterial = new THREE.MeshPhongMaterial({
		color: 0xeeeeee,
		side: THREE.DoubleSide,
	});

	const capGeometry = new THREE.SphereGeometry(
		props.formData.structure.radius,
		curveSegments * 2,
		curveSegments * 2,
		0,
		2 * Math.PI,
		0,
		0.5 * Math.PI,
	);
	const cap = new THREE.Mesh(capGeometry, capMaterial);
	cap.rotation.x = -Math.PI / 2;

	three.group.add(cap);
}

function buildConcaveCaps() {
	const capMaterial = new THREE.MeshPhongMaterial({
		color: 0xeeeeee,
		side: THREE.DoubleSide,
	});

	const capGeometry = new THREE.SphereGeometry(
		internalRadius.value,
		curveSegments * 2,
		curveSegments * 2,
		0,
		2 * Math.PI,
		0,
		0.5 * Math.PI,
	);
	const cap = new THREE.Mesh(capGeometry, capMaterial);
	cap.rotation.x = -Math.PI / 2;
	cap.rotation.z = Math.PI;
	//cap.position.z -= 1;

	three.group.add(cap);
}

function animate() {
	if (!three.renderer || !three.controls) return;

	requestAnimationFrame(animate);

	three.controls.update();

	three.renderer.render(three.scene, three.camera);

	//if (formData.value.pause) return;

	// clamp to fixed framerate
	const now = Math.round((animation.FPS * window.performance.now()) / 1000);

	if (now == animation.prevTick) return;
	animation.prevTick = now;

	// three.group.rotation.z += this.rotationSpeed;
	three.group.rotation.z += rotationSpeed.value;

	//   if (formData.value.showEnvironment && formData.value.isSpace) {
	//     planet.mesh.rotateOnAxis(planet.axis, -planet.speed);
	//     // planet.clouds.rotateOnAxis(planet.axis, planet.speed );
	//   }

	// three.stats.update();
}

// NOTE: This is not very optimal, but should be fine for now
// Instead of watching the entire formData object
watch(
	props.formData,
	() => {
		setupScene();
	},
	{ deep: true },
);

// Consider watching specific properties that affect the visualization
watch(
	() => [
		props.formData.structure.radius,
		props.formData.structure.cylinderLength,
		props.formData.structure.caps,
		props.formData.internal.levels,
	],
	() => {
		setupScene();
	},
);
</script>
