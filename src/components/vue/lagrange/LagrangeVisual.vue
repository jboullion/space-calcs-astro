<template>
	<div
		id="lagrange-canvas"
		class="canvas-wrapper border"
		style="position: relative; height: 500px; width: 100%"
	>
		<i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
	</div>

	<div class="pb-2">
		<p>
			<b>Note:</b> This system is not to scale and is meant only as a
			visual representation
		</p>
	</div>

	<div class="p-2 rounded border mb-5">
		<table class="table mb-0">
			<tbody>
				<!-- <tr>
                            <th>One AU</th>
                            <td class="text-end">
                                {{ formatNumber(physicsConstants.AU) }} km
                            </td>
                        </tr> -->
				<tr>
					<th>{{ bodyTwoName }} to L1</th>
					<td class="text-end">{{ formatNumber(L1Point, 0) }} km</td>
				</tr>
				<tr>
					<th>{{ bodyOneName }} to L1</th>
					<td class="text-end">{{ L1SunPoint }} au</td>
				</tr>
				<tr>
					<th>{{ bodyTwoName }} to L2</th>
					<td class="text-end">{{ formatNumber(L2Point, 0) }} km</td>
				</tr>
				<tr>
					<th>{{ bodyOneName }} to L2</th>
					<td class="text-end">{{ L2SunPoint }} au</td>
				</tr>
				<tr>
					<th>{{ bodyTwoName }} Orbit to L3</th>
					<td class="text-end">{{ formatNumber(L3Point, 0) }} km</td>
				</tr>
				<tr>
					<th>{{ bodyOneName }} to L3</th>
					<td class="text-end">{{ L3SunPoint }} au</td>
				</tr>
				<tr>
					<th class="border-0">
						{{ bodyTwoName }} and {{ bodyOneName }} to L4 and L5
					</th>
					<td class="text-end border-0">
						{{ formatNumber(L4andL5Points, 0) }} km
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
<script setup lang="ts">
// TODO:

// 1. Update result table language

// OPTIONAL:
// 1. Allow the user to click and add a point to the solar plane. This object will then rotate with the grop but also move it's position depending on the position relative to the masses. If the object is on a lagrange point it will stay still. If it is not then it will move towards that body
// 1b. If we do the above add small circles around the L1, L2, L3 points to show the area of influence
// 2. Pause simulation. Or add a start / stop button?
// 3. Draw an equalateral triangle between the body and the L4 and L5 points
// 4. Curve the lagrange ellipse to match the orbit of the planet?

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ILagrangeForm } from './types';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { throttle } from '../../../utils/utils';

import {
	CSS2DObject,
	CSS2DRenderer,
} from 'three/examples/jsm/renderers/CSS2DRenderer';
// import { GUI } from 'dat.gui';

import { formatNumber, physicsConstants } from '../utils';

const props = defineProps<{
	formData: ILagrangeForm;
}>();

const loading = ref(true);

interface Textures {
	space: THREE.Texture | null;
	earth: THREE.Texture | null;
	moon: THREE.Texture | null;
	sun: THREE.Texture | null;
}

const textures: Textures = {
	space: null,
	earth: null,
	moon: null,
	sun: null,
};

const three = {
	canvas: null as HTMLElement | HTMLCanvasElement | null,
	renderer: null as THREE.WebGLRenderer | null,
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera(),
	controls: null as OrbitControls | null,
	bodyOne: new THREE.Mesh(),
	bodyTwo: new THREE.Mesh(),
	renderOrder: 0,
	labelRenderer: null as CSS2DRenderer | null,
	group: new THREE.Group(),
	orbitGroup: new THREE.Group(),
	//earthRotationGroup: new THREE.Group(),
	minMovement: null as THREE.Vector3 | null,
	maxMovement: null as THREE.Vector3 | null,
};

const animation = {
	FPS: 60, // In order to ensure things run smoothly on all devices we need to set a fixed framerate
	prevTick: 0, // track the last tick timestamp
	rotationAxis: new THREE.Vector3(0, 0, 1),
	earthRotationAxis: new THREE.Vector3(0, 1, 0),
};

