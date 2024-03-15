<template>
    <div id="orbit__app" class="row" v-cloak>
        <div id="orbit__form" class="col-lg-4">
            <div class="calc-form col-12 mb-5 px-2 rounded border">
                <div>
                    <div id="mission" class="orbit__mission">
                        <div class="calc-toggle">
                            <NumberInput
                                id="orbitHeight"
                                label="Orbit Height"
                                v-model.number="orbit.height"
                                :step="1"
                                :min="200"
                                :max="350000"
                                description=""
                                unit="km"
                                @change="updateOrbitVelocity"
                                tooltip="How high above the surface is the orbit?"
                            />

                            <div class="mb-3">
                                <label for="inclination" class="form-label"
                                    >Orbital Inclination
                                    <i
                                        class="fas fa-question-circle"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        title="Orbital inclination is the angle between the plane of an orbit and the equator. An orbital inclination of 0° is directly above the equator, 90° crosses right above the pole, and 180° orbits above the equator in the opposite direction of Earth's spin."
                                    ></i
                                ></label>
                                <div class="d-flex">
                                    <input
                                        type="range"
                                        class="form-range mt-1 me-2"
                                        min="-180"
                                        max="180"
                                        id="inclination"
                                        v-model.number="orbit.inclination"
                                        @change="updateOrbitalInclination"
                                    />
                                    <span
                                        class="input-group-text justify-content-center"
                                        style="width: 80px"
                                        >{{ orbit.inclination }}&deg;</span
                                    >
                                    <!-- <input type="number" class="form-control" id="inclination" v-model.number="orbit.inclination" min="-180" max="180" > -->
                                </div>
                                <p class="description">
                                    <small class="text-muted"
                                        >-180&deg; to 180&deg;</small
                                    >
                                </p>
                            </div>

                            <SelectInput
                                id="location"
                                label="Location"
                                v-model="formData.location"
                                :options="locations"
                                tooltip="Update your environment and apply natural gravity if applicaible"
                                :description="formData.location.description"
                                @update:modelValue="updatePlanet"
                            />

                            <NumberInput
                                id="simulationSpeed"
                                label="Simulation Speed"
                                v-model.number="formData.simulationSpeed"
                                :step="1"
                                :min="1"
                                :max="10"
                                @change="updateSimulationSpeed"
                                tooltip="How fast should the simulation run?"
                            />

                            <CheckboxInput
                                id="pause"
                                label="Pause Simulation"
                                v-model="formData.pause"
                                tooltip="Pause the simulation's movement"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="orbit__results" class="col-lg-8 calc-form">
            <!-- <div id="orbit-2d" class="mb-3" style="position: relative; height: 400px;">
  <img src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/New-global-view.max-1000x1000.jpeg" />
</div> -->

            <div
                id="orbit-canvas"
                class="canvas-wrapper border"
                style="position: relative; height: 400px"
            >
                <i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
            </div>

            <button
                id="launch-ball"
                class="btn btn-primary btn-lg px-4 me-2"
                @click="startTrace"
                v-if="!orbit.tracing"
            >
                <i class="fas fa-play"></i>
            </button>
            <button
                id="stop-ball"
                class="btn btn-danger btn-lg px-4 me-2"
                @click="stopTrace"
                v-else
            >
                <i class="fas fa-stop"></i>
            </button>

            <button
                id="clear-ball"
                class="btn btn-dark btn-lg px-4"
                @click="clearOrbit"
            >
                <i class="fa-solid fa-rotate-left"></i>
            </button>

            <!-- <div class="quick-details row text-center" @click="showCalcDetails = !showCalcDetails">
  <div class="col-3">
    <div class="alert py-1 px-1" :class="angularComfort" role="alert">
      <i class="fas fa-undo"></i> {{ radsPerSec | twoDecimals }}
    </div>
  </div>

  <div class="col-3">
    <div class="alert py-1 px-1" :class="velocityComfort" role="alert">
      <i class="fas fa-flip-horizontal fa-sync-alt"></i> {{ pointTangentialVelocity | twoDecimals }}<br />
    </div>
  </div>

  <div class="col-3">
    <div class="alert py-1 px-1" :class="gravityComfort" role="alert">
      <i class="fas fa-download"></i> {{ pointCentripetalAcceleration | twoDecimals }}
    </div>
  </div>

  <div class="col-3">
    <div class="alert py-1 px-1" :class="gravityComfort" role="alert">
      <i class="fas fa-cloud-download-alt"></i> {{ pointGravity | twoDecimals }}
    </div>
  </div>
