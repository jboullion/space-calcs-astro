<template>
    <div
        id="lagrange-canvas"
        class="canvas-wrapper border"
        style="position: relative; height: 500px; width: 100%"
    >
        <i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
    </div>

    <div class="p-2 rounded border mb-5">
        <div>
            <h2>Results</h2>
            <div>
                <table class="table">
                    <tbody>
                        <!-- <tr>
                            <th>One AU</th>
                            <td class="text-end">
                                {{ formatNumber(physicsConstants.AU) }} km
                            </td>
                        </tr> -->
                        <tr>
                            <th>Planet to L1</th>
                            <td class="text-end">
                                {{ formatNumber(L1Point, 0) }} km
                            </td>
                        </tr>
                        <tr>
                            <th>Star to L1</th>
                            <td class="text-end">{{ L1SunPoint }} au</td>
                        </tr>
                        <tr>
                            <th>Planet to L2</th>
                            <td class="text-end">
                                {{ formatNumber(L2Point, 0) }} km
                            </td>
                        </tr>
                        <tr>
                            <th>Star to L2</th>
                            <td class="text-end">{{ L2SunPoint }} au</td>
                        </tr>
                        <tr>
                            <th>Planet Orbit to L3</th>
                            <td class="text-end">
                                {{ formatNumber(L3Point, 0) }} km
                            </td>
                        </tr>
                        <tr>
                            <th>Star to L3</th>
                            <td class="text-end">{{ L3SunPoint }} au</td>
                        </tr>
                        <tr>
                            <th>Planet and Star to L4 and L5</th>
                            <td class="text-end">
                                {{ formatNumber(L4andL5Points, 0) }} km
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
// TODO:

// 1. Possible just have a "red" and "blue" color for the spheres instead of textures
// 2. Set body radius based on mass?

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ILagrangeForm } from './types';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// import {
//   CSS2DObject,
//   CSS2DRenderer,
// } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {
    formatNumber,
    physicsConstants,
    removeAllChildNodes,
    roundToDecimal,
} from '../utils';
import {
    CSS2DObject,
    CSS2DRenderer,
} from 'three/examples/jsm/renderers/CSS2DRenderer';

const props = defineProps<{
    formData: ILagrangeForm;
}>();

const loading = ref(true);

interface Textures {
    space: THREE.Texture | null;
    earth: THREE.Texture | null;
    sun: THREE.Texture | null;
}

const textures: Textures = {
    space: null,
    earth: null,
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
    minMovement: null as THREE.Vector3 | null,
    maxMovement: null as THREE.Vector3 | null,
};

const animation = {
    FPS: 60, // In order to ensure things run smoothly on all devices we need to set a fixed framerate
    prevTick: 0, // track the last tick timestamp
    rotationAxis: new THREE.Vector3(0, 0, 1),
};

onMounted(() => {
    load();

    window.addEventListener('resize', setupScene, { passive: true });
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', setupScene);
});

const scaledDistance = computed<number>(() => {
    return 1000; // props.formData.distance *
});

const L1Point = computed<number>(() => {
    // TODO: Update this if the user changes relationship
    const R = props.formData.distance * physicsConstants.AU;
    const mSun = physicsConstants.sunMass;
    const MEarth = physicsConstants.earthMass;

    // Calculate the distance to the L1 point
    const rL1 = R * Math.pow(MEarth / (3 * mSun), 1 / 3);

    return rL1; // physicsConstants.AU / rL1;
});

const L1SunPoint = computed<string>(() => {
    return (
        (physicsConstants.AU - L1Point.value) /
        physicsConstants.AU
    ).toFixed(3);
});

const L2Point = computed<number>(() => {
    // TODO: Update this if the user changes relationship
    const R = props.formData.distance * physicsConstants.AU;
    const mSun = physicsConstants.sunMass;
    const MEarth = physicsConstants.earthMass;

    // Calculate the distance to the L1 point
    const rL2 = R * Math.pow(MEarth / (3 * mSun), 1 / 3) * (1 + MEarth / mSun);

    return rL2; // physicsConstants.AU / rL2;
});

const L2SunPoint = computed<string>(() => {
    return (
        (physicsConstants.AU + L2Point.value) /
        physicsConstants.AU
    ).toFixed(3);
});

const L3Point = computed<number>(() => {
    const R = props.formData.distance * physicsConstants.AU;
    const mSun = physicsConstants.sunMass;
    const MEarth = physicsConstants.earthMass;

    const rL3 = R * ((7 * MEarth) / (12 * mSun));

    // we are returning negative here because we want a positive number to mean closer to the sun
    return -rL3; // physicsConstants.AU / rL3;
});

const L3SunPoint = computed<string>(() => {
    return (
        (physicsConstants.AU + L3Point.value) /
        physicsConstants.AU
    ).toFixed(3);
});

const L4andL5Points = computed<number>(() => {
    //const rL4andL5 = (physicsConstants.AU * Math.sqrt(3)) / 2;

    return physicsConstants.AU * props.formData.distance; // physicsConstants.AU / rL4andL5;
});

function load() {
    const textureLoader = new THREE.TextureLoader();
    textures.earth = textureLoader.load('/textures/2k_earth_daymap.jpg');
    textures.sun = textureLoader.load('/textures/2k_sun.jpg');

    loading.value = false;
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
    const cameraDistance = scaledDistance.value * 3;
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
    const light = new THREE.PointLight(0xffffff, 1.5, cameraDistance);

    three.scene.add(light);
    three.scene.add(three.orbitGroup);
}

function setupPlanet() {
    const material = new THREE.MeshLambertMaterial({
        map: textures.earth,
        // transparent: true,
        // opacity: 0.1,
    });

    const geometry = new THREE.SphereGeometry(100, 32, 32);

    const mesh = new THREE.Mesh(geometry, material as THREE.Material);

    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(scaledDistance.value, 0, 0);

    three.orbitGroup.add(mesh);
}

function setupSun() {
    if (!three.scene) return;

    const material = new THREE.MeshLambertMaterial({
        map: textures.sun,
        side: THREE.FrontSide,
    });
    material.emissive = new THREE.Color(0xffff00);
    material.emissiveIntensity = 0.6;

    const geometry = new THREE.SphereGeometry(200, 32, 32);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.set(Math.PI / 2, 0, 0);

    three.orbitGroup.add(mesh);
}

function setupOrbit() {
    if (!three.scene) return;

    const orbitSize = scaledDistance.value;
    const lineSize = props.formData.distance;

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
        0,
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
}

function setupL1() {
    const position = new THREE.Vector3(scaledDistance.value * 0.8, 0, 0);
    addPoint('L1', position);
}

function setupL2() {
    const position = new THREE.Vector3(scaledDistance.value * 1.2, 0, 0);
    addPoint('L2', position);
}

function setupL3() {
    const position = new THREE.Vector3(scaledDistance.value * -1, 0, 0);
    addPoint('L3', position);
}

function setupL4() {
    if (!three.scene) return;

    const forwardPosition = (scaledDistance.value * Math.sqrt(3)) / 2;
    const position = new THREE.Vector3(
        scaledDistance.value * 0.5,
        forwardPosition,
        0,
    );
    addPoint('L4', position);
    addEllipse(position, -0.5);
}

function setupL5() {
    if (!three.scene) return;

    const forwardPosition = (scaledDistance.value * Math.sqrt(3)) / 2;
    const position = new THREE.Vector3(
        scaledDistance.value * 0.5,
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
}

watch(props.formData, () => {
    setupScene();
});
</script>
