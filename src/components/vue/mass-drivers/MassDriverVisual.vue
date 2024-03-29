<template>
	<div>
		<div class="d-flex justify-content-between mb-3 align-items-center">
			<button class="btn btn-lg px-5" :class="playColor" @click="play">
				<i class="fas" :class="playClass"></i>
			</button>
			<h3 class="mb-0">
				Time: {{ formatNumber(playTime) }}
				{{ timeUnit.label }}
			</h3>
		</div>

		<div
			id="mass-driver-canvas"
			class="canvas-wrapper border"
			style="position: relative; height: 500px; width: 100%"
		>
			<i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
		</div>
	</div>
</template>
<script setup lang="ts">
// TODO:

// OPTIONAL:

import {
	computed,
	nextTick,
	onBeforeUnmount,
	onMounted,
	ref,
	watch,
} from 'vue';
import type { IMassDriverForm } from './types';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// import {
//     CSS2DObject,
//     CSS2DRenderer,
// } from 'three/examples/jsm/renderers/CSS2DRenderer';
// import { GUI } from 'dat.gui';

import {
	hourUnits,
	convertUnitValue,
	formatNumber,
	lengthUnits,
	physicsConstants,
} from '../utils';
import { throttle } from '../../../utils/utils';
import type { Units } from '../forms/types';

const props = defineProps<{
	formData: IMassDriverForm;
	trackLengthM: number;
	travelTime: number;
	timeUnit: Units;
}>();

const loading = ref(true);

interface Textures {
	earth: THREE.Texture | null;
	mars: THREE.Texture | null;
	moon: THREE.Texture | null;
}

const textures: Textures = {
	earth: null,
	mars: null,
	moon: null,
};

const three = {
	canvas: null as HTMLElement | HTMLCanvasElement | null,
	renderer: null as THREE.WebGLRenderer | null,
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera(),
	controls: null as OrbitControls | null,
	renderOrder: 0,
	//labelRenderer: null as CSS2DRenderer | null,
	sledGroup: new THREE.Group(),
	minMovement: null as THREE.Vector3 | null,
	maxMovement: null as THREE.Vector3 | null,
};

const track = {
	mesh: new THREE.Mesh(),
	geometry: new THREE.TorusGeometry(),
	material: new THREE.Material(),
	arcRadians: 0,
};

const animationDefaults = {
	FPS: 30, // In order to ensure things run smoothly on all devices we need to set a fixed framerate
	prevTick: 0, // track the last tick timestamp
	rotationAxis: new THREE.Vector3(0, 1, 0),
	rotationSpeed: 0,
	complete: false,
	play: false,
	currentFrame: 0,
	totalFrames: 300,
};

const animation = ref({ ...animationDefaults });

const playTime = ref(0);

const planet = {
	mesh: new THREE.Mesh(),
	geometry: new THREE.SphereGeometry(),
	material: new THREE.Material(),
};

const throttledResize = throttle(onWindowResize, 32);

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

const convertedAccelerationMpS = computed(() => {
	// return convertUnitValue(
	//     props.formData.acceleration,
	//     props.formData.accelerationUnit,
	//     lengthUnits[1], //km
	//     0,
	// );
	const acceleration =
		props.formData.accelerationUnit.value * props.formData.acceleration;

	return acceleration;
});

const computedBodyRadiusKM = computed(() => {
	return convertUnitValue(
		props.formData.bodyRadius,
		props.formData.bodyRadiusUnit,
		lengthUnits[1], //km
		0,
	);
});

const bodyCircumferenceKM = computed(() => {
	return computedBodyRadiusKM.value * 2 * Math.PI;
});

const animiationSpeedIncrement = computed(() => {
	const increment = calculateAngularAcceleration(
		track.arcRadians,
		animation.value.totalFrames,
	);

	return increment;
});

function calculateAngularAcceleration(
	angularDistance: number,
	totalTimeSteps: number,
) {
	const initialAngularDisplacement = 0; // Starting from rest
	const initialAngularVelocity = 0; // Starting from rest

	const numerator =
		2 *
		(angularDistance -
			initialAngularDisplacement -
			initialAngularVelocity * totalTimeSteps);
	const denominator = totalTimeSteps ** 2;

	const angularAcceleration = numerator / denominator;
	return angularAcceleration;
}

async function loadModels() {
	const textureLoader = new THREE.TextureLoader();

	textures.earth = textureLoader.load('/textures/2k_earth_daymap.jpg');
	textures.mars = textureLoader.load('/textures/2k_mars.jpg');
	textures.moon = textureLoader.load('/textures/2k_moon.jpg');

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

	if (three.scene && three.canvas) {
		removeAllChildNodes(three.canvas);
	}

	animation.value = { ...animationDefaults };
	playTime.value = 0;

	setupThreeJS();

	setupPlanet();

	setupTrack();

	setupSled();

	if (!animation.value.prevTick) {
		animate();
	}
}

function setupThreeJS() {
	three.scene = new THREE.Scene();

	// Renderer
	three.renderer = new THREE.WebGLRenderer({
		antialias: true,
		logarithmicDepthBuffer: true,
	}); // { alpha: true }
	three.canvas = document.getElementById('mass-driver-canvas');

	if (!three.canvas) return;

	three.canvas.appendChild(three.renderer.domElement);

	const width = three.canvas.getBoundingClientRect().width;
	const height = 500;

	three.renderer.setSize(width, height);

	updateCamera();

	// Lights
	three.scene.add(new THREE.AmbientLight(0x404040));
	const light = new THREE.DirectionalLight(0xffffff, 0.5);
	light.position.set(0, 0, 1);
	three.scene.add(light);
}