const scaledDistance = 1000;

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

const bodyOneName = computed<string>(() => {
	return props.formData.relationship.value === 'star' ? 'Star' : 'Planet';
});

const bodyTwoName = computed<string>(() => {
	return props.formData.relationship.value === 'star' ? 'Planet' : 'Moon';
});

const calcDistance = computed<number>(() => {
	return props.formData.relationship.value === 'star'
		? physicsConstants.AU * props.formData.distance
		: physicsConstants.earthRadius * props.formData.distance;
});

const calcMassOne = computed<number>(() => {
	if (props.formData.relationship.value === 'star') {
		return physicsConstants.sunMass * props.formData.massOne;
	} else {
		return physicsConstants.earthMass * props.formData.massOne;
	}
	// props.formData.massOne *
});

const calcMassTwo = computed<number>(() => {
	return physicsConstants.earthMass * props.formData.massTwo;
});

const L1Point = computed<number>(() => {
	const R = calcDistance.value;
	const bodyOne = calcMassOne.value;
	const bodyTwo = calcMassTwo.value;

	// Calculate the distance to the L1 point
	const rL1 = R * Math.pow(bodyTwo / (3 * bodyOne), 1 / 3);

	return rL1; // physicsConstants.AU / rL1;
});

const L1SunPoint = computed<string>(() => {
	return ((calcDistance.value - L1Point.value) / calcDistance.value).toFixed(
		3,
	);
});

const L2Point = computed<number>(() => {
	const R = calcDistance.value;
	const bodyOne = calcMassOne.value;
	const bodyTwo = calcMassTwo.value;

	// Calculate the distance to the L1 point
	const rL2 =
		R * Math.pow(bodyTwo / (3 * bodyOne), 1 / 3) * (1 + bodyTwo / bodyOne);

	return rL2; // physicsConstants.AU / rL2;
});

const L2SunPoint = computed<string>(() => {
	return ((calcDistance.value + L2Point.value) / calcDistance.value).toFixed(
		3,
	);
});

const L3Point = computed<number>(() => {
	const R = calcDistance.value;
	const bodyOne = calcMassOne.value;
	const bodyTwo = calcMassTwo.value;

	const rL3 = R * ((7 * bodyTwo) / (12 * bodyOne));

	// we are returning negative here because we want a positive number to mean closer to the sun
	return -rL3; // physicsConstants.AU / rL3;
});

const L3SunPoint = computed<string>(() => {
	return ((calcDistance.value + L3Point.value) / calcDistance.value).toFixed(
		3,
	);
});

const L4andL5Points = computed<number>(() => {
	return calcDistance.value;
});

function load() {
	const textureLoader = new THREE.TextureLoader();
	textures.earth = textureLoader.load('/textures/2k_earth_daymap.jpg');
	textures.sun = textureLoader.load('/textures/2k_sun.jpg');
	textures.moon = textureLoader.load('/textures/2k_moon.jpg');

	loading.value = false;

	if (document) {
		const skeletonLoader = document.querySelector('#skeletonLoader');
		if (skeletonLoader) skeletonLoader.remove();
	}

	setupScene();
}

function resetScene() {
	if (!three.scene || !three.canvas) return;

	three.canvas.innerHTML = '';
	three.scene.remove.apply(three.scene, three.scene.children);
	three.renderer?.dispose();
	three.renderer = null;
	three.scene = new THREE.Scene();
	three.orbitGroup = new THREE.Group();
	three.bodyOne = new THREE.Mesh();
	three.bodyTwo = new THREE.Mesh();
	//three.earthRotationGroup = new THREE.Group();
}

function setupScene() {
	if (loading.value) return;

	resetScene();

	setupThreeJS();

	setupSun();
	setupPlanet();
	setupOrbit();
	setupL1();
	setupL2();
	setupL3();
	setupL4();
	setupL5();

	if (!animation.prevTick) {
		animate();
	}
}

