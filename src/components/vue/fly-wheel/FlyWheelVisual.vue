<template>
	<div>
		<!-- <div class="d-flex justify-content-between mb-3 align-items-center">
            <button class="btn btn-lg px-5" :class="playColor" @click="play">
                <i class="fas" :class="playClass"></i>
            </button>
            <h3 class="mb-0">
                Time: {{ formatNumber(playTime) }}
                years
            </h3>
        </div> -->

		<div
			id="fly-wheel-canvas"
			class="canvas-wrapper border"
			style="position: relative; padding: 35% 0; width: 100%"
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
	removeAllChildNodes,
} from '../utils';
import type { Units } from '../forms/types';
import type { IFlyWheelForm } from './types';

const props = defineProps<{
	formData: IFlyWheelForm;
}>();

const loading = ref(true);

interface Textures {
	sun: THREE.Texture | null;
}

const textures: Textures = {
	sun: null,
};

const three = {
	canvas: null as HTMLElement | HTMLCanvasElement | null,
	renderer: null as THREE.WebGLRenderer | null,
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera(),
	controls: null as OrbitControls | null,
	lastWidth: 0,
	scaleSize: 1000,
	//labelRenderer: null as CSS2DRenderer | null,
	minMovement: null as THREE.Vector3 | null,
	maxMovement: null as THREE.Vector3 | null,
};

const animationDefaults = {
	FPS: 50, // In order to ensure things run smoothly on all devices we need to set a fixed framerate
	prevTick: 0, // track the last tick timestamp
	complete: false,
	play: false,
	currentFrame: 0,
	totalFrames: 500,
};

const animation = ref({ ...animationDefaults });

const playTime = ref(0);

const ship = {
	mesh: new THREE.Mesh(),
	geometry: new THREE.SphereGeometry(),
	material: new THREE.Material(),
};

onMounted(() => {
	loading.value = false;
	setupScene();

	window.addEventListener('resize', resize, { passive: true });
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', resize);
});

function resize() {
	if (!three.canvas) return;

	const width = three.canvas.getBoundingClientRect().width;

	if (width != three.lastWidth) {
		setupScene();
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

	setupFlywheel();

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
	three.canvas = document.getElementById('fly-wheel-canvas');

	if (!three.canvas) return;

	three.canvas.appendChild(three.renderer.domElement);

	const width = three.canvas.getBoundingClientRect().width;
	const height = width * 0.75;
	three.canvas.style.padding = `0`;

	three.lastWidth = width;

	three.renderer.setSize(width, height);

	updateCamera();

	// Lights
	three.scene.add(new THREE.AmbientLight(0x999999));
	const light = new THREE.DirectionalLight(0xffffff, 0.5);
	light.position.set(0, 1, 0);
	light.rotation.x = Math.PI / 2;
	three.scene.add(light);
}

function updateCamera() {
	if (!three.renderer) return;

	// Camera
	const cameraPositionDistance = props.formData.radius * 4;
	const cameraZoomDistance = cameraPositionDistance * 3;
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
	three.controls.minDistance = cameraPositionDistance;
}

function setupFlywheel() {
	//three.sledGroup = new THREE.Group();

	// if (three.carMesh) {
	//     planet.group.remove(three.carMesh);
	// }
	const flywheelRadius = props.formData.radius;

	const flywheelMaterial = new THREE.MeshPhongMaterial({
		color: 0x555555,
		side: THREE.FrontSide,
	});

	var extrudeSettings = {
		depth: flywheelRadius / 4,
		steps: 1,
		bevelEnabled: false,
		curveSegments: 16,
	};

	let flywheelGeometry = null;

	switch (props.formData.geometry.value) {
		case 'sphere':
			flywheelGeometry = new THREE.SphereGeometry(flywheelRadius, 16, 16);
			break;
		case 'tire':
			// flywheelGeometry = new THREE.CylinderGeometry(
			// 	flywheelRadius,
			// 	flywheelRadius,
			// 	flywheelRadius / 4,
			// 	16,
			// );

			var arcShape = new THREE.Shape();
			arcShape.absarc(0, 0, flywheelRadius, 0, Math.PI * 2, false);

			//   if (formData.value.hollow) {
			var holePath = new THREE.Path();
			holePath.absarc(0, 0, flywheelRadius * 0.9, 0, Math.PI * 2, true);
			arcShape.holes.push(holePath);
			flywheelGeometry = new THREE.ExtrudeGeometry(
				arcShape,
				extrudeSettings,
			);
			break;
		case 'disk':
			flywheelGeometry = new THREE.CylinderGeometry(
				flywheelRadius,
				flywheelRadius,
				flywheelRadius / 4,
				16,
			);
		default:
			flywheelGeometry = new THREE.CylinderGeometry(
				flywheelRadius,
				flywheelRadius,
				flywheelRadius / 4,
				16,
			);
			break;
	}

	const flywheelMesh = new THREE.Mesh(flywheelGeometry, flywheelMaterial);
	flywheelMesh.rotation.x = Math.PI / 2;
	// flywheelMesh.position.z = computedBodyRadiusKM.value + sledRadius + sledRadius;

	//three.scene.add(sledMesh);

	//three.sledGroup.add(flywheelMesh);
	three.scene.add(flywheelMesh);
}

// /** Play Animation */
// const playClass = computed(() => {
//     if (playTime.value === 0) {
//         return 'fa-play';
//     } else if (playTime.value === props.results.travelTime) {
//         return 'fa-undo';
//     } else {
//         return 'fa-pause';
//     }
// });

// const playColor = computed(() => {
//     if (playTime.value === 0) {
//         return 'btn-primary';
//     } else if (playTime.value === props.results.travelTime) {
//         return 'btn-danger';
//     } else {
//         return 'btn-outline-primary';
//     }
// });

// function play() {
//     if (animation.value.complete) {
//         setupScene();
//         return;
//     }

//     animation.value.play = !animation.value.play;
// }

/** End Animation */

function animate() {
	if (!three.renderer) return;

	requestAnimationFrame(animate);

	three.renderer.render(three.scene, three.camera);

	// clamp to fixed framerate
	const now = Math.round(
		(animation.value.FPS * window.performance.now()) / 1000,
	);

	if (now == animation.value.prevTick) return;

	animation.value.prevTick = now;
}

watch(props.formData, (newValue, oldValue) => {
	nextTick(() => {
		setupScene();
	});
});
</script>
