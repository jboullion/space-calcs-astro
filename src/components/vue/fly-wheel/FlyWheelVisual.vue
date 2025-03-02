<template>
	<div>
		<div class="d-flex justify-content-between mb-3 align-items-center">
			<button class="btn btn-lg px-5" :class="playColor" @click="play">
				<i class="fas" :class="playClass"></i>
			</button>
			<h3 class="mb-0">RPM: {{ formatNumber(currentRPM) }}</h3>
		</div>

		<div
			id="fly-wheel-canvas"
			class="canvas-wrapper border"
			style="position: relative; padding: 0; height: 400px; width: 100%"
		>
			<i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
		</div>

		<div class="mb-3">
			<p>
				<b>Note:</b> The visualization shows the flywheel rotating at
				the specified RPM. The color indicates the material selected.
			</p>
		</div>
	</div>
</template>
<script setup lang="ts">
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

import { formatNumber, removeAllChildNodes } from '../utils';
import type { IFlyWheelForm } from './types';

const props = defineProps<{
	formData: IFlyWheelForm;
}>();

const loading = ref(true);

const three = {
	canvas: null as HTMLElement | HTMLCanvasElement | null,
	renderer: null as THREE.WebGLRenderer | null,
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera(),
	controls: null as OrbitControls | null,
	lastWidth: 0,
	flywheelGroup: new THREE.Group(),
};

const animationDefaults = {
	FPS: 60,
	prevTick: 0,
	complete: false,
	play: false,
	currentSpeed: 0,
	targetSpeed: 1,
	accelerationRate: 0.05,
};

const animation = ref({ ...animationDefaults });
const currentRPM = ref(0);

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
	currentRPM.value = 0;

	setupThreeJS();
	setupFlywheel();

	if (!animation.value.prevTick) {
		animate();
	}
}

function setupThreeJS() {
	three.scene = new THREE.Scene();
	three.flywheelGroup = new THREE.Group();
	three.scene.add(three.flywheelGroup);

	// Renderer
	three.renderer = new THREE.WebGLRenderer({
		antialias: true,
		logarithmicDepthBuffer: true,
	});
	three.canvas = document.getElementById('fly-wheel-canvas');

	if (!three.canvas) return;

	three.canvas.appendChild(three.renderer.domElement);

	const width = three.canvas.getBoundingClientRect().width;
	const height = 400;
	three.canvas.style.padding = `0`;

	three.lastWidth = width;

	three.renderer.setSize(width, height);

	updateCamera();

	// Lights
	three.scene.add(new THREE.AmbientLight(0x999999));
	const light = new THREE.DirectionalLight(0xffffff, 0.8);
	light.position.set(1, 1, 1);
	three.scene.add(light);

	const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
	backLight.position.set(-1, -1, -1);
	three.scene.add(backLight);
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

	three.camera.position.set(
		cameraPositionDistance,
		cameraPositionDistance / 2,
		cameraPositionDistance,
	);
	three.camera.lookAt(0, 0, 0);

	// Controls
	three.controls = new OrbitControls(three.camera, three.renderer.domElement);
	three.controls.maxDistance = cameraZoomDistance;
	three.controls.minDistance = props.formData.radius * 1.5;
	three.controls.enableDamping = true;
	three.controls.dampingFactor = 0.05;
}

function getMaterialColor() {
	// Generate color based on material type
	const materialColors = {
		aluminium: 0xd4d4d4,
		highCsteel: 0x555555,
		titanium: 0x878787,
		concrete: 0xc2c2c2,
		nylon: 0xffffe0,
		kevlar: 0xffff00,
		carbonFibre: 0x222222,
		carbonNanotubes: 0x444444,
		graphene: 0x333333,
		unobtanium: 0x00ffff,
	};

	return materialColors[props.formData.material.value] || 0x555555;
}