function setupThreeJS() {
	// Renderer
	three.renderer = new THREE.WebGLRenderer({
		antialias: true,
		logarithmicDepthBuffer: true,
	}); // { alpha: true }
	three.renderer.shadowMap.enabled = true;
	three.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	three.canvas = document.getElementById('lagrange-canvas');

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

	// Camera
	const cameraDistance = scaledDistance * 3;
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

	three.canvas.addEventListener('click', addClickPoint, false);

	// const raycaster = new THREE.Raycaster();
	// const sceneMeshes: THREE.Mesh[] = [];
	// const dir = new THREE.Vector3();
	// let intersects: THREE.Intersection[] = [];

	// three.controls.addEventListener('change', function () {
	//     // xLine.position.copy(three.controls.target)
	//     // yLine.position.copy(controls.target)
	//     // zLine.position.copy(controls.target)

	//     if (!three.controls) return;

	//     raycaster.set(
	//         three.controls.target,
	//         dir
	//             .subVectors(three.camera.position, three.controls.target)
	//             .normalize(),
	//     );

	//     intersects = raycaster.intersectObjects(sceneMeshes, false);
	//     console.log(intersects);
	//     if (intersects.length > 0) {
	//         console.log('hit');
	//         if (
	//             intersects[0].distance <
	//             three.controls.target.distanceTo(three.camera.position)
	//         ) {
	//             three.camera.position.copy(intersects[0].point);
	//         }
	//     }
	// });

	// Lights
	three.scene.add(new THREE.AmbientLight(0x404040));

	if (props.formData.relationship.value === 'star') {
		const light = new THREE.PointLight(0xffffff, 1.5, cameraDistance);
		three.scene.add(light);
	} else {
		const light = new THREE.DirectionalLight(0xffffff, 1.5);

		light.position.set(-scaledDistance * 0.5, 0, 0);

		light.castShadow = true;
		light.shadow.mapSize.width = 512;
		light.shadow.mapSize.height = 512;
		light.shadow.camera.near = 0;
		light.shadow.camera.far = scaledDistance * 2;
		light.shadow.camera.left = 200;
		light.shadow.camera.right = -200;
		light.shadow.camera.top = 200;
		light.shadow.camera.bottom = -200;

		three.scene.add(light);
	}

	//three.scene.add(three.earthRotationGroup);
	three.scene.add(three.orbitGroup);

	// // GUI
	// three.gui = new dat.GUI({ autoPlace: false });
	// three.canvas.appendChild(three.gui.domElement);
}

// TODO: Find the point a user clicked and place a point there
// Try to intersect the point with the orbit CircleGeometry
function addClickPoint() {
	if (!three.controls) return;
	// var geometry = new THREE.BoxGeometry(200, 200, 200);

	// var material = new THREE.MeshBasicMaterial({ color: 0xffffff });

	// var mesh = new THREE.Mesh(geometry, material);

	// mesh.position.set(500, 400, 0);

	// const material = new THREE.MeshBasicMaterial({
	//     color: 0xea6730,
	// });

	// const geometry = new THREE.SphereGeometry(10, 12, 12);
	// const mesh = new THREE.Mesh(geometry, material);
	// mesh.position.set(position.x, position.y, position.z);

	// mesh.layers.enableAll();
	// const label = getLabel(name);
	// mesh.add(label);

	// three.orbitGroup.add(mesh);

	// console.log(three.controls?.target);

	// //scene is global
	// three.orbitGroup.add(mesh);
}

function setupPlanet() {
	const material = new THREE.MeshLambertMaterial({
		map:
			props.formData.relationship.value === 'star'
				? textures.earth
				: textures.moon,
	});

	const geometry = new THREE.SphereGeometry(100, 32, 32);

	three.bodyTwo = new THREE.Mesh(geometry, material as THREE.Material);
	three.bodyTwo.position.set(scaledDistance, 0, 0);

	if (props.formData.relationship.value === 'star') {
		//three.bodyTwo.rotation.x = Math.PI / 2;
		//three.bodyTwo.rotation.z = +0.4;
		// three.earthRotationGroup.add(three.bodyTwo);
		// three.earthRotationGroup.position.set(scaledDistance, 0, 0);
	} else {
		three.bodyTwo.castShadow = true;
		three.bodyTwo.receiveShadow = true;
		//three.bodyTwo.rotation.x = Math.PI / 2;
	}

	three.bodyTwo.rotation.x = Math.PI / 2;

	three.orbitGroup.add(three.bodyTwo);
}