</div> -->
            <div class="p-2 rounded border mb-5 mt-3">
                <table class="table mb-0">
                    <!-- <div class="alert py-2 mb-2" :class="" role="alert">
    Planet Diameter (km): {{ planet.diameter }}<br />
  </div>

  <div class="alert py-2 mb-2" :class="" role="alert">
    Planet Mass (kg): {{ planet.mass }}
  </div> -->
                    <tbody>
                        <tr>
                            <th>Planet Radius</th>
                            <td>
                                {{ addCommas(formData.location.radius / 1000) }}
                                km
                            </td>
                        </tr>
                        <tr>
                            <th>Planet Mass</th>
                            <td>{{ formData.location.mass }} kg</td>
                        </tr>
                        <tr>
                            <th>Planet Gravity</th>
                            <td>{{ formData.location.gravity }} m/s</td>
                        </tr>
                        <tr>
                            <th>Planet Rotation Speed</th>
                            <td>
                                {{ addCommas(formData.location.rotationSpeed) }}
                                m/s
                            </td>
                        </tr>
                        <tr>
                            <th>Orbit Height</th>
                            <td>{{ addCommas(displayOrbitHeight) }} km</td>
                        </tr>
                        <tr>
                            <th>Orbit Velocity</th>
                            <td>{{ addCommas(displayOrbitVelocity) }} m/s</td>
                        </tr>
                        <tr>
                            <th>Orbtal Period</th>
                            <td>{{ displayOrbitPeriod }} hours</td>
                        </tr>
                        <tr
                            :class="
                                formData.location.hillSphere <
                                formData.location.stationaryOrbit
                                    ? 'table-warning'
                                    : ''
                            "
                        >
                            <th>Stationary Orbit</th>
                            <td>
                                {{
                                    addCommas(formData.location.stationaryOrbit)
                                }}
                                km
                            </td>
                        </tr>
                        <tr>
                            <th class="border-0">Hill Sphere</th>
                            <td class="border-0">
                                {{ addCommas(formData.location.hillSphere) }} km
                            </td>
                        </tr>
                        <tr
                            v-if="
                                orbit.decayDays &&
                                orbit.decayDays < 365 &&
                                orbit.height < orbit.maxHeight
                            "
                        >
                            <th>Orbital Decay</th>
                            <td>{{ orbit.decayDays }} days</td>
                        </tr>
                        <tr
                            v-else-if="
                                orbit.decayYears && orbit.decayYears < 1000
                            "
                        >
                            <th>Orbital Decay</th>
                            <td>{{ orbit.decayYears }} years</td>
                        </tr>
                        <tr v-else-if="orbit.decayYears">
                            <th>Orbital Decay</th>
                            <td>Centuries</td>
                        </tr>
                    </tbody>
                </table>

                <div
                    class="alert alert-warning"
                    v-if="
                        formData.location.hillSphere <
                        formData.location.stationaryOrbit
                    "
                >
                    This body does not have stable stationary orbit because its
                    Hill Sphere is smaller than its stationary orbit.
                </div>
            </div>
            <!-- 
      <button id="decay-ball" class="btn btn-nexus" @click="calcOrbitDecay">
        Calculate Decay
        <i
          v-if="orbit.calculatingDecay"
          class="fas fa-cog fa-spin center-absolute"
        ></i>
      </button>

      <div
        id="orbital-decay"
        class="mt-3"
        v-show="orbit.decayYears && orbit.decayYears <= 1000"
      >
        <h3>
          Orbital Decay
          <i
            class="fas fa-question-circle"
            data-toggle="tooltip"
            data-placement="top"
            title="The rate of orbit decay. Object considered decayed if it can no longer maintain orbit. Ignores atmosphere."
          ></i>
        </h3>

        <table class="table table-striped border">
          <tbody>
            <tr>
              <th v-if="orbit.decayDays && orbit.decayDays < 365">
                Time (days)
              </th>
              <th v-else>Time (years)</th>
              <th class="text-center">Height (km)</th>
              <th class="text-end">Period (hours)</th>
            </tr>
            <tr v-for="(decay, index) in orbit.decay" :key="index">
              <td v-if="orbit.decayDays && orbit.decayDays < 365">
                {{ decay.days }}
              </td>
              <td v-else>{{ decay.years }}</td>
              <td class="text-center">{{ decay.height }}</td>
              <td class="text-end">{{ decay.period }}</td>
            </tr>
          </tbody>
        </table>
      </div> -->
        </div>
    </div>
