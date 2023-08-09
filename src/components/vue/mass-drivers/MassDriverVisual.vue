<template>
    <div
        id="mass-driver-canvas"
        class="canvas-wrapper border"
        style="position: relative; height: 500px; width: 100%"
    >
        <i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
    </div>
</template>
<script setup lang="ts">
// TODO:

// OPTIONAL:

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { IMassDriverForm } from './types';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// import {
//     CSS2DObject,
//     CSS2DRenderer,
// } from 'three/examples/jsm/renderers/CSS2DRenderer';
// import { GUI } from 'dat.gui';

import {
    convertUnitValue,
    formatNumber,
    lengthUnits,
    physicsConstants,
} from '../utils';

const props = defineProps<{
    formData: IMassDriverForm;
}>();

const loading = ref(true);

interface Textures {
    earth: THREE.Texture | null;
    moon: THREE.Texture | null;
}

const textures: Textures = {
    earth: null,
    moon: null,
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
    //labelRenderer: null as CSS2DRenderer | null,
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

const planet = {
    mesh: new THREE.Mesh(),
    geometry: new THREE.SphereGeometry(),
    material: new THREE.Material(),
};

onMounted(() => {
    loadModels();
    window.addEventListener('resize', setupScene, { passive: true });
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', setupScene);
});

const computedBodyRadiusKM = computed(() => {
    return convertUnitValue(
        props.formData.bodyRadius,
        props.formData.bodyRadiusUnit,
        lengthUnits[1], //km
        0,
    );
});

async function loadModels() {
    const textureLoader = new THREE.TextureLoader();
    // //this.textures.space = await textureLoader.load('/wp-content/themes/nexus-aurora/assets/images/2k_stars.jpg');
    textures.earth = await textureLoader.load('/textures/2k_earth_daymap.jpg');
    // textures.mars = await textureLoader.load(textureDir + '2k_mars.jpg');
    // textures.moon = await textureLoader.load(textureDir + '2k_moon.jpg');

    loading.value = false;
    setupScene();
}

// function setupAxesHelper() {
//   if (!three.scene) return;
//   const axesHelper = new THREE.AxesHelper(scaledPlanetRadius.value / 10); // 500 is size
//   axesHelper.position.set(
//     scaledPlanetRadius.value + scaledPlanetRadius.value / 10,
//     0,
//     0
//   );
//   //this.three.group.add(axesHelper);
//   three.scene.add(axesHelper);
// }

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

    //needsUpdate.value = false;

    setupThreeJS();

    setupPlanet();

    //setupStarship();

    //this.setupAxesHelper();

    if (!animation.prevTick) {
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
    const height = 400;

    three.renderer.setSize(width, height);

    updateCamera();

    // Lights
    three.scene.add(new THREE.AmbientLight(0x404040));
    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(0, 0, 1);
    three.scene.add(light);

    // // GUI
    // this.three.gui = new dat.GUI( { autoPlace: false } );
    // this.three.canvas.appendChild(this.three.gui.domElement);
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

    // three.minMovement = new THREE.Vector3(
    //     -cameraZoomDistance,
    //     -cameraZoomDistance,
    //     -cameraZoomDistance,
    // );
    // three.maxMovement = new THREE.Vector3(
    //     cameraZoomDistance,
    //     cameraZoomDistance,
    //     cameraZoomDistance,
    // );

    three.camera.position.z = cameraPositionDistance;
    // this.three.controls.enableZoom = false;

    // Controls
    three.controls = new OrbitControls(three.camera, three.renderer.domElement);
    three.controls.maxDistance = cameraZoomDistance;
    three.controls.minDistance = computedBodyRadiusKM.value;
}

function setupPlanet() {
    planet.material = new THREE.MeshLambertMaterial({
        map: textures.earth,
    });

    // switch (formData.value.location.name) {
    //     case 'Earth':
    //         planet.material = new THREE.MeshLambertMaterial({
    //             map: textures.earth,
    //         });
    //         break;
    //     case 'Mars':
    //         planet.material = new THREE.MeshLambertMaterial({
    //             map: textures.mars,
    //         });
    //         break;
    //     case 'Moon':
    //         planet.material = new THREE.MeshLambertMaterial({
    //             map: textures.moon,
    //         });
    //         break;
    // }

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

    three.scene.add(planet.mesh);
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
    const now = Math.round((animation.FPS * window.performance.now()) / 1000);

    if (now == animation.prevTick) return;

    animation.prevTick = now;
}
</script>