function setupFlywheel() {
	// Clear previous flywheel
	while (three.flywheelGroup.children.length > 0) {
		three.flywheelGroup.remove(three.flywheelGroup.children[0]);
	}

	const flywheelRadius = props.formData.radius;
	const depth = flywheelRadius / 4; // thickness of the wheel

	const materialColor = getMaterialColor();

	const flywheelMaterial = new THREE.MeshPhongMaterial({
		color: materialColor,
		side: THREE.DoubleSide,
		flatShading: false,
		shininess: 30,
	});

	// Axis shaft
	const axisRadius = flywheelRadius * 0.05;
	const axisLength = flywheelRadius * 1.5;
	const axisGeometry = new THREE.CylinderGeometry(
		axisRadius,
		axisRadius,
		axisLength,
		16,
	);
	const axisMaterial = new THREE.MeshPhongMaterial({ color: 0x777777 });
	const axis = new THREE.Mesh(axisGeometry, axisMaterial);
	axis.rotation.x = Math.PI / 2;
	three.flywheelGroup.add(axis);

	// Add mount points
	const mountGeometry = new THREE.BoxGeometry(
		axisRadius * 2,
		axisRadius * 2,
		depth * 1.2,
	);
	const mountMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

	const leftMount = new THREE.Mesh(mountGeometry, mountMaterial);
	leftMount.position.set(0, 0, -axisLength / 2);
	three.flywheelGroup.add(leftMount);

	const rightMount = new THREE.Mesh(mountGeometry, mountMaterial);
	rightMount.position.set(0, 0, axisLength / 2);
	three.flywheelGroup.add(rightMount);

	// Create the flywheel based on geometry type
	let flywheelGeometry;

	switch (props.formData.geometry.value) {
		case 'sphere':
			flywheelGeometry = new THREE.SphereGeometry(flywheelRadius, 32, 32);
			break;

		case 'tire':
			// Create a ring/tire shape
			const innerRadius = flywheelRadius * 0.85;
			flywheelGeometry = new THREE.TorusGeometry(
				flywheelRadius * 0.925, // radius of the entire torus
				(flywheelRadius - innerRadius) / 2, // thickness of the tube
				16, // tubular segments
				32, // radial segments
			);
			// Rotate to be perpendicular to axis

			break;

		case 'donut':
			// Similar to tire but thicker
			const donutInnerRadius = flywheelRadius * 0.6;
			flywheelGeometry = new THREE.TorusGeometry(
				flywheelRadius * 0.8,
				(flywheelRadius - donutInnerRadius) / 2,
				16,
				32,
			);
			break;

		case 'thin-rim':
			// Very thin outer rim
			const rimInnerRadius = flywheelRadius * 0.95;
			flywheelGeometry = new THREE.TorusGeometry(
				flywheelRadius * 0.975,
				(flywheelRadius - rimInnerRadius) / 2,
				8,
				32,
			);
			break;

		case 'radial-rod':
			// Create a group for the radial rods
			const rodGroup = new THREE.Group();
			const rodCount = 8;
			const rodRadius = flywheelRadius * 0.05;
			const rodLength = flywheelRadius * 0.9;

			for (let i = 0; i < rodCount; i++) {
				const angle = (i / rodCount) * Math.PI * 2;
				const rodGeometry = new THREE.CylinderGeometry(
					rodRadius,
					rodRadius,
					rodLength,
				);
				const rod = new THREE.Mesh(rodGeometry, flywheelMaterial);

				rod.position.set(
					Math.cos(angle) * (rodLength / 2),
					Math.sin(angle) * (rodLength / 2),
					0,
				);
				rod.rotation.z = angle + Math.PI / 2;
				rodGroup.add(rod);
			}

			// Create the outer rim connecting the rods
			const outerRimGeometry = new THREE.TorusGeometry(
				flywheelRadius,
				rodRadius,
				8,
				32,
			);
			const outerRim = new THREE.Mesh(outerRimGeometry, flywheelMaterial);
			rodGroup.add(outerRim);

			three.flywheelGroup.add(rodGroup);
			break;

		case 'hollow-sphere':
			// Create a hollow sphere with inner cutout
			const shell = new THREE.Group();

			// Outer sphere
			const outerSphereGeometry = new THREE.SphereGeometry(
				flywheelRadius,
				32,
				32,
			);
			const outerSphere = new THREE.Mesh(
				outerSphereGeometry,
				flywheelMaterial,
			);
			shell.add(outerSphere);

			// Inner sphere (negative - needs to be handled with clipping planes)
			const innerSphereGeometry = new THREE.SphereGeometry(
				flywheelRadius * 0.8,
				32,
				32,
			);
			const innerSphereMaterial = new THREE.MeshPhongMaterial({
				color: materialColor,
				side: THREE.BackSide,
			});
			const innerSphere = new THREE.Mesh(
				innerSphereGeometry,
				innerSphereMaterial,
			);
			shell.add(innerSphere);

			three.flywheelGroup.add(shell);
			break;

		case 'rectangular-rod':
			// Create a group of rectangular rods
			const rectGroup = new THREE.Group();
			const rectCount = 4;
			const rectWidth = flywheelRadius * 0.1;
			const rectHeight = flywheelRadius * 0.05;
			const rectLength = flywheelRadius * 1.8;

			for (let i = 0; i < rectCount; i++) {
				const angle = (i / rectCount) * Math.PI * 2;
				const rectGeometry = new THREE.BoxGeometry(
					rectWidth,
					rectHeight,
					rectLength,
				);
				const rect = new THREE.Mesh(rectGeometry, flywheelMaterial);

				rect.position.set(
					Math.cos(angle) * (flywheelRadius / 2),
					Math.sin(angle) * (flywheelRadius / 2),
					0,
				);
				rect.rotation.z = angle;
				rectGroup.add(rect);
			}

			three.flywheelGroup.add(rectGroup);
			break;

		case 'disk':
		default:
			// Default to a disk/cylinder
			flywheelGeometry = new THREE.CylinderGeometry(
				flywheelRadius,
				flywheelRadius,
				depth,
				32,
			);
			// Rotate to align with axis
			flywheelGeometry.rotateX(Math.PI / 2);
	}

	// Add the main flywheel geometry if not already added in a special case
	if (
		flywheelGeometry &&
		!['radial-rod', 'hollow-sphere', 'rectangular-rod'].includes(
			props.formData.geometry.value,
		)
	) {
		const flywheelMesh = new THREE.Mesh(flywheelGeometry, flywheelMaterial);
		three.flywheelGroup.add(flywheelMesh);
	}

	// Add reference lines to show rotation
	if (['disk', 'tire', 'donut'].includes(props.formData.geometry.value)) {
		const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
		const points = [];
		points.push(new THREE.Vector3(0, 0, 0));
		points.push(new THREE.Vector3(0, 0, flywheelRadius));
		const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
		const line = new THREE.Line(lineGeometry, lineMaterial);
		three.flywheelGroup.add(line);
	}
}