</template>
<script setup lang="ts">
// TODO: Must Dos!
// ! BUGS
// 1. Update the directional / ambient light to match the sun

// ? NOTE: Optional Improvements!
// ? 0. Example Orbits
// ? 1. Add more planets / custom planets?
// ? 2. Create a 2D projection of this orbit over a map?
// ? 3. Add a "tail" line to the tracer while the orbit tracer is on. To prevent the "flickering" that occurs when drawing new lines

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import CheckboxInput from '../forms/CheckboxInput.vue';

import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
import { conversion, locations } from './constants';
import type { Object3D } from 'three';
import { addCommas } from '../utils';

const loading = ref(true);
const models = ref({});

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

const orbit = ref({
    velocity: 27358, // km/h NOTE: While we accept km/h we need to convert this to m/s later
    hours: 0,
    inclination: 0,
    height: 400,
    period: 0,
    geometry: new THREE.SphereGeometry(),
    material: new THREE.Material(),
    wireframe: new THREE.Object3D(),
    interval: 0,
    tracing: false,
    tickTime: 0,
    maxHeight: 1000,
    minHeight: 0,
    calculatingDecay: false,
    decayDays: 0,
    decayYears: 0,
    decay: [
        {
            days: '0',
            years: '0',
            height: '0',
            period: '0',
            rotation: {
                x: 0,
                y: 0,
            },
        },
    ],
});

const ship = {
    mesh: new THREE.Mesh(),
    group: new THREE.Group(),
    width: 0,
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
    minMovement: null as THREE.Vector3 | null,
    maxMovement: null as THREE.Vector3 | null,
};

const help = ref({
    tooltipModal: null,
    tooltipTitle: null,
    tooltipDescription: '',
});

const tracing = ref({
    previousPoint: null,
    maxPoints: 700,
    positions: null,
    material: new THREE.Material(),
    line: [] as THREE.Line[],
    points: [] as THREE.Object3D[],
    pointIndex: 0,
});

