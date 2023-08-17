<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-3">
            <button class="btn btn-primary btn-lg px-5" @click="play">
                <i class="fas" :class="playClass"></i>
            </button>
            <h3 class="mb-0">Time: {{ currentTime }}</h3>
        </div>

        <div
            id="space-elevator-canvas"
            class="canvas-wrapper border"
            style="position: relative; height: 500px"
        >
            <i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
        </div>

        <div class="pb-2">
            <p>
                <b>Note:</b> We are assuming a constant radius cylinder for the
                Space Elevator geometry. You could taper the tether to achive
                optimal mass savings.
            </p>
            <p>
                The elevator height should be close to the scale of the planet.
                The tether width is not visually accurate because it is too
                small to see.
            </p>
        </div>

        <!-- <ResultTable>
            <tr>
                <th>Planet Mass</th>
                <td class="text-end">{{ planetMass.toExponential(3) }} kg</td>
            </tr>
            <tr>
                <th>Surface Gravity</th>
                <td class="text-end">
                    {{ formatNumber(planetGravity) }} m/s<sup>2</sup>
                </td>
            </tr>
            <tr>
                <th class="">Elevator Height</th>
                <td class="text-end">
                    {{ formatNumber(geostationaryOrbit, 0) }} km
                </td>
            </tr>
            <tr>
                <th class="">Car Travel Time</th>
                <td class="text-end">{{ travelTime }}</td>
            </tr>
            <tr>
                <th class="">Gravitational Force</th>
                <td class="text-end"></td>
            </tr>
            <tr>
                <th class="">Cross Sectional Area</th>
                <td class="text-end"></td>
            </tr>
            <tr>
                <th class="">Required Tensile Strength</th>
                <td class="text-end"></td>
            </tr> 
        </ResultTable> -->
    </div>
</template>
<script setup lang="ts">
// TODO:

// 1. Do we update the width of the cable using the crossSectionalArea? Could show why some materials are not feasible.
// 2. Caluclate the energy required to move paylaod mass at a constant velocity (carSpeed) the entire tether length
// 3. Change the planet texture when the radius changes. See mass driver for example

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    computed,
    nextTick,
    onBeforeMount,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from 'vue';
import type { SpaceElevatorForm } from './types';
import ResultTable from '../forms/v2/ResultTable.vue';
import { physicsConstants } from '../utils';

const props = defineProps<{
    formData: SpaceElevatorForm;
    crossSectionalArea: number;
    geostationaryOrbit: number;
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
    axis: new THREE.Vector3(0, 1, 0),
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
    carMesh: null as THREE.Mesh | null,
    // group: null,
    // stats: null, // used for debugging
    // gui: null, // used for debugging
    // raycaster: null,
    // mouse: null,
    minMovement: new THREE.Vector3(),
    maxMovement: new THREE.Vector3(),
};

const textureDir = '/textures/';

const animationDefaults = {
    play: false,
    FPS: 30, // In order to ensure things run smoothly on all devices we need to set a fixed framerate
    prevTick: 0, // track the last tick timestamp
    orbitRotationVector: new THREE.Vector3(0, 0, 1),
    simulationSpeed: 1000, // how much faster than real time does the animation play?
    currentFrame: 1,
    complete: false,
    duration: 10, // seconds
    durationFrames: 0, // The total number of frames in the animation
};

animationDefaults.durationFrames =
    animationDefaults.duration * animationDefaults.FPS;

const animationConstants = ref({ ...animationDefaults });

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
const elevatorTopHeight = computed(() => {
    return props.geostationaryOrbit + props.formData.planetRadius;
});

const estimatedTetherRadius = computed(() => {
    const radius = Math.sqrt(props.crossSectionalArea / Math.PI);
    return radius;
});

const carTravelTimeTotalHours = computed(() => {
    return (
        (elevatorTopHeight.value - props.formData.planetRadius) /
        props.formData.carSpeed
    );
});

