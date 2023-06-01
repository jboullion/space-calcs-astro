<template>
    <div
        id="space-elevator-canvas"
        class="canvas-wrapper border"
        style="position: relative; height: 500px"
    >
        <i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
    </div>
</template>
<script setup lang="ts">
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
import type { SpaceElevatorForm } from './types';
import { physicsConstants } from '../utils';

defineProps<{
    formData: SpaceElevatorForm;
}>();

const loading = ref(true);

interface Textures {
    space: THREE.Texture | null;
    earth: THREE.Texture | null;
    mars: THREE.Texture | null;
    moon: THREE.Texture | null;
}

const textures: Textures = {
    space: null,
    earth: null,
    mars: null,
    moon: null,
};

const planet = {
    gravityConstant: 0.000000000066743, //6.67408 * Math.pow(10, -11), // m3 kg-1 s-2
    mesh: new THREE.Mesh(),
    clouds: new THREE.Mesh(),
    axis: new THREE.Vector3(),
    geometry: new THREE.SphereGeometry(),
    material: new THREE.Material(),
    group: new THREE.Group() as THREE.Group,
};

const three = {
    canvas: null as HTMLElement | HTMLCanvasElement | null,
    renderer: null as THREE.WebGLRenderer | null,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    controls: null as OrbitControls | null,
    // group: null,
    // stats: null, // used for debugging
    // gui: null, // used for debugging
    // raycaster: null,
    // mouse: null,
    minMovement: new THREE.Vector3(),
    maxMovement: new THREE.Vector3(),
};

const formData = ref<SpaceElevatorForm>({
    planetRadius: 6378.14,
    planetDensity: 5514,
    planetGravity: 9.807,
    // planetMass: 5.972 * Math.pow(10, 24),
    // planetGravity: 9.807,
    planetRotation: 0.0000729211585532747,
    carSpeed: 100, //km/h
    payloadMass: 1000, //kg
});

const animation = ref({
    FPS: 60, // In order to ensure things run smoothly on all devices we need to set a fixed framerate
    prevTick: 0, // track the last tick timestamp
});

const textureDir = '/textures/';

/**
 *
 *
 *
 * SETUP
 *
 *
 *
 */

onBeforeMount(() => {
    //calcOrbitalVelocity();
});

onMounted(() => {
    loadModels();
    window.addEventListener('resize', setupScene, { passive: true });
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', setupScene);
});

/**
 *
 *
 *
 * COMPUTED
 *
 *
 *
 */

const elevatorHeight = computed(() => {
    // TODO: Calculate the planet geostationary height
    return 36000;
});

const scaledPlanetRadius = computed(() => {
    // TODO: We may want to manipulate the radius of the planet to make it easier to work with in Three.js
    return formData.value.planetRadius;
});

const planetMass = computed(() => {
    // M = (4/3) * π * r^3 * ρ
    const result =
        (4 / 3) *
        Math.PI *
        Math.pow(scaledPlanetRadius.value, 3) *
        formData.value.planetDensity;

    return result;
});

const planetGravity = computed(() => {
    // g = (G * M) / r^2
    const result =
        (physicsConstants.gravityConstant * planetMass.value) /
        Math.pow(scaledPlanetRadius.value, 2);

    return result;
});

// Calculate gravity without using the mass of the planet
const planetGravityAlt = computed(() => {
    //g = (4/3) * π * G * r * ρ
    const result =
        (4 / 3) *
        Math.PI *
        physicsConstants.gravityConstant *
        scaledPlanetRadius.value *
        formData.value.planetDensity;

    return result;

    return result;
});

const rotationInSeconds = computed(() => {
    const result = formData.value.planetRotation * 60 * 60;

    return result;
});

const geostationaryOrbit = computed(() => {
    // h = (G * M * T^2 / 4π^2)^(1/3) - R
    const result =
        Math.pow(
            (physicsConstants.gravityConstant *
                planetMass.value *
                Math.pow(rotationInSeconds.value, 2)) /
                (4 * Math.pow(Math.PI, 2)),
            1 / 3,
        ) - scaledPlanetRadius.value;

    // measured in meters
    return result;
});

/**
 *
 *
 *
 * METHODS
 *
 *
 *
 */

async function loadModels() {
    const textureLoader = new THREE.TextureLoader();
    // //this.textures.space = await textureLoader.load('/wp-content/themes/nexus-aurora/assets/images/2k_stars.jpg');
    textures.earth = await textureLoader.load(
        textureDir + '2k_earth_daymap.jpg',
    );
    textures.mars = await textureLoader.load(textureDir + '2k_mars.jpg');
    textures.moon = await textureLoader.load(textureDir + '2k_moon.jpg');

    loading.value = false;
    setupScene();
}

// function setupAxesHelper() {
//	 if (!three.scene) return;
//	 const axesHelper = new THREE.AxesHelper(scaledPlanetRadius.value / 10); // 500 is size
//	 axesHelper.position.set(
//		 scaledPlanetRadius.value + scaledPlanetRadius.value / 10,
//		 0,
//		 0
//	 );
//	 //this.three.group.add(axesHelper);
//	 three.scene.add(axesHelper);
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

    setupThreeJS();

    setupPlanet();

    if (!animation.value.prevTick) {
        animate();
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
    three.canvas = document.getElementById('space-elevator-canvas');

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

    // // GUI
    // this.three.gui = new dat.GUI( { autoPlace: false } );
    // this.three.canvas.appendChild(this.three.gui.domElement);
}

function updateCamera() {
    if (!three.renderer) return;

    // Camera
    const cameraPositionDistance = elevatorHeight.value;
    const cameraZoomDistance = elevatorHeight.value * 2;
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
    three.controls.minDistance = formData.value.planetRadius * 1.5;
}

function setupPlanet() {
    planet.group = new THREE.Group();
    planet.axis = new THREE.Vector3(0, 1, 0); // TODO: formData.location.axis

    planet.material = new THREE.MeshLambertMaterial({
        map: textures.earth,
    });

    // switch (formData.value.location.name) {
    //	 case "Earth":
    //		 planet.material = new THREE.MeshLambertMaterial({
    //			 map: textures.earth,
    //		 });
    //		 break;
    //	 case "Mars":
    //		 planet.material = new THREE.MeshLambertMaterial({
    //			 map: textures.mars,
    //		 });
    //		 break;
    //	 case "Moon":
    //		 planet.material = new THREE.MeshLambertMaterial({
    //			 map: textures.moon,
    //		 });
    //		 break;
    // }

    planet.geometry = new THREE.SphereGeometry(
        scaledPlanetRadius.value,
        64,
        64,
    );

    //planet.material.transparent = true;

    planet.mesh = new THREE.Mesh(
        planet.geometry,
        planet.material as THREE.Material,
    );

    planet.group.add(planet.mesh);
    three.scene.add(planet.group);
}

function animate() {
    if (!three.renderer) return;
    if (!three.controls) return;

    requestAnimationFrame(animate);

    three.controls.update();

    three.renderer.render(three.scene, three.camera);

    //if (formData.value.pause) return;

    // clamp to fixed framerate
    const now = Math.round(
        (animation.value.FPS * window.performance.now()) / 1000,
    );

    if (now == animation.value.prevTick) return;

    animation.value.prevTick = now;

    // planet.group.rotateOnAxis(planet.axis, rotationSpeed.value);
}
</script>
