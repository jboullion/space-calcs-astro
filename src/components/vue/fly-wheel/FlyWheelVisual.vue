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
            style="position: relative; height: 30%; width: 100%"
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
import type { IStarTravelForm, StarTravelResults } from './types';

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

const props = defineProps<{
    formData: IStarTravelForm;
    results: StarTravelResults;
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
    camera: new THREE.OrthographicCamera(),
    renderWidth: 0,
    starDistance: 0,
    starRadius: 0,
    lastWidth: 0,
    //controls: null as OrbitControls | null,
    //labelRenderer: null as CSS2DRenderer | null,
    //minMovement: null as THREE.Vector3 | null,
    //maxMovement: null as THREE.Vector3 | null,
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

// onMounted(() => {
//     loadModels();
//     window.addEventListener('resize', resize, { passive: true });
// });

// onBeforeUnmount(() => {
//     window.removeEventListener('resize', resize);
// });

// function resize() {
//     if (!three.canvas) return;

//     const width = three.canvas.getBoundingClientRect().width;

//     if (width != three.lastWidth) {
//         setupScene();
//     }
// }

// async function loadModels() {
//     const textureLoader = new THREE.TextureLoader();

//     textures.sun = await textureLoader.load('/textures/2k_sun.jpg');

//     loading.value = false;
//     setupScene();
// }

// function setupScene() {
//     if (loading.value) return;

//     if (three.scene && three.canvas) {
//         removeAllChildNodes(three.canvas);
//     }

//     animation.value = { ...animationDefaults };
//     playTime.value = 0;

//     setupThreeJS();

//     setupStars();

//     setupTrack();

//     //setupShip();

//     if (!animation.value.prevTick) {
//         animate();
//     }
// }

// function setupThreeJS() {
//     three.scene = new THREE.Scene();

//     // Renderer
//     three.renderer = new THREE.WebGLRenderer({
//         antialias: true,
//         logarithmicDepthBuffer: true,
//     }); // { alpha: true }
//     three.canvas = document.getElementById('fly-wheel-canvas');

//     if (!three.canvas) return;

//     three.canvas.appendChild(three.renderer.domElement);

//     const width = three.canvas.getBoundingClientRect().width;
//     const height = width * 0.3;

//     three.lastWidth = width;

//     three.renderer.setSize(width, height);

//     updateCamera();

//     // Lights
//     three.scene.add(new THREE.AmbientLight(0x999999));
//     // const light = new THREE.DirectionalLight(0xffffff, 0.5);
//     // light.position.set(0, 0, 1);
//     // three.scene.add(light);
// }

// function updateCamera() {
//     if (!three.renderer) return;

//     // Camera
//     const sceneWidth = 150;
//     const cameraPositionDistance = sceneWidth;
//     const cameraZoomDistance = sceneWidth * 4; //this.stationWidth * 10;
//     let rendererSize = new THREE.Vector2();
//     three.renderer.getSize(rendererSize);
//     three.renderWidth = rendererSize.width;
//     three.camera = new THREE.OrthographicCamera(
//         rendererSize.width / -2,
//         rendererSize.width / 2,
//         rendererSize.height / 2,
//         rendererSize.height / -2,
//         1,
//         1000,
//     );

//     three.camera.position.z = cameraPositionDistance;
//     // this.three.controls.enableZoom = false;

//     // // Controls
//     // three.controls = new OrbitControls(three.camera, three.renderer.domElement);
//     // three.controls.maxDistance = cameraZoomDistance;
//     // three.controls.minDistance = sceneWidth * 2;
// }

// function setupStars() {
//     if (!three.scene) return;

//     // TODO: Do we want different materials for different "Example" destinations?
//     const material = new THREE.MeshLambertMaterial({
//         map: textures.sun,
//         side: THREE.FrontSide,
//         color: 0xffff00,
//         emissive: 0xffff00,
//         emissiveIntensity: 0.5,
//     });

//     three.starDistance = three.renderWidth / 2;

//     // This is the radius of the sun in the simulation. NOT ACCURATE. Just a visual representation.
//     three.starRadius = three.starDistance / 20;

//     three.starDistance -= three.starRadius * 2;

//     const geometry = new THREE.SphereGeometry(three.starRadius, 32, 32);
//     const leftSun = new THREE.Mesh(geometry, material);
//     const rightSun = new THREE.Mesh(geometry, material);

//     leftSun.rotation.set(Math.PI / 2, 0, 0);
//     rightSun.rotation.set(Math.PI / 2, 0, 0);

//     leftSun.position.set(-three.starDistance, 0, 0);
//     rightSun.position.set(three.starDistance, 0, 0);

//     three.scene.add(leftSun);
//     three.scene.add(rightSun);
// }

// function setupTrack() {
//     // TODO: Do we want different materials for different "Example" destinations?
//     const accelMaterial = new THREE.MeshLambertMaterial({
//         side: THREE.FrontSide,
//         color: 0x00ff00,
//     });
//     const maxMaterial = new THREE.MeshLambertMaterial({
//         side: THREE.FrontSide,
//         color: 0x0000ff,
//     });
//     const decelMaterial = new THREE.MeshLambertMaterial({
//         side: THREE.FrontSide,
//         color: 0xff0000,
//     });

//     const trackRadius = 5;
//     const trackWidth = three.starDistance * 2;

//     let accelPercent =
//         props.results.accelDistance / props.results.totalDistance;
//     let decelPercent =
//         props.results.decelDistance / props.results.totalDistance;

//     // TODO: What to do if the acceleration takes longer than 50% / trip time?
//     // TODO: Do we give an error if the acceleration takes longer than 50% / trip time? Or perhaps we instead transition immediately to deceleration time and skip max velocity / set it to 0?
//     // if (accelPercent > 0.5) {
//     //     accelPercent = 0.5;
//     // }
//     // if (decelPercent > 0.5) {
//     //     decelPercent = 0.5;
//     // }

//     // This is the radius of the sun in the simulation. NOT ACCURATE. Just a visual representation.
//     const accelLength = trackWidth * accelPercent;
//     const decelLength = trackWidth * decelPercent;
//     const maxVelocityLength =
//         trackWidth - accelLength - decelLength - three.starRadius * 2;

//     const accelGeometry = new THREE.CylinderGeometry(
//         trackRadius,
//         trackRadius,
//         accelLength,
//         12,
//         1,
//     );
//     const maxGeometry = new THREE.CylinderGeometry(
//         trackRadius,
//         trackRadius,
//         maxVelocityLength,
//         12,
//         1,
//     );
//     const decelGeometry = new THREE.CylinderGeometry(
//         trackRadius,
//         trackRadius,
//         decelLength,
//         12,
//         1,
//     );

//     const accelTrack = new THREE.Mesh(accelGeometry, accelMaterial);
//     const maxTrack = new THREE.Mesh(maxGeometry, maxMaterial);
//     const decelTrack = new THREE.Mesh(decelGeometry, decelMaterial);

//     accelTrack.rotation.set(0, 0, Math.PI / 2);
//     maxTrack.rotation.set(0, 0, Math.PI / 2);
//     decelTrack.rotation.set(0, 0, Math.PI / 2);

//     accelTrack.position.set(
//         -three.starDistance + three.starRadius + accelLength / 2,
//         0,
//         0,
//     );
//     decelTrack.position.set(
//         three.starDistance - three.starRadius - decelLength / 2,
//         0,
//         0,
//     );

//     three.scene.add(accelTrack);
//     three.scene.add(maxTrack);
//     three.scene.add(decelTrack);
// }

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