function updateCamera() {
	if (!three.renderer) return;

	// Camera
	const cameraPositionDistance = computedBodyRadiusKM.value * 3;
	const cameraZoomDistance = computedBodyRadiusKM.value * 6; //this.stationWidth * 10;
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
	three.controls.maxDistance = cameraZoomDistance;
	three.controls.minDistance = computedBodyRadiusKM.value * 2;
}

function setupPlanet() {
	if (computedBodyRadiusKM.value > physicsConstants.earthRadius * 1.15) {
		planet.material = new THREE.MeshBasicMaterial({ color: 0x333333 });
	} else if (computedBodyRadiusKM.value > physicsConstants.marsRadius * 1.5) {
		planet.material = new THREE.MeshLambertMaterial({
			map: textures.earth,
		});
	} else if (
		computedBodyRadiusKM.value >
		physicsConstants.moonRadius * 1.25
	) {
		planet.material = new THREE.MeshLambertMaterial({
			map: textures.mars,
		});
	} else if (computedBodyRadiusKM.value > physicsConstants.moonRadius * 0.5) {
		planet.material = new THREE.MeshLambertMaterial({
			map: textures.moon,
		});
	} else {
		planet.material = new THREE.MeshBasicMaterial({ color: 0x333333 });
	}

	planet.geometry = new THREE.SphereGeometry(
		computedBodyRadiusKM.value,
		64,
		64,
	);

	//planet.material.transparent = true;

	planet.mesh = new THREE.Mesh(
		planet.geometry,
		planet.material as THREE.Material,
	);

	// Randomly rotate the planet on each load so no one hemisphere is always facing the camera
	planet.mesh.rotateY(Math.random() * Math.PI * 2);
	planet.mesh.position.set(0, 0, 0);

	three.scene.add(planet.mesh);
}

// TODO: May need to look into paths / shapes / ExtrudeGeometry for the track. IF we want to lift the "exit" of the track up
// OR, perhaps we create a second track that aims up at the end of the track.
function setupTrack() {
	const trackLengthPercent =
		props.trackLengthM / 1000 / bodyCircumferenceKM.value;

	track.arcRadians = trackLengthPercent * Math.PI * 2;

	let displayRadians = track.arcRadians;
	if (displayRadians > 1) {
		displayRadians = Math.PI * 2;
	}

	const trackWidth = computedBodyRadiusKM.value / 100;
	const trackRadius = computedBodyRadiusKM.value + trackWidth + trackWidth;

	const geometry = new THREE.TorusGeometry(
		trackRadius,
		trackWidth,
		12,
		50,
		-displayRadians,
	);

	const material = new THREE.MeshBasicMaterial({ color: 0x555555 });
	const torus = new THREE.Mesh(geometry, material);

	torus.rotation.x = Math.PI / 2;
	torus.rotation.z = Math.PI / 2;

	//torus.rotation.y = Math.PI / 4; // TODO: Do we want to allow turning the track? Similar to the orbit rotation on orbit visualizer

	three.scene.add(torus);
}

function setupSled() {
	three.sledGroup = new THREE.Group();

	// if (three.carMesh) {
	//     planet.group.remove(three.carMesh);
	// }

	const sledMaterial = new THREE.MeshPhongMaterial({
		color: 0xea6730,
		emissive: 0xea6730,
		emissiveIntensity: 1,
		side: THREE.FrontSide,
	});

	const sledRadius = computedBodyRadiusKM.value / 90;

	const sledGeometry = new THREE.SphereGeometry(sledRadius, 24, 24);

	const sledMesh = new THREE.Mesh(sledGeometry, sledMaterial);
	sledMesh.rotation.x = Math.PI / 2;
	sledMesh.position.z = computedBodyRadiusKM.value + sledRadius + sledRadius;

	//three.scene.add(sledMesh);

	three.sledGroup.add(sledMesh);
	three.scene.add(three.sledGroup);
}

function animate() {
	if (!three.renderer) return;
	if (!three.controls) return;

	requestAnimationFrame(animate);

	three.controls.update();

	//this.three.camera.position.clamp(this.three.minMovement, this.three.maxMovement);
	three.renderer.render(three.scene, three.camera);

	//if (formData.value.pause) return;

	// clamp to fixed framerate
	const now = Math.round(
		(animation.value.FPS * window.performance.now()) / 1000,
	);

	if (now == animation.value.prevTick) return;

	animation.value.prevTick = now;

	if (animation.value.play) {
		animation.value.currentFrame++;
		animation.value.rotationSpeed += animiationSpeedIncrement.value; //0.000006;

		three.sledGroup.rotateOnAxis(
			animation.value.rotationAxis,
			animation.value.rotationSpeed,
		);

		if (animation.value.currentFrame % 10 == 0) {
			playTime.value =
				props.travelTime *
				(animation.value.currentFrame / animation.value.totalFrames);
		}

		if (animation.value.currentFrame > animation.value.totalFrames) {
			animation.value.complete = true;
			animation.value.play = false;
		}
	}
}

/** Play Animation */
const playClass = computed(() => {
	if (playTime.value === 0) {
		return 'fa-play';
	} else if (playTime.value === props.travelTime) {
		return 'fa-undo';
	} else {
		return 'fa-pause';
	}
});

const playColor = computed(() => {
	if (playTime.value === 0) {
		return 'btn-primary';
	} else if (playTime.value === props.travelTime) {
		return 'btn-danger';
	} else {
		return 'btn-outline-primary';
	}
});

function play() {
	if (animation.value.complete) {
		setupScene();
		return;
	}

	animation.value.play = !animation.value.play;
}

/** End Animation */

watch(
	() => props.trackLengthM,
	() => {
		nextTick(() => {
			setupScene();
		});
	},
);

watch(
	() => props.formData.bodyRadius,
	() => {
		nextTick(() => {
			setupScene();
		});
	},
);
</script>