function setupSun() {
	if (!three.scene) return;

	const material = new THREE.MeshLambertMaterial({
		map: textures.sun,
		side: THREE.FrontSide,
	});

	if (props.formData.relationship.value === 'moon') {
		material.map = textures.earth;
	} else {
		// three.earthRotationGroup.add(three.bodyOne);
		material.emissive = new THREE.Color(0xffff00);
		material.emissiveIntensity = 0.6;
	}

	const geometry = new THREE.SphereGeometry(200, 32, 32);

	three.bodyOne = new THREE.Mesh(geometry, material);
	three.bodyOne.rotation.set(Math.PI / 2, 0, 0);

	if (props.formData.relationship.value === 'moon') {
		three.bodyOne.castShadow = true;
		three.bodyOne.receiveShadow = true;
	}

	three.orbitGroup.add(three.bodyOne);
}

function setupOrbit() {
	if (!three.scene) return;

	const orbitSize = scaledDistance;
	const lineSize = 2;

	const orbitGeometry = new THREE.RingGeometry(
		orbitSize - lineSize,
		orbitSize + lineSize,
		264,
	);
	const orbitMaterial = new THREE.MeshBasicMaterial({
		color: '#ffffff',
		side: THREE.DoubleSide,
	});
	const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);

	// this.drawDeltaV(orbit, endOrbit);
	three.orbitGroup.add(orbitMesh);

	// const geometry = new THREE.CircleGeometry(orbitSize * 2, 32);
	// const material = new THREE.MeshBasicMaterial({
	//     color: 0xff0000,
	//     transparent: true,
	//     opacity: 0.1,
	// });
	// const circle = new THREE.Mesh(geometry, material);
	// three.scene.add(circle);
}

function getLabel(name: string) {
	const labelDiv = document.createElement('div');
	labelDiv.className = 'label';
	labelDiv.textContent = name;
	labelDiv.style.backgroundColor = 'transparent';
	labelDiv.style.color = 'white';
	labelDiv.style.fontSize = '12px';
	labelDiv.style.fontFamily = 'sans-serif';
	labelDiv.style.padding = '0.5em';
	labelDiv.style.borderRadius = '0.5em';
	labelDiv.style.pointerEvents = 'none';
	labelDiv.style.textAlign = 'center';
	labelDiv.style.opacity = '1';
	// labelDiv.style.border = "1px solid white";

	const label = new CSS2DObject(labelDiv);
	label.position.set(0, 0, 0);
	// @ts-ignore
	label.center.set(0, 1);

	label.layers.set(0);

	return label;
}

function addPoint(name: string, position: THREE.Vector3) {
	if (!three.scene) return;

	const material = new THREE.MeshBasicMaterial({
		color: 0xea6730,
	});

	const geometry = new THREE.SphereGeometry(10, 12, 12);
	const mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(position.x, position.y, position.z);

	mesh.layers.enableAll();
	const label = getLabel(name);
	mesh.add(label);

	three.orbitGroup.add(mesh);
}