const formData = ref({
    location: locations[0],
    angle: 0,
    gravity: 1,
    pause: false,
    simulationSpeed: 1,
    planetScale: 1,
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
    //formData.value.location = locations[0];
    calcOrbitalVelocity();
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

const scaledPlanetRadius = computed(() => {
    return formData.value.location.radius * formData.value.planetScale;
});

const scaledPlanetSpeed = computed(() => {
    return formData.value.location.rotationSpeed * formData.value.planetScale;
});

const scaledOrbitHeight = computed(() => {
    return orbit.value.height * 1000 * formData.value.planetScale;
});

const scaledShipSpeed = computed(() => {
    return kmhTOms(orbit.value.velocity) * formData.value.planetScale;
});

const scaledSimulationSpeed = computed(() => {
    return formData.value.simulationSpeed * 2000;
});

const scaledPlanetUpdateSpeed = computed(() => {
    return (
        velocityToUpdateSpeed(scaledPlanetSpeed.value) *
        scaledSimulationSpeed.value
    );
});

const scaledShipUpdateSpeed = computed(() => {
    return (
        velocityToUpdateSpeed(scaledShipSpeed.value) *
        scaledSimulationSpeed.value
    );
});

const rotationSpeed = computed(() => {
    return (
        (radiansPerSecond(scaledPlanetRadius.value, scaledPlanetSpeed.value) /
            animation.value.FPS) *
        scaledSimulationSpeed.value
    );
});

const totalOrbitHeight = computed(() => {
    return scaledPlanetRadius.value + scaledOrbitHeight.value;
});

const actualOrbitHeight = computed(() => {
    // km
    return formData.value.location.radius / 1000 + orbit.value.height;
});

const orbitSpeed = computed(() => {
    return (
        (radiansPerSecond(totalOrbitHeight.value, scaledShipSpeed.value) /
            animation.value.FPS) *
        scaledSimulationSpeed.value
    );
});

const inclinationVector = computed(() => {
    // const inclinationRadians = this.degreesToRadians(orbit.value.inclination);
    let zRadians = 0;
    let yRadians = 1;
    let xRadians = 0;
    let percentOfQuarterPI = 0;

    if (Math.abs(orbit.value.inclination) > 90) {
        xRadians = 1;
        percentOfQuarterPI = (Math.abs(orbit.value.inclination) - 90) / 90;
        yRadians = -(xRadians * percentOfQuarterPI).toPrecision(6);
        xRadians = xRadians + yRadians;
    } else {
        percentOfQuarterPI = Math.abs(orbit.value.inclination) / 90;
        xRadians = parseFloat((yRadians * percentOfQuarterPI).toPrecision(6));
        yRadians = yRadians - xRadians;
    }

    if (orbit.value.inclination < 0) {
        xRadians *= -1;
    }

    return new THREE.Vector3(-xRadians, yRadians, zRadians).normalize();
});

// DISPLAY CALCS
const displayOrbitHeight = computed(() => {
    return orbit.value.height;
});

const displayOrbitVelocity = computed(() => {
    return Math.round(kmhTOms(orbit.value.velocity));
});

const displayOrbitPeriod = computed(() => {
    return orbit.value.period.toFixed(4);
});
//flight velocity: v=√398600.56378.14+h(km/s)orbital period: P=2π6378.14+hv(sec)

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
        //three.scene.dispose();
        removeAllChildNodes(three.canvas);
        // NEW TODO: Might need to update defaultThree OR figure out how not to need this
        //three.value = defaultThree;
    }

    //needsUpdate.value = false;

    setupThreeJS();

    setupPlanet();

    setupStarship();

    //this.setupAxesHelper();

    if (!animation.value.prevTick) {
        animate();
    }
}

function setupThreeJS() {
    three.scene = new THREE.Scene();
    ship.group = new THREE.Group();
    planet.group = new THREE.Group();

    // Renderer
    three.renderer = new THREE.WebGLRenderer({
        antialias: true,
        logarithmicDepthBuffer: true,
    }); // { alpha: true }
    three.canvas = document.getElementById('orbit-canvas');

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
    const cameraPositionDistance = totalOrbitHeight.value * 3;
    const cameraZoomDistance = totalOrbitHeight.value * 6; //this.stationWidth * 10;
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
    three.controls.minDistance = totalOrbitHeight.value;
}

function updatePlanet() {
    planet.group.remove(planet.mesh);
    three.scene.remove(planet.group);
    ship.group.remove(ship.mesh);
    three.scene.remove(ship.group);

    stopTrace();
    clearDecayInfo();
    setupPlanet();
    setupStarship();
}