function animate() {
	if (!three.renderer) return;

	requestAnimationFrame(animate);

	// Update controls if they exist
	if (three.controls) {
		three.controls.update();
	}

	three.renderer.render(three.scene, three.camera);

	// Clamp to fixed framerate
	const now = Math.round(
		(animation.value.FPS * window.performance.now()) / 1000,
	);

	if (now == animation.value.prevTick) return;

	animation.value.prevTick = now;

	// Handle animation
	if (animation.value.play) {
		// Smoothly accelerate to target speed
		if (animation.value.currentSpeed < animation.value.targetSpeed) {
			animation.value.currentSpeed += animation.value.accelerationRate;
			if (animation.value.currentSpeed > animation.value.targetSpeed) {
				animation.value.currentSpeed = animation.value.targetSpeed;
			}
		}

		// Update display RPM
		currentRPM.value = props.formData.rpm * animation.value.currentSpeed;

		// Calculate rotation amount this frame
		const rpm = props.formData.rpm;
		const rotationsPerSecond = rpm / 60;
		const rotationPerFrame =
			(rotationsPerSecond * 2 * Math.PI) / animation.value.FPS;

		// Apply rotation to the flywheel group
		three.flywheelGroup.rotation.z +=
			rotationPerFrame * animation.value.currentSpeed;
	} else if (animation.value.currentSpeed > 0) {
		// Decelerate when stopped
		animation.value.currentSpeed -= animation.value.accelerationRate / 2;
		if (animation.value.currentSpeed < 0) {
			animation.value.currentSpeed = 0;
		}

		// Update display RPM
		currentRPM.value = props.formData.rpm * animation.value.currentSpeed;

		// Calculate rotation amount this frame
		const rpm = props.formData.rpm;
		const rotationsPerSecond = rpm / 60;
		const rotationPerFrame =
			(rotationsPerSecond * 2 * Math.PI) / animation.value.FPS;

		// Apply rotation to the flywheel group
		three.flywheelGroup.rotation.z +=
			rotationPerFrame * animation.value.currentSpeed;
	}
}

const playClass = computed(() => {
	if (animation.value.play) {
		return 'fa-pause';
	} else {
		return 'fa-play';
	}
});

const playColor = computed(() => {
	if (animation.value.play) {
		return 'btn-danger';
	} else {
		return 'btn-primary';
	}
});

function play() {
	animation.value.play = !animation.value.play;
}

watch(
	() => props.formData,
	(newValue, oldValue) => {
		nextTick(() => {
			setupScene();
		});
	},
	{ deep: true },
);
</script>