function addEllipse(position: THREE.Vector3, rotation: number = 0.5) {
	const material = new THREE.MeshBasicMaterial({
		color: 0xea6730,
	});

	const curve = new THREE.EllipseCurve(
		10,
		0, // ax, aY
		300,
		100, // xRadius, yRadius
		0,
		2 * Math.PI, // aStartAngle, aEndAngle
		false, // aClockwise
		rotation, // aRotation
	);

	const points = curve.getPoints(50);
	const elipseGeometry = new THREE.BufferGeometry().setFromPoints(points);

	// Create the final object to add to the scene
	const ellipse = new THREE.Line(elipseGeometry, material);
	ellipse.position.set(position.x, position.y, 0);
	three.orbitGroup.add(ellipse);

	// //Create a closed wavey loop
	// const linecurve = new THREE.CubicBezierCurve(
	//     new THREE.Vector2(300, 0),
	//     new THREE.Vector2(45, 150),
	//     new THREE.Vector2(-45, 150),
	//     new THREE.Vector2(-300, 0),
	// );

	// const linepoints = linecurve.getPoints(50);
	// const linegeometry = new THREE.BufferGeometry().setFromPoints(linepoints);

	// const linematerial = new THREE.LineBasicMaterial({ color: 0xea6730 });

	// // Create the final object to add to the scene
	// const curveObject = new THREE.Line(linegeometry, linematerial);
	// curveObject.position.set(position.x, position.y, 0);
	// curveObject.rotation.set(0, 0, rotation);

	// three.orbitGroup.add(curveObject);
}

function setupL1() {
	const position = new THREE.Vector3(scaledDistance * 0.75, 0, 0);
	addPoint('L1', position);
}

function setupL2() {
	const position = new THREE.Vector3(scaledDistance * 1.25, 0, 0);
	addPoint('L2', position);
}

function setupL3() {
	const position = new THREE.Vector3(scaledDistance * -1, 0, 0);
	addPoint('L3', position);
}

function setupL4() {
	if (!three.scene) return;

	const forwardPosition = (scaledDistance * Math.sqrt(3)) / 2;
	const position = new THREE.Vector3(
		scaledDistance * 0.5,
		forwardPosition,
		0,
	);

	// const gui = new GUI();
	// const cubeFolder = gui.addFolder('L4');
	// const cubeX = cubeFolder.add(position, 'x', 0, scaledDistance * 2);
	// const cubeY = cubeFolder.add(position, 'y', 0, forwardPosition * 2);
	// cubeFolder.open();

	// cubeX.onChange(function (value: number) {
	//     position.x = value;
	//     addEllipse(position, -0.5);
	// });

	// cubeY.onChange(function (value: number) {
	//     position.y = value;
	//     addEllipse(position, -0.5);
	// });

	addPoint('L4', position);
	addEllipse(position, -0.5);
}

function setupL5() {
	if (!three.scene) return;

	const forwardPosition = (scaledDistance * Math.sqrt(3)) / 2;
	const position = new THREE.Vector3(
		scaledDistance * 0.5,
		-forwardPosition,
		0,
	);
	addPoint('L5', position);
	addEllipse(position);
}

function animate() {
	if (!three.renderer || !three.controls) return;

	requestAnimationFrame(animate);

	three.controls.update();

	three.renderer.render(three.scene, three.camera);

	if (three.labelRenderer)
		three.labelRenderer.render(three.scene, three.camera);

	//if (formData.value.pause) return;

	// clamp to fixed framerate
	const now = Math.round((animation.FPS * window.performance.now()) / 1000);

	if (now == animation.prevTick) return;
	animation.prevTick = now;

	three.orbitGroup.rotateOnAxis(animation.rotationAxis, 0.005);

	if (props.formData.relationship.value === 'star') {
		// * 365 for earth days...but that looks TOO fast
		three.bodyTwo.rotateOnAxis(animation.earthRotationAxis, 0.005 * 10);
	} else {
		// * 27 for a month...but that looks too fast
		three.bodyOne.rotateOnAxis(animation.earthRotationAxis, 0.005 * 4);
	}
}

// Rebuild our scene when the form data changes.
// TODO: Might not need to do this?
// watch(props.formData, () => {

// });

watch(
	() => props.formData.relationship,
	(newValue) => {
		setupScene();
	},
);

// window.addEventListener('resize', onWindowResize, false);
// function onWindowResize() {
//     if (!three.renderer || !three.camera) return;

//     three.camera.aspect = window.innerWidth / window.innerHeight;
//     three.camera.updateProjectionMatrix();
//     three.renderer.setSize(window.innerWidth, window.innerHeight);
//     three.renderer.render(three.scene, three.camera);
// }
</script>