const rotationSpeed = computed(() => {
    const totalNumberOfRotations =
        carTravelTimeTotalHours.value / props.formData.planetRotation;

    const oneRotation = Math.PI * 2;

    const totalRotationRadians = oneRotation * totalNumberOfRotations;

    const result =
        totalRotationRadians / animationConstants.value.durationFrames;

    return result;
});

const carAnimationSpeed = computed(() => {
    if (!three.carMesh) return 0;

    return (
        (elevatorTopHeight.value - props.formData.planetRadius) /
        animationDefaults.durationFrames
    );
});

const carTravelTimeDays = computed(() => {
    return carTravelTimeTotalHours.value / 24;
});

const carTravelRemainingHours = computed(() => {
    return (carTravelTimeDays.value % 1) * 24;
});

const travelTime = computed(() => {
    return `${Math.floor(carTravelTimeDays.value)} days, ${Math.floor(
        carTravelRemainingHours.value,
    )} hours`;
});

const currentTime = computed(() => {
    const percentComplete =
        animationConstants.value.currentFrame /
        animationConstants.value.durationFrames;

    const currentDay = (carTravelTimeTotalHours.value * percentComplete) / 24;
    const currentHour = (currentDay % 1) * 24;

    return `${Math.floor(currentDay)} days, ${Math.floor(currentHour)} hours`;
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
    textures.earth = textureLoader.load(textureDir + '2k_earth_daymap.jpg');
    textures.mars = textureLoader.load(textureDir + '2k_mars.jpg');
    textures.moon = textureLoader.load(textureDir + '2k_moon.jpg');

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

    setupThreeJS();

    setupPlanet();

    setupElevator();

    //setupAxesHelper();

    if (!animationConstants.value.prevTick) {
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
    const cameraPositionDistance = elevatorTopHeight.value * 3;
    const cameraZoomDistance = cameraPositionDistance * 2;
    let rendererSize = new THREE.Vector2();
    three.renderer.getSize(rendererSize);
    three.camera = new THREE.PerspectiveCamera(
        45,
        rendererSize.width / rendererSize.height,
        0.1,
        cameraZoomDistance * 4,
    );

    three.camera.position.y = cameraPositionDistance;
    three.camera.rotation.x = -Math.PI / 2;
    // this.three.controls.enableZoom = false;

    // Controls
    three.controls = new OrbitControls(three.camera, three.renderer.domElement);
    three.controls.maxDistance = cameraZoomDistance;
    three.controls.minDistance = props.formData.planetRadius * 1.5;
}

function setupPlanet() {
    planet.group = new THREE.Group();
    //planet.axis = new THREE.Vector3(0, 1, 0); // TODO: formData.location.axis

    if (props.formData.planetRadius > physicsConstants.earthRadius * 1.15) {
        planet.material = new THREE.MeshBasicMaterial({ color: 0x333333 });
    } else if (
        props.formData.planetRadius >
        physicsConstants.marsRadius * 1.5
    ) {
        planet.material = new THREE.MeshLambertMaterial({
            map: textures.earth,
        });
    } else if (
        props.formData.planetRadius >
        physicsConstants.moonRadius * 1.25
    ) {
        planet.material = new THREE.MeshLambertMaterial({
            map: textures.mars,
        });
    } else if (
        props.formData.planetRadius >
        physicsConstants.moonRadius * 0.5
    ) {
        planet.material = new THREE.MeshLambertMaterial({
            map: textures.moon,
        });
    } else {
        planet.material = new THREE.MeshBasicMaterial({ color: 0x333333 });
    }

    // planet.material = new THREE.MeshLambertMaterial({
    //     map: textures.earth,
    //     // transparent: true,
    //     // opacity: 0.1,
    // });

    // // switch (formData.value.location.name) {
    // //	 case "Earth":
    // //		 planet.material = new THREE.MeshLambertMaterial({
    // //			 map: textures.earth,
    // //		 });
    // //		 break;
    // //	 case "Mars":
    // //		 planet.material = new THREE.MeshLambertMaterial({
    // //			 map: textures.mars,
    // //		 });
    // //		 break;
    // //	 case "Moon":
    // //		 planet.material = new THREE.MeshLambertMaterial({
    // //			 map: textures.moon,
    // //		 });
    // //		 break;
    // // }

    planet.geometry = new THREE.SphereGeometry(
        props.formData.planetRadius,
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

// function setupAxesHelper() {
//     const axesHelper = new THREE.AxesHelper(props.formData.planetRadius / 10); // 500 is size
//     //axesHelper.position.set(three.spaceman.position.x, three.spaceman.position.y, three.spaceman.position.z,)
//     //three.group.add(axesHelper);
//     three.scene.add(axesHelper);
// }

function setupElevator() {
    const stationMaterial = new THREE.MeshPhongMaterial({
        color: 0xdddddd,
        side: THREE.FrontSide,
    });

    // Trying to show the correct width of tether makes it too small to see!
    // const tetherPercentWidth =
    //     estimatedTetherRadius.value / 1000 / props.formData.planetRadius;

    // const elevatorRadius = props.formData.planetRadius * tetherPercentWidth;

    const elevatorRadius = props.geostationaryOrbit / 500;

    const elevatorGeometry = new THREE.CylinderGeometry(
        elevatorRadius,
        elevatorRadius,
        props.geostationaryOrbit,
        24,
    );

    const elevatorMesh = new THREE.Mesh(elevatorGeometry, stationMaterial);
    elevatorMesh.rotation.x = Math.PI / 2;
    elevatorMesh.position.z =
        props.formData.planetRadius + props.geostationaryOrbit / 2;

    planet.group.add(elevatorMesh);

    const elevatorTopGeometry = new THREE.SphereGeometry(
        elevatorRadius * 6,
        24,
        24,
    );

    const elevatorTopMesh = new THREE.Mesh(
        elevatorTopGeometry,
        stationMaterial,
    );
    elevatorTopMesh.position.z = elevatorTopHeight.value;

    planet.group.add(elevatorTopMesh);
    //three.scene.add(elevatorMesh);

    setupCar();
}

function setupCar() {
    if (three.carMesh) {
        planet.group.remove(three.carMesh);
    }

    const carMaterial = new THREE.MeshPhongMaterial({
        color: 0xea6730,
        emissive: 0xea6730,
        emissiveIntensity: 1,
        side: THREE.FrontSide,
    });

    const carRadius = props.geostationaryOrbit / 80;

    const carGeometry = new THREE.SphereGeometry(carRadius, 24, 24);

    three.carMesh = new THREE.Mesh(carGeometry, carMaterial);
    three.carMesh.rotation.x = Math.PI / 2;
    three.carMesh.position.z = props.formData.planetRadius + carRadius;

    planet.group.add(three.carMesh);
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
        (animationConstants.value.FPS * window.performance.now()) / 1000,
    );

    if (now == animationConstants.value.prevTick) return;

    animationConstants.value.prevTick = now;

    if (animationConstants.value.complete || !animationConstants.value.play)
        return;

    planet.group.rotateOnAxis(planet.axis, rotationSpeed.value);

    if (three.carMesh) {
        three.carMesh.position.z += carAnimationSpeed.value;
    }

    animationConstants.value.currentFrame++;

    if (
        animationConstants.value.currentFrame >=
        animationConstants.value.durationFrames
    ) {
        animationConstants.value.play = false;
        animationConstants.value.complete = true;
    }
}

function radiansPerSecond(radius: number, speed: number) {
    const circumference = 2 * Math.PI * radius;

    return (speed / circumference) * (Math.PI * 2);
}

const playClass = computed(() => {
    if (!animationConstants.value.complete) {
        if (!animationConstants.value.play) {
            return 'fa-play';
        } else {
            return 'fa-pause';
        }
    } else {
        return 'fa-undo';
    }
});

function play() {
    if (animationConstants.value.complete) {
        reset();
        return;
    }

    animationConstants.value.play = !animationConstants.value.play;
}

function reset() {
    animationConstants.value = { ...animationDefaults };

    setupCar();
}

// NOTE: This is not very optimal, but should be fine for now
watch(props.formData, () => {
    nextTick(() => {
        setupScene();
    });
});
</script>
