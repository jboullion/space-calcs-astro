<template>
    <div
        id="lagrange-canvas"
        class="canvas-wrapper border"
        style="position: relative; height: 500px; width: 100%"
    >
        <i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
    </div>
</template>
<script setup lang="ts">
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
    group: new THREE.Group(),
    minMovement: null as THREE.Vector3 | null,
    maxMovement: null as THREE.Vector3 | null,
};

const animation = {
    FPS: 60, // In order to ensure things run smoothly on all devices we need to set a fixed framerate
    prevTick: 0, // track the last tick timestamp
    // rotationSpeed: 0.1, // This tells threeJS how fast to move and is based on the rpm
    // radians: 6, // there are 6 radians in a circle. This helps us to calculate full rotations
};

const bodyOne = {
    mesh: new THREE.Mesh(),
    geometry: new THREE.SphereGeometry(),
    material: new THREE.Material(),
    group: new THREE.Group() as THREE.Group,
};

const bodyTwo = {
    mesh: new THREE.Mesh(),
    geometry: new THREE.SphereGeometry(),
    material: new THREE.Material(),
    group: new THREE.Group() as THREE.Group,
};

onMounted(() => {
    load();

    window.addEventListener('resize', setupScene, { passive: true });
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', setupScene);
});

function load() {
    const textureLoader = new THREE.TextureLoader();
    textures.earth = textureLoader.load('/textures/2k_earth_daymap.jpg');
    textures.sun = textureLoader.load('/textures/2k_sun.jpg');

    loading.value = false;
    setupScene();
}

function setupScene() {
    if (loading.value) return;

    if (three.scene && three.canvas) {
        removeAllChildNodes(three.canvas);
    }

    setupThreeJS();

    setupSun();
    setupPlanet();
    setupOrbit();

    if (!animation.prevTick) {
        animate();
    }
}

function setupThreeJS() {
    three.scene = new THREE.Scene();
    three.group = new THREE.Group();

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

    // Camera
    const cameraDistance = 1000; // props.formData.distance * 2 * 100;
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

    three.scene.add(three.group);
}

function setupPlanet() {
    bodyOne.group = new THREE.Group();

    bodyOne.material = new THREE.MeshLambertMaterial({
        map: textures.earth,
        // transparent: true,
        // opacity: 0.1,
    });

    bodyOne.geometry = new THREE.SphereGeometry(100, 32, 32);

    bodyOne.mesh = new THREE.Mesh(
        bodyOne.geometry,
        bodyOne.material as THREE.Material,
    );

    bodyOne.mesh.rotation.x = Math.PI / 2;
    bodyOne.mesh.position.set(100, 0, 0);

    bodyOne.group.add(bodyOne.mesh);

    three.scene.add(bodyOne.group);
}

function setupSun() {
    if (!three.scene) return;

    const material = new THREE.MeshLambertMaterial({
        map: textures.sun,
        side: THREE.FrontSide,
    });
    material.emissive = new THREE.Color(0xffff00);
    material.emissiveIntensity = 0.3;

    const geometry = new THREE.SphereGeometry(200, 64, 64);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.set(Math.PI / 2, 0, 0);
    mesh.position.set(-200, 0, 0);

    three.scene.add(mesh);
}

function setupOrbit() {
    if (!three.scene) return;

    const orbitSize = props.formData.distance * 100; // / scaleConversions.scaleFactor;
    const lineSize = props.formData.distance * 2;

    const orbitGeometry = new THREE.RingGeometry(
        orbitSize - lineSize,
        orbitSize + lineSize,
        128,
    );
    const orbitMaterial = new THREE.MeshBasicMaterial({
        color: '#ffffff',
        side: THREE.DoubleSide,
    });
    const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);

    // this.drawDeltaV(orbit, endOrbit);
    three.scene.add(orbitMesh);
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
}
</script>