function setupPlanet() {
    planet.group = new THREE.Group();
    planet.axis = new THREE.Vector3(0, 1, 0); // TODO: formData.location.axis

    switch (formData.value.location.name) {
        case 'Earth':
            planet.material = new THREE.MeshLambertMaterial({
                map: textures.earth,
            });
            break;
        case 'Mars':
            planet.material = new THREE.MeshLambertMaterial({
                map: textures.mars,
            });
            break;
        case 'Moon':
            planet.material = new THREE.MeshLambertMaterial({
                map: textures.moon,
            });
            break;
    }

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

function setupStarship() {
    calcOrbitalVelocity();
    calcOrbitPeriod();
    updateCamera();

    orbit.value.decay = [];

    if (ship.mesh) {
        ship.group.remove(ship.mesh);
        three.scene.remove(orbit.value.wireframe);
    }

    ship.width = totalOrbitHeight.value * 0.02;

    const starshipGeometry = new THREE.SphereGeometry(ship.width, 16, 16);

    const starshipMetalMaterial = new THREE.MeshBasicMaterial({
        color: 0xea6730,
    });

    ship.mesh = new THREE.Mesh(starshipGeometry, starshipMetalMaterial); // this.models.starship

    ship.group.add(ship.mesh);

    resetShipPosition();

    three.scene.add(ship.group);

    // Orbit tracers
    orbit.value.geometry = new THREE.SphereGeometry(ship.width, 3, 3);
    orbit.value.material = new THREE.MeshBasicMaterial({ color: 0xea6730 });

    tracing.value.material = new THREE.LineBasicMaterial({
        color: 0xea6730,
        linewidth: 1,
    });
}

function resetShipPosition() {
    ship.group.position.set(0, 0, 0);
    ship.group.rotation.set(0, 0, 0);
    ship.mesh.position.set(0, 0, totalOrbitHeight.value + ship.width);

    // TODO: "Orbit Ring" Not working. Might be nice to always show the path the orbit is on outside the earth rotation frame of reference
    // const orbitRadius = totalOrbitHeight.value + this.ship.width;
    // //const geometry = new THREE.SphereGeometry( orbitRadius, 32, 32 );
    // const geometry = new THREE.RingGeometry( orbitRadius - this.ship.width, orbitRadius + this.ship.width, 32 );
    // const material = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide } );

    // material.depthTest = false;
    // // material.opacity = 0.25;
    // material.transparent = true;

    // const mesh = new THREE.Mesh( geometry, material );
    // mesh.rotation.set(Math.PI / 2, 0, 0);

    // this.three.scene.add( mesh );

    // const rulerFolder = this.three.gui.addFolder('Ship');
    // rulerFolder.add(mesh.rotation, 'x', -Math.PI, Math.PI );
    // rulerFolder.add(mesh.rotation, 'y', -Math.PI, Math.PI);
    // rulerFolder.add(mesh.rotation, 'z', -Math.PI, Math.PI);
    // rulerFolder.open();
}

function animate() {
    if (!three.renderer) return;
    if (!three.controls) return;

    requestAnimationFrame(animate);

    three.controls.update();

    //this.three.camera.position.clamp(this.three.minMovement, this.three.maxMovement);
    three.renderer.render(three.scene, three.camera);

    if (formData.value.pause) return;

    // clamp to fixed framerate
    const now = Math.round(
        (animation.value.FPS * window.performance.now()) / 1000,
    );

    if (now == animation.value.prevTick) return;

    animation.value.prevTick = now;

    planet.group.rotateOnAxis(planet.axis, rotationSpeed.value);

    ship.group.rotateOnAxis(inclinationVector.value, orbitSpeed.value);
}

function startTrace() {
    // TODO: AI made this function...does it do what I think it does?
    // if (orbit.wireframe) {
    //   three.scene.remove(orbit.wireframe);
    // }

    // orbit.wireframe = new THREE.Line(orbit.geometry, tracing.material);
    // three.scene.add(orbit.wireframe);
    stopTrace();
    clearOrbit();

    orbit.value.tracing = true;
    orbit.value.tickTime = 100000 / scaledSimulationSpeed.value; //orbit.value.period / formData.value.simulationSpeed * (100 * formData.value.simulationSpeed) //orbit.valueSpeed * 1000; //300; //this.;

    orbit.value.interval = window.setInterval(traceOrbit, orbit.value.tickTime);

    traceOrbit();
}

function traceOrbit() {
    if (!ship.mesh) return;
    if (!planet.group) return;
    if (formData.value.pause) return;

    var target = new THREE.Vector3();
    ship.mesh.getWorldPosition(target);

    // ? NOTE: We used to set balls to track orbits. It looks neat and may reimplement. Got hard to see the pattern over time though :(
    // const ball = new THREE.Mesh(orbit.value.geometry, orbit.value.material);

    // We are sticking an actual point into the world so it rotates with the planet. Just tracking the target would mean the lines would be offset
    const point = new THREE.Object3D();
    point.position.set(target.x, target.y, target.z);

    tracing.value.points[tracing.value.pointIndex] = point;

    let geometry = null;
    let line = null;

    if (tracing.value.pointIndex > 0) {
        // ? NOTE: This is not my favorite solution. I tried just using a buffer geometery and adding points to it so we just had one geometry instead of one for each pair of points. However, I couldn't get it working how I wanted
        // ? NOTE: This solution seems to work pretty well. In an ideal world we would have a curved line to represent the orbit path
        const points = [];

        let firstPoint = new THREE.Vector3();
        let secondPoint = new THREE.Vector3();
        tracing.value.points[tracing.value.pointIndex - 1].getWorldPosition(
            firstPoint,
        );
        tracing.value.points[tracing.value.pointIndex].getWorldPosition(
            secondPoint,
        );
        points.push(
            new THREE.Vector3(firstPoint.x, firstPoint.y, firstPoint.z),
        );
        points.push(
            new THREE.Vector3(secondPoint.x, secondPoint.y, secondPoint.z),
        );

        geometry = new THREE.BufferGeometry().setFromPoints(points);
        line = new THREE.Line(geometry, tracing.value.material);

        tracing.value.line[tracing.value.pointIndex] = line;
    }

    // We have reached our point limit so instead of just attaching we are also removing from the front of the array
    if (line && tracing.value.line.length >= tracing.value.maxPoints) {
        const removePoint = tracing.value.pointIndex % tracing.value.maxPoints;

        tracing.value.points[removePoint] = point;
        tracing.value.line[removePoint] = line;

        planet.group.remove(planet.group.children[1]);
        planet.group.remove(planet.group.children[2]);

        // We don't want our pointIndex to skyrocket to crazy levels so lets limit it to 2x max points to allow our modulus above to work
        if (tracing.value.pointIndex >= tracing.value.maxPoints * 2) {
            tracing.value.pointIndex = tracing.value.maxPoints;
        } else {
            tracing.value.pointIndex++;
        }
    } else {
        tracing.value.pointIndex++;
    }

    planet.group.attach(point);

    // const mercator = this.mercator(target.x, target.y);
    // console.log(mercator);

    if (line) {
        planet.group.attach(line);
    }
}

function stopTrace() {
    if (orbit.value.interval) {
        clearInterval(orbit.value.interval);
    }

    orbit.value.tracing = false;
}

/**
 * @link https://www.lizard-tail.com/isana/lab/orbital_decay/
 */
// function calcOrbitDecay() {
//   orbit.value.calculatingDecay = true;

//   // ? NOTE: These are extremely rough values.
//   orbit.value.maxHeight = Math.round(formData.value.location.radius / 1000 / 6);
//   orbit.value.minHeight = Math.round(
//     formData.value.location.radius / 1000 / 40
//   );

//   orbit.value.decayYears = 0;
//   orbit.value.decay = [];

//   if (orbit.value.height >= orbit.value.maxHeight) {
//     orbit.value.calculatingDecay = false;
//     orbit.value.decayYears = 10000;
//     return;
//   }

//   const sat_mass = 100; // kg // TODO: Optional User enter value?
//   const sat_area = 1; // m^2 // TODO: Optional User enter value?
//   let sat_height = orbit.value.height;
//   const solar_radio_flux = 70; // TODO: Optional user value. https://www.swpc.noaa.gov/phenomena/f107-cm-radio-emissions
//   const geomagnetic_index = 10; // TODO: Optional value for user to enter. Set defaults for each planet. https://spawx.nwra.com/spawx/ap.html

//   //var re = formData.value.location.radius; // 6378137
//   //var me = formData.value.location.mass; // 5.98e+24;//earth mass (all si units)
//   //var g = planet.gravityConstant; //6.67e-11;  //universal constant of gravitation
//   const pi = Math.PI;
//   let totalTime = 0;

//   // Orbits can decay VERY SLOWLY and we don't want to freeze the browser making these long calculations. So try to vary our time intervals based on a max orbit size
//   let incrementDays = actualOrbitHeight.value / 100;
//   if (orbit.value.height < orbit.value.maxHeight / 3) {
//     incrementDays = actualOrbitHeight.value / 100000;
//   } else if (orbit.value.height < orbit.value.maxHeight / 2) {
//     incrementDays = actualOrbitHeight.value / 1000;
//   }

//   const incrementSeconds = incrementDays * 3600 * 24;
//   let radius = actualOrbitHeight.value * 1000; // radius in meters
//   let periodSeconds = orbit.value.period * 60 * 60;

//   const heightIncrement = 10;
//   let currentHeight = sat_height;

//   let decaySafety = 0;

//   //now iterate satellite orbit with time
//   while (sat_height > orbit.value.minHeight) {
//     const spaceDrag =
//       (900 + 2.5 * (solar_radio_flux - 70) + 1.5 * geomagnetic_index) /
//       (27 - 0.012 * (sat_height - 200));
//     const atmosDensity = 6e-10 * Math.exp(-(sat_height - 175) / spaceDrag); //atmospheric density
//     const decrementPeriod =
//       ((3 * pi * sat_area) / sat_mass) *
//       radius *
//       atmosDensity *
//       incrementSeconds; //decrement in orbital period

//     const periodMinutes = periodSeconds / 60;

//     periodSeconds = periodSeconds - decrementPeriod;
//     totalTime = totalTime + incrementDays;
//     radius = Math.pow(
//       (planet.gravityConstant *
//         formData.value.location.mass *
//         periodSeconds *
//         periodSeconds) /
//         4 /
//         pi /
//         pi,
//       0.33333
//     ); //new orbital radius
//     sat_height = (radius - formData.value.location.radius) / 1000; //new altitude

//     // ? var meanMotion = 1440 / pm
//     // ? var decay = decrementPeriod / incrementDays / periodSeconds * meanMotion; //rev/day/day
//     if (sat_height <= currentHeight) {
//       orbit.value.decay.push({
//         days: totalTime.toFixed(2),
//         years: (totalTime / 365.25).toFixed(2),
//         height: sat_height.toFixed(2),
//         period: (periodMinutes / 60).toFixed(2),
//         rotation: {
//           x: 0,
//           y: 0,
//         },
//       });

//       currentHeight = currentHeight - heightIncrement;
//     }

//     if (++decaySafety >= 10000) {
//       break;
//     }

//     // TODO: Do we need to await / async our calcs? Rare, but can be important for long decay times
//     // Lets pause for a few milliseconds in the loop to prevent blocking the thread entirely
//     ///await new Promise(r => setTimeout(r, 10));
//   }

//   orbit.value.calculatingDecay = false;
//   orbit.value.decayDays = parseFloat(totalTime.toFixed(2));
//   orbit.value.decayYears = parseFloat((totalTime / 365.25).toFixed(2));
// }

function clearOrbit() {
    stopTrace();

    if (tracing.value.points.length) {
        clearLine();

        tracing.value.points = [];
        tracing.value.line = [];
        tracing.value.pointIndex = 0;
    }
}

function clearLine() {
    for (var i = planet.group.children.length - 1; i >= 0; i--) {
        // @ts-ignore
        if (planet.group.children[i].isMesh) continue;

        planet.group.remove(planet.group.children[i]);
    }
}

function clearDecayInfo() {
    orbit.value.calculatingDecay = false;
    orbit.value.decayDays = 0;
    orbit.value.decayYears = 0;
    orbit.value.decay = [
        {
            days: '0',
            years: '0',
            height: '0',
            period: '0',
            rotation: {
                x: 0,
                y: 0,
            },
        },
    ];
}

// updateOrbitHeight() {
//   this.calcOrbitPeriod();
//   this.calcOrbitHeight();
//   this.updateCamera();
//   this.setupStarship();
// },
function updateOrbitVelocity() {
    if (orbit.value.height > 1000000) {
        orbit.value.height = 1000000;
    } else if (orbit.value.height < 100) {
        orbit.value.height = 100;
    }

    // TODO: We may want even high numbers for values over 10000 orbit height
    tracing.value.maxPoints = 600 + Math.floor(orbit.value.height / 200); //Math.max(Math.floor(orbit.value.height * 1.3), 600);

    if (orbit.value.height > 10000) {
        tracing.value.maxPoints += Math.floor(orbit.value.height / 200);
    }

    // always have an even number of points
    // tracing.value.maxPoints += tracing.value.maxPoints % 2 ? 1 : 0;

    stopTrace();
    clearDecayInfo();
    calcOrbitalVelocity();
    calcOrbitPeriod();
    updateCamera();
    setupStarship();
}

function updateOrbitalInclination() {
    if (orbit.value.inclination > 180) {
        orbit.value.inclination = 180;
    } else if (orbit.value.inclination < -180) {
        orbit.value.inclination = -180;
    }

    stopTrace();
    clearOrbit();
    resetShipPosition();
}

function updateSimulationSpeed() {
    if (formData.value.simulationSpeed > 10) {
        formData.value.simulationSpeed = 10;
    } else if (formData.value.simulationSpeed < 1) {
        formData.value.simulationSpeed = 1;
    }

    stopTrace();
    clearOrbit();
}

// CONVERSION FUNCTIONS
function kmhTOms(kmh: number) {
    return kmh / 3.6; // kmh / 60 / 60 * 1000; // / minutes / seconds * km->m
}
function velocityToUpdateSpeed(velocity: number) {
    return velocity / animation.value.FPS;
}
function radiansToDegrees(radians: number) {
    return radians / (Math.PI / 180);
}
function degreesToRadians(degrees: number) {
    return degrees * (Math.PI / 180);
}

function getPercentageChange(oldNumber: number, newNumber: number) {
    const decreaseValue = oldNumber - newNumber;

    return decreaseValue / oldNumber;
}
function radiansPerSecond(radius: number, speed: number) {
    const circumference = 2 * Math.PI * radius;

    return (speed / circumference) * (Math.PI * 2);
}
function calcOrbitalVelocity() {
    orbit.value.velocity = Math.round(
        (Math.sqrt(
            (planet.gravityConstant * formData.value.location.mass) /
                totalOrbitHeight.value,
        ) /
            1000) *
            60 *
            60,
    );
}

// ? NOTE: This works, however, because it requires an orbital period it can be trickey using this to update anything since the period relies on the height.
// ? We have chosen, for now, to only allow updating of the height manually and velocity dynamically. This should be what most people want anway.
// function calcOrbitHeight() {
//   // Orbit period mus be in seconds
//   // Also convert from meters to km
//   const height = (Math.cbrt( (Math.pow(orbit.value.period * 60 * 60, 2) * planet.gravityConstant * formData.value.location.mass) / (4 * Math.pow(Math.PI, 2)) ) - formData.value.location.radius) / 1000;
// },

function calcOrbitPeriod() {
    const mu =
        planet.gravityConstant * (formData.value.location.mass / 1000000000);
    orbit.value.period =
        (2.0 *
            Math.PI *
            Math.sqrt(
                (actualOrbitHeight.value *
                    actualOrbitHeight.value *
                    actualOrbitHeight.value) /
                    mu,
            )) /
        60 /
        60;
}

//   watch: {
//     },
//     // formData: {
//     //   handler(newVal){
//     //     // Updating scene here to only update onces per watch.
//     //     if(this.needsUpdate){
//     //       this.setupScene();
//     //     }
//     //   },
//     //   deep: true
//     // }
//   },
// });
</script>

<style></style>
