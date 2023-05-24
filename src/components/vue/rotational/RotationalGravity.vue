<template>
  <div id="rotational__app" class="row mt-5" v-cloak>
    <div id="rotational__form" class="col-lg-4">
      <div class="calc-form col-12 mb-5 px-2 rounded border">
        <div>
          <div id="mission" class="rotational__mission">
            <!-- <h4>Mission</h4> -->
            <div class="calc-toggle">
              <SelectInput
                id="structureType"
                label="Structure Type"
                v-model="formData.type"
                :options="availableTypes"
                tooltip="What type of object is rotating? Different structures provide different advantages."
                @update:modelValue="updateType"
                :description="formData.type.description"
              />

              <NumberInput
                v-if="formData.type.shape != 'can'"
                id="shipLength"
                :label="structureLengthName"
                v-model="formData.shipLength"
                tooltip="The length of the structure. This is only visual and does not affect the results."
                :min="1"
                unit="m"
                @change="updateShipLength"
              />

              <NumberInput
                id="radius"
                label="Radius"
                v-model="formData.radius"
                tooltip="The distance from the center of rotation to the outer edge of the structure."
                :min="0"
                unit="m"
                @change="updateRadius"
              />

              <NumberInput
                id="rpm"
                label="Revolutions per minute"
                v-model="formData.rpm"
                tooltip="The rotation speed of the structure"
                :min="0"
                :max="1000"
                :step="0.1"
                unit="rpm"
                @change="updateRPM"
              />

              <NumberInput
                id="gravity"
                label="Gravity"
                v-model="formData.gravity"
                tooltip="The apparent gravity applied by the centripetal acceleration."
                :min="0"
                :step="0.01"
                unit="g"
                @change="updateGravity"
              />

              <SelectInput
                id="location"
                label="Location"
                v-model="formData.location"
                :options="locations"
                tooltip="Update your environment and apply natural gravity if applicaible"
                @update:modelValue="setupScene"
                :description="formData.location.description"
              />

              <CheckboxInput
                id="showEnvironment"
                label="Show environment?"
                v-model="formData.showEnvironment"
                tooltip="Show the planet at your location. Purely visual."
                @change="setupScene"
              />

              <!-- <div class="form-check form-switch mb-3">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="isSpace"
                  v-model="formData.isSpace"
                  @change="setupScene"
                />
                <label class="form-check-label" for="isSpace">
                  In Space?
                  <i
                    class="fas fa-question-circle"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="0g environment or on the surface of a planet?"
                  ></i>
                </label>
              </div> -->

              <CheckboxInput
                id="seeInside"
                label="Show Inside of Structure?"
                v-model="formData.seeInside"
                tooltip="Display the inside or outside of the structure. Purely visual."
                @change="setupScene"
              />

              <CheckboxInput
                v-if="
                  formData.type.shape == 'cylinder' ||
                  formData.type.shape == 'can'
                "
                id="hollow"
                label="Hollow Cylinder?"
                v-model="formData.hollow"
                tooltip="Should the structure be hollow? Purely visual."
                @change="setupScene"
              />

              <!-- <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" id="focusSuit" v-model="formData.focusSuit">
            <label class="form-check-label" for="focusSuit">
              Focus on suit?
            </label>
          </div> -->
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="rotational__results" class="col-lg-8 calc-form">
      <div class="control-instructions">
        <!-- <div class="alert alert-info" role="alert">
        <p class="mb-0"><small>left click to rotate</small></p>
        <p class="mb-0"><small>right click to drag</small></p>
        <p class="mb-0"><small>scroll to zoom</small></p>
    </div> -->
      </div>

      <div
        id="rotational-canvas"
        class="mb-3 d-flex align-items-center justify-content-center"
        style="position: relative; height: 400px"
      >
        <i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
      </div>

      <div class="form-check form-switch mb-3">
        <input
          class="form-check-input"
          type="checkbox"
          id="pause"
          v-model="formData.pause"
        />
        <label class="form-check-label" for="pause">
          Pause Movement?
          <i
            class="fas fa-question-circle"
            data-toggle="tooltip"
            data-placement="top"
            title="Stop the motion of the estimator"
          ></i>
        </label>
      </div>

      <div class="form-check form-switch mb-3">
        <input
          class="form-check-input"
          type="checkbox"
          id="showGravityRule"
          v-model="formData.showGravityRule"
          @change="setupScene"
        />
        <label class="form-check-label" for="showGravityRule">
          Show gravity ruler?
          <i
            class="fas fa-question-circle"
            data-toggle="tooltip"
            data-placement="top"
            title="Show a measurement tool for accurately finding the forces at any point along the structure's radius"
          ></i>
        </label>
      </div>

      <div class="mb-4" v-if="formData.showGravityRule">
        <label for="point" class="form-label">Measurement Point</label>
        <input
          id="point"
          type="range"
          class="form-range"
          min="0"
          :max="formData.radius"
          v-model.number="formData.rulerPoint"
          @input="updateMeasurementPoint"
        />

        <div class="input-group">
          <input
            type="number"
            class="form-control"
            id="point"
            v-model.number="formData.rulerPoint"
            min="0"
            :max="formData.radius"
            @input="updateMeasurementPoint"
          />
          <span class="input-group-text">m</span>
        </div>
      </div>

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
      <div class="split-details" v-show="showCalcDetails">
        <div class="alert py-2 mb-2" :class="angularComfort" role="alert">
          <i class="fas fa-undo"></i> Angular Velocity (radians/s):
          {{ formatNumber(radsPerSec) }}
        </div>

        <div class="alert py-2 mb-2" :class="velocityComfort" role="alert">
          <i class="fas fa-flip-horizontal fa-sync-alt"></i> Tangential Velocity
          (m/s): : {{ formatNumber(pointTangentialVelocity) }}<br />
        </div>

        <div class="alert py-2 mb-2" :class="gravityComfort" role="alert">
          <i class="fas fa-download"></i> Centripetal Acceleration (m/s):
          {{ formatNumber(pointCentripetalAcceleration) }}
        </div>

        <div class="alert py-2 mb-3" :class="gravityComfort" role="alert">
          <i class="fas fa-cloud-download-alt"></i> Apparent Gravity (g):
          {{ formatNumber(pointGravity) }}
        </div>
      </div>

      <!-- <div id="coriolis" class="form-row" v-if="!formData.pause">
    <div class="col-12 d-flex justify-content-between">
      <button id="launch-ball" class="btn btn-nexus" @click="launchBall" v-if="!coriolis.tracing">Toss</button>
      <button id="stop-ball" class="btn btn-danger" @click="stopTrace" v-else>Stop</button>

      <button id="clear-ball" class="btn btn-dark" v-if="coriolis.ballGroup.length" @click="clearBalls">Clear</button>

      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" id="applyGravity" v-model="coriolis.applyGravity">
        <label class="form-check-label" for="applyGravity">
          Apply Gravity? 
        </label> 
        <i class="fas fa-question-circle" 
            data-toggle="tooltip" 
            data-placement="top" 
            title="While ball is in motion apply the apparent gravity aka centripetal acceleration"></i>
      </div>
    </div>
    <div class="col-12 mt-3">
      <label for="velocity" class="form-label">Ball Velocity 
        <i class="fas fa-question-circle" 
          data-toggle="tooltip" 
          data-placement="top" 
          title="What speed should the ball leave the ground? Ball only moves in the vertical direction"></i>
        </label>
      <div class="input-group">
        <input type="number" class="form-control" id="velocity" v-model.number="coriolis.velocity" min="0" >
        <span class="input-group-text">m/s</span>
      </div>
    </div>
  </div> -->

      <div
        id="funnel-dimentions"
        class="mt-3"
        v-if="formData.type.shape === 'funnel'"
      >
        <h3>
          Funnel Dimensions
          <i
            class="fas fa-question-circle"
            data-toggle="tooltip"
            data-placement="top"
            title="The funnel shape is generated based on comparing the planet graviy with the apparent gravity. Meaning that different levels of gravity require a different slope to provide a balanced amount of force."
          ></i>
        </h3>
        <table class="table table-striped">
          <tr>
            <th>Incidence Angle</th>
            <td><span class="h4">⦩</span></td>
            <td>{{ funnel.angleOfIncidence }}</td>
            <td>&deg;</td>
          </tr>
          <tr>
            <th>Opposite Angle</th>
            <td><span class="h4">⦮</span></td>
            <td>{{ funnel.oppositeAngle }}</td>
            <td>&deg;</td>
          </tr>
          <tr>
            <th>Net Force</th>
            <td><span class="h4">↥</span></td>
            <td>{{ funnel.netCentripetalForce }}</td>
            <td>m/s</td>
          </tr>
          <tr>
            <th>Platform Width</th>
            <td><span class="h4">c</span></td>
            <td>{{ formData.shipLength }}</td>
            <td>m</td>
          </tr>
          <tr>
            <th>Width</th>
            <td><span class="h4">a</span></td>
            <td>{{ funnel.baseWidth }}</td>
            <td>m</td>
          </tr>
          <tr>
            <th>Height</th>
            <td><span class="h4">b</span></td>
            <td>{{ funnel.baseHeight }}</td>
            <td>m</td>
          </tr>
          <tr>
            <th>Inner Radius</th>
            <td><i class="far fa-dot-circle"></i></td>
            <td>{{ funnel.innerRadius }}</td>
            <td>m</td>
          </tr>
          <tr>
            <th>Outer Radius</th>
            <td><i class="far fa-circle"></i></td>
            <td>{{ funnel.outerRadius }}</td>
            <td>m</td>
          </tr>
        </table>
      </div>

      <!-- <div>
    force Vector
    <svg style="width: 100px; height: 100px;" viewbox="0 0 100 100">
      <line x1="0" y1="0" :x2="200" y2="0" style="stroke:rgb(255,0,0);stroke-width:2" />
      <line x1="0" y1="0" :x2="100" :y2="centripetalAcceleration / 2" style="stroke:rgb(0,0,255);stroke-width:2" />
      <line x1="0" y1="0" x2="0" :y2="centripetalAcceleration" style="stroke:rgb(0,255,0);stroke-width:2" />
    </svg>
  </div> -->

      <!-- <div id="spaceman-gravity" class="mb-3" style="position: relative; height: 400px;">
    <i v-if="loading" class="fas fa-cog fa-spin center-absolute"></i>
  </div> -->
    </div>
  </div>
</template>
<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS
// 1. When adjusting the ship length the dial sometimes becomes offset by about half it's length.

// ? NOTE: Optional Improvements!

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue";

import SelectInput from "../forms/SelectInput.vue";
import NumberInput from "../forms/NumberInput.vue";
import CheckboxInput from "../forms/CheckboxInput.vue";

import type { Location, StationType } from "./constants";
import { locations, types, conversion, defaultThree } from "./constants";
import {
  formatNumber,
  clampNumber,
  gTom2s,
  m2sTog,
  radiansPerSecToRpm,
  radiansToDegrees,
  rpmToRadians,
} from "../utils";

const loading = ref(true);
const needsUpdate = ref(false);
const showCalcDetails = ref(true);
const models = {
  spaceman: null as GLTF | null,
};

const textures = {
  space: new THREE.Texture(),
  earth: new THREE.Texture(),
  mars: new THREE.Texture(),
  moon: new THREE.Texture(),
  earthNormal: new THREE.Texture(),
  earthClouds: new THREE.Texture(),
};

const planet = {
  mesh: new THREE.Mesh(),
  clouds: null,
  axis: new THREE.Vector3(0, 1, 0),
  speed: 0,
  radius: 6357000,
  geometry: null as THREE.CircleGeometry | THREE.SphereGeometry | null,
  material: new THREE.Material(),
};

const three = {
  canvas: null as HTMLElement | HTMLCanvasElement | null,
  renderer: null as THREE.WebGLRenderer | null,
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(),
  controls: null as OrbitControls | null,
  station: new THREE.Mesh(),
  spaceman: new THREE.Group(),
  group: new THREE.Group(),
  // stats: null, // used for debugging
  // gui: null, // used for debugging
  // raycaster: null,
  // mouse: null,
  minMovement: null as THREE.Vector3 | null,
  maxMovement: null as THREE.Vector3 | null,
};

const ruler = {
  lineCylinder: new THREE.Mesh(),
  lineMaterial: new THREE.Material(),
  dial: new THREE.Mesh(),
  dialMaterial: new THREE.Material(),
};

const coriolis = {
  // start: 0,
  // end: 0,
  tracing: false,
  tickTime: 0,
  mass: 0,
  velocity: 10, // m/s
  startingVelocity: 10,
  ball: new THREE.Mesh(),
  ballGroup: [] as THREE.Mesh[],
  applyGravity: false,
  interval: 0,
  geometry: new THREE.SphereGeometry(),
  material: new THREE.Material(),
};

const help = ref({
  tooltipModal: null,
  tooltipTitle: null,
  tooltipDescription: "",
});

const formData = ref({
  location: locations[0],
  type: types[0],
  isSpace: true,
  //gravityOption: null,
  gravity: 1,
  radius: 1000,
  rpm: 1,
  angularVelocity: 0, // aka rpm
  tangentialVelocity: 0,
  centripetalAcceleration: 0,
  shipLength: 30,
  shipWidth: 9,
  rulerPoint: 1000,
  hollow: true,
  showEnvironment: true,
  seeInside: true,
  showGravityRule: true,
  pause: false,
  showLocalAxis: true,
});

const forces = {
  vector: 0,
  vectorMesh: new THREE.Mesh(),
};
const funnel = {
  angleOfIncidence: 0,
  oppositeAngle: 0,
  netCentripetalForce: 0,
  baseWidth: 0,
  baseHeight: 0,
  innerRadius: 0,
  outerRadius: 0,
};

const animation = {
  FPS: 60, // In order to ensure things run smoothly on all devices we need to set a fixed framerate
  prevTick: 0, // track the last tick timestamp
  rotationSpeed: 0.1, // This tells threeJS how fast to move and is based on the rpm
  radians: 6, // there are 6 radians in a circle. This helps us to calculate full rotations
};

/**
 *
 * SETUP
 *
 */
onBeforeMount(() => {
  //three = defaultThree;

  // Default selected options
  //formData.value.gravityOption = this.gravityOptions[0];

  // formData.value.gravity = formData.value.location.g;
  formData.value.radius = formData.value.type.defaults.radius;
  formData.value.rpm = formData.value.type.defaults.rpm;
  formData.value.shipLength = formData.value.type.defaults.length; //angularVelocity;

  updateRadius();
});

onMounted(() => {
  loadModels();

  window.addEventListener("resize", setupScene, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", setupScene);
});

/**
 *
 *
 * COMPUTED
 *
 *
 */

const structureLengthName = computed(() => {
  return formData.value.type.shape === "funnel"
    ? "Platform Width"
    : "Structure Length";
});

const rotationSpeed = computed(() => {
  return rpmToUpdateSpeed(formData.value.rpm); //(formData.value.rpm / (this.animation.FPS * 60)) * this.animation.radians;
});

const earthRotationSpeed = computed(() => {
  // NOTE: this is the REAL speed of earth, so 1 rotation takes 24 hours REAL TIME
  return rpmToUpdateSpeed(1 / 1440); //(formData.value.rpm / (this.animation.FPS * 60)) * this.animation.radians;
});

const stationWidth = computed(() => {
  return formData.value.radius * 2;
});

const availableTypes = computed(() => {
  return types.filter(
    (t) =>
      t.useInSpace == formData.value.isSpace ||
      t.useOnGround != formData.value.isSpace
  );
});

const pointGravity = computed(() => {
  return calcGravityFromRadius(formData.value.rulerPoint);
});

const pointCentripetalAcceleration = computed(() => {
  // this.tangentialVelocity * this.tangentialVelocity / formData.value.radius;
  return gTom2s(pointGravity.value);
});

const pointTangentialVelocity = computed(() => {
  return Math.sqrt(
    pointCentripetalAcceleration.value * formData.value.rulerPoint
  );
});

const centripetalAcceleration = computed(() => {
  // this.tangentialVelocity * this.tangentialVelocity / formData.value.radius;
  return gTom2s(formData.value.gravity);
});

const tangentialVelocity = computed(() => {
  // velocity = Math.sqrt (centripetalAcceleration * radius) ;
  // velocity = rpm * radius;
  return Math.sqrt(centripetalAcceleration.value * formData.value.radius);
});

// calculate the coriolis force applied to an object
const coriolisForce = (mass: number, velocity: number) => {
  // F = 2 * m * v * w

  return 2 * mass * velocity * (formData.value.rpm / 60);
};

const radsPerSec = computed(() => {
  return rpmToRadians(formData.value.rpm);
});

const angularComfort = computed(() => {
  if (formData.value.type.shape != "can") {
    // Angular comfort in a bola or cylinder relates to how different your head and feet experience motion.
    // If laying on your back, in a can, this effect is less noticable
    if (formData.value.rpm <= 2) return "alert-success";
    else if (formData.value.rpm <= 6) return "alert-warning";
    else return "alert-danger";
  }

  // ! TODO: These values are not currently based on anything! collect better data and update values!
  // ? NOTE: "Can" is only temporary gravity usage while lying on back. Can be treated kind of like lying on your back.
  if (formData.value.rpm <= 8) return "alert-success";
  else if (formData.value.rpm <= 12) return "alert-warning";
  else return "alert-danger";
});

const velocityComfort = computed(() => {
  // A low tangential velocity ratio can cause significant coriolis effects which distort apparent gravity
  if (pointTangentialVelocity.value <= 6) return "alert-danger";
  else if (pointTangentialVelocity.value <= 10) return "alert-warning";
  else return "alert-success";
});

const gravityComfort = computed(() => {
  // if (formData.value.type.shape != 'can' ){
  if (pointGravity.value < 0.1) return "alert-danger";
  else if (pointGravity.value < 0.3) return "alert-warning";
  else if (pointGravity.value < 1.1) return "alert-success";
  else if (pointGravity.value < 1.5) return "alert-warning";
  else return "alert-danger";
  // } else {
  //   if (formData.value.gravity < 0.1)
  //     return 'alert-danger';
  //   else if (formData.value.gravity < 0.3)
  //     return 'alert-warning';
  //   else if (formData.value.gravity < 1.5)
  //     return 'alert-success';
  //   else if (formData.value.gravity < 2)
  //     return 'alert-warning';
  //   else
  //     return 'alert-danger';
  // }
});

const worldGravity = computed(() => {
  return formData.value.isSpace ? 0 : formData.value.location.g;
});

/**
 *
 *
 * METHODS
 *
 *
 */

function toggleClass(on: boolean) {
  return on ? "fa-toggle-on" : "fa-toggle-off";
}

async function loadModels() {
  //const loader = new GLTFLoader();

  // TODO: DON'T USE SPACEMAN MODEL!? It is an awesome model, but pretty big. Just use a 6ft cylinder...or nothing
  //models.spaceman = await loader.loadAsync("/models/lowres_spacex_suit.glb");

  const textureLoader = new THREE.TextureLoader();
  //textures.space = await textureLoader.load('/textures/2k_stars.jpg');
  textures.earth = textureLoader.load("/textures/2k_earth_daymap.jpg");
  textures.mars = textureLoader.load("/textures/2k_mars.jpg");
  textures.moon = textureLoader.load("/textures/2k_moon.jpg");
  // textures.earthClouds = await textureLoader.load('/textures/2k_earth_clouds.jpg');
  // textures.earthNormal = await textureLoader.load('/textures/2k_earth_normal_map.jpg');

  loading.value = false;
  setupScene();
}

function displayPlanet() {
  planet.axis = new THREE.Vector3(0, 1, 0);
  planet.speed = 0.0001; // This is not a REAL speed. Sped up for appearance

  //if(formData.value.location.name === "Space")
  switch (formData.value.location.name) {
    case "Earth":
      planet.material = new THREE.MeshLambertMaterial({
        map: textures.earth,
      });
      break;
    case "Mars":
      planet.material = new THREE.MeshLambertMaterial({
        map: textures.mars,
      });
      break;
    case "Moon":
      planet.material = new THREE.MeshLambertMaterial({
        map: textures.moon,
      });
      break;
  }

  let planetPositionY = -(formData.value.radius / 4) - 2;
  if (formData.value.isSpace) {
    planet.geometry = new THREE.SphereGeometry(
      formData.value.location.geomtry.radius,
      64,
      64
    );
    planetPositionY =
      -formData.value.location.geomtry.radius -
      Math.max(stationWidth.value * 2, 1000);
  } else {
    planet.geometry = new THREE.CircleGeometry(stationWidth.value * 10, 32);
  }

  planet.material.transparent = true;

  planet.mesh = new THREE.Mesh(planet.geometry, planet.material);
  planet.mesh.position.set(0, planetPositionY, 0);

  // Apply a random rotation. TODO: Might make this a more random rotation to see different sides of the planet each reload
  planet.mesh.rotateZ(0);
  planet.mesh.rotateX(-Math.PI / 2);
  three.scene.add(planet.mesh);
  //}
}

function setupThreeJS() {
  three.scene = new THREE.Scene();
  three.group = new THREE.Group();

  // Renderer
  three.renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true,
  }); // { alpha: true }
  three.canvas = document.getElementById("rotational-canvas");

  if (!three.canvas) return;

  three.canvas.appendChild(three.renderer.domElement);

  const width = three.canvas.getBoundingClientRect().width;
  const height = 400;

  three.renderer.setSize(width, height);

  // Camera
  const cameraDistance = stationWidth.value * 1.8;
  three.camera = new THREE.PerspectiveCamera(
    45,
    width / height,
    0.1,
    planet.radius * 2
  );

  three.camera.position.z = cameraDistance;
  // three.controls.enableZoom = false;

  // Controls
  three.controls = new OrbitControls(three.camera, three.renderer.domElement);

  // Lights
  three.scene.add(new THREE.AmbientLight(0x404040));
  const light = new THREE.DirectionalLight(0xffffff, 0.5);
  three.scene.add(light);

  // Stats
  // three.stats = Stats()
  // three.stats.dom.style.position = 'absolute';
  // three.canvas.appendChild(three.stats.dom);

  // // GUI
  // three.gui = new dat.GUI( { autoPlace: false } );
  // three.canvas.appendChild(three.gui.domElement);

  three.scene.add(three.group);
}

function setupAxesHelper() {
  const axesHelper = new THREE.AxesHelper(formData.value.radius / 10); // 500 is size
  //axesHelper.position.set(three.spaceman.position.x, three.spaceman.position.y, three.spaceman.position.z,)
  //three.group.add(axesHelper);
  three.scene.add(axesHelper);
}

function calcForceVector() {
  // ? NOTE: We are currently ignoring mass
  //Fc = apparentWeight = mass * apparentGravity;
  //W = weight = mass * worldGravity.value;

  // our arc is -Math.PI/2 -> 0 (-90 -> 0 degrees) (-1.5 -> 0 rotations)
  // What percent of -1.5 (-Math.PI/2) is percentApparent

  // TODO: THIS IS NOT QUITE ACCURATE!!
  // ? NOTE: angleOfIncidence should be something like Math.cos() * (this.gTom2s(worldGravity) / this.gTom2s(intendedGravity))
  // rotate -45 degrees so our "balance" point is at -0.75 or -Math.PI/4

  const apparentGravity = formData.value.gravity;

  forces.vector = 0;
  if (apparentGravity == 0) {
    forces.vector = Math.PI / 4;
  } else if (worldGravity.value < apparentGravity) {
    let percentApparent =
      getPercentageChange(apparentGravity, worldGravity.value) / 100;
    forces.vector = -(Math.PI / 4) * Math.min(percentApparent, 1);
  } else if (worldGravity.value > apparentGravity) {
    let percentApparent =
      getPercentageChange(worldGravity.value, apparentGravity) / 100;
    forces.vector = (Math.PI / 4) * Math.min(percentApparent, 1);
  }

  forces.vector -= Math.PI / 4;
}

function setupForceVector() {
  const vectorGeometry = new THREE.CylinderGeometry(1, 0.1, 3, 3);
  const vectorColor = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  forces.vectorMesh = new THREE.Mesh(vectorGeometry, vectorColor);

  if (
    formData.value.type.shape === "funnel" ||
    formData.value.type.shape === "can"
  ) {
    calcForceVector();

    if (formData.value.type.shape === "funnel") {
      forces.vectorMesh.rotation.set(0, 0, forces.vector);
    } else {
      forces.vectorMesh.rotation.set(forces.vector + Math.PI / 2, 0, 0);
    }

    // forces.vectorMesh.position.set(
    //   three.spaceman.position.x - 1.5,
    //   three.spaceman.position.y - 1.5,
    //   three.spaceman.position.z
    // );
  } else {
    // forces.vectorMesh.position.set(
    //   three.spaceman.position.x,
    //   three.spaceman.position.y - 2,
    //   three.spaceman.position.z
    // );
  }

  three.group.add(forces.vectorMesh);

  // const rulerFolder = three.gui.addFolder('Ruler');
  // rulerFolder.add(forces.vectorMesh.rotation, 'x', -Math.PI, Math.PI );
  // rulerFolder.add(forces.vectorMesh.rotation, 'y', -Math.PI, Math.PI);
  // rulerFolder.add(forces.vectorMesh.rotation, 'z', -Math.PI, Math.PI);
  // rulerFolder.open();
}

function calcGravityFromRadius(radius: number) {
  return m2sTog(Math.pow(rpmToRadians(formData.value.rpm), 2) * radius);
}

function getPercentageChange(oldNumber: number, newNumber: number) {
  var decreaseValue = oldNumber - newNumber;

  return (decreaseValue / oldNumber) * 100;
}

function getRandomInt(max: number) {
  return Math.round(Math.random() * max);
}

function setupRuler() {
  if (!formData.value.showGravityRule) return;

  // Setup Ruler
  const lineRadius = formData.value.radius / 30;
  const linegeometry = new THREE.CylinderGeometry(
    lineRadius,
    0.1,
    formData.value.radius,
    2
  );
  ruler.lineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
  });

  ruler.lineCylinder = new THREE.Mesh(linegeometry, ruler.lineMaterial);

  //ruler.lineCylinder.position.z = 1;

  // Setup measurement point
  formData.value.rulerPoint = formData.value.radius;

  const geometry = new THREE.CylinderGeometry(lineRadius, 0.01, lineRadius, 2);
  ruler.dialMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
  });

  ruler.dial = new THREE.Mesh(geometry, ruler.dialMaterial);

  // if (!formData.value.showGravityRule) {
  //   ruler.lineMaterial.opacity = 0;
  //   ruler.dialMaterial.opacity = 0;
  // }

  // Adjust ruler for different structures
  if (
    formData.value.type.shape === "can" ||
    formData.value.type.shape === "funnel"
  ) {
    ruler.lineCylinder.rotation.z = Math.PI / 2;
    ruler.lineCylinder.position.x = -(formData.value.radius / 2);
    ruler.lineCylinder.position.y = 1;

    ruler.dial.rotation.z -= Math.PI / 2;
    ruler.dial.position.x = -formData.value.rulerPoint + lineRadius + 2;
    ruler.dial.position.y = 1.1;
  } else {
    ruler.lineCylinder.rotation.z = Math.PI;
    ruler.lineCylinder.rotation.y -= Math.PI / 2;
    ruler.lineCylinder.position.y = -(formData.value.radius / 2);
    ruler.lineCylinder.position.z = 0.5;

    ruler.dial.rotation.y = Math.PI / 2;
    ruler.dial.position.y = -formData.value.rulerPoint + 2;
    ruler.dial.position.z = 0.6;
  }

  three.scene.add(ruler.dial);
  three.scene.add(ruler.lineCylinder);
}

function buildCanStation(material: THREE.Material) {
  var extrudeSettings = {
    depth: types[1].defaults.length,
    steps: 1,
    bevelEnabled: false,
    curveSegments: 6,
  };

  var arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, formData.value.radius, 0, Math.PI * 2, false);

  if (formData.value.hollow) {
    var holePath = new THREE.Path();
    holePath.absarc(0, 0, formData.value.radius - 2, 0, Math.PI * 2, true);
    arcShape.holes.push(holePath);
  }

  var geometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);

  three.station = new THREE.Mesh(geometry, material);

  three.group.add(three.station);
  three.group.rotation.x = -Math.PI / 2;
}

function buildCylinderStation(material: THREE.Material) {
  var extrudeSettings = {
    depth: formData.value.shipLength,
    steps: 1,
    bevelEnabled: false,
    curveSegments: 24,
  };

  var arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, formData.value.radius, 0, Math.PI * 2, false);

  if (formData.value.hollow) {
    var holePath = new THREE.Path();
    holePath.absarc(
      0,
      0,
      formData.value.radius - formData.value.radius / 5,
      0,
      Math.PI * 2,
      true
    );
    arcShape.holes.push(holePath);
  }

  var geometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);

  three.station = new THREE.Mesh(geometry, material);

  three.group.add(three.station);
}

function buildBolaStation(material: THREE.Material) {
  const tetherLength = stationWidth.value - formData.value.shipLength * 2;
  const tetherGeometry = new THREE.CylinderGeometry(1, 1, tetherLength, 32);
  const tether = new THREE.Mesh(tetherGeometry, material);

  const shipGeometry = new THREE.CylinderGeometry(
    formData.value.shipWidth,
    formData.value.shipWidth,
    formData.value.shipLength,
    32
  );
  // var topShipmaterial = new THREE.MeshPhongMaterial( { color: 0xff0000, side: THREE.BackSide } );
  // var bottomShipmaterial = new THREE.MeshPhongMaterial( { color: 0xff00ff, side: THREE.BackSide } );
  var topShip = new THREE.Mesh(shipGeometry, material);
  var bottomShip = new THREE.Mesh(shipGeometry, material);

  topShip.position.set(
    0,
    formData.value.radius - formData.value.shipLength / 2,
    0
  );
  bottomShip.position.set(
    0,
    -(formData.value.radius - formData.value.shipLength / 2),
    0
  );

  three.group.add(topShip);
  three.group.add(bottomShip);
  three.group.add(tether);
}

function buildFunnelStation(material: THREE.Material) {
  // #NOTE: How to calculate funnel: https://www.linkedin.com/pulse/creating-artificial-gravity-mars-shen-ge-cssgb/

  let funnelGeometry = null;
  if (!formData.value.gravity) {
    const circleRadius = formData.value.radius + formData.value.shipLength / 2;
    funnelGeometry = new THREE.CircleGeometry(circleRadius, 32);
  } else {
    funnel.angleOfIncidence = parseFloat(forces.vector.toFixed(2)); //-this.radiansToDegrees(forces.vector).toFixed(2);
    funnel.oppositeAngle = parseFloat(
      (Math.PI / 2 - funnel.angleOfIncidence).toFixed(2)
    );
    funnel.netCentripetalForce = -(
      gTom2s(worldGravity.value) * Math.tan(forces.vector)
    ).toFixed(3);
    const hypotenuseSide = formData.value.shipLength;

    const bRads = Math.sin(funnel.oppositeAngle) / Math.sin(Math.PI / 2);
    const bDegs = radiansToDegrees(
      Math.sin(funnel.oppositeAngle) / Math.sin(90)
    );

    const cRads = Math.sin(funnel.angleOfIncidence) / Math.sin(Math.PI / 2);
    const cDegs = radiansToDegrees(
      Math.sin(funnel.angleOfIncidence) / Math.sin(90)
    );

    funnel.baseWidth = parseFloat(
      Math.abs(hypotenuseSide * Math.abs(bRads)).toFixed(2)
    );
    funnel.baseHeight = parseFloat(
      Math.abs(hypotenuseSide * Math.abs(cRads)).toFixed(2)
    );

    funnel.outerRadius = formData.value.radius + funnel.baseWidth / 2;
    funnel.innerRadius = formData.value.radius - funnel.baseWidth / 2;

    funnelGeometry = new THREE.CylinderGeometry(
      funnel.outerRadius,
      funnel.innerRadius,
      funnel.baseHeight,
      32
    );
  }

  three.station = new THREE.Mesh(funnelGeometry, material);

  three.group.add(three.station);
}

function setupStation() {
  var materialType = formData.value.seeInside
    ? THREE.BackSide
    : THREE.FrontSide; // DoubleSide
  var stationMaterial = new THREE.MeshPhongMaterial({
    color: 0xdddddd,
    side: materialType,
  });

  if (formData.value.showEnvironment) {
    displayPlanet();
  }

  // ? NOTE: Not currently used
  if (formData.value.showLocalAxis) {
    setupAxesHelper();
  }

  // Build station
  if (formData.value.type.shape === "can") {
    buildCanStation(stationMaterial);
  } else if (formData.value.type.shape === "cylinder") {
    buildCylinderStation(stationMaterial);
  } else if (formData.value.type.shape === "bola") {
    buildBolaStation(stationMaterial);
  }
  // else if (formData.value.type.shape === "funnel") {
  //   buildFunnelStation(stationMaterial);
  // }

  if (formData.value.showGravityRule) {
    setupRuler();
  }
}

function setupScene() {
  if (loading.value) return;

  needsUpdate.value = false;

  if (three.scene && three.canvas) {
    three.scene = new THREE.Scene();
    //three.scene.dispose();
    removeAllChildNodes(three.canvas);
    // NEW TODO: Might need to update defaultThree OR figure out how not to need this
    //three.value = defaultThree;
  }

  // stopTrace();

  // TODO: Ideally we wouldn't have to setup ThreeJS on each scene. Just update station + spaceman
  setupThreeJS();

  //setupSpaceman();
  setupRing();

  setupStation();

  if (!animation.prevTick) {
    animate();
  }
}

function setupRing() {
  // if (!formData.value.isSpace) {
  //   setupForceVector();
  // }

  let ringPosition = -formData.value.radius;

  // Build shape
  if (formData.value.type.shape === "can") {
    //ringPosition += 0.5;
  } else if (formData.value.type.shape === "cylinder") {
    if (formData.value.radius > 30) {
      const ringGeometry = new THREE.RingGeometry(
        3,
        formData.value.radius / 20,
        32
      );
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xba3700,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

      ringMesh.position.set(0, ringPosition + 2, formData.value.shipLength / 2);

      three.group.add(ringMesh);
    }
  } else if (formData.value.type.shape === "bola") {
    if (stationWidth.value > 30) {
      const ringGeometry = new THREE.RingGeometry(
        3,
        Math.max(formData.value.shipWidth - 2, 4),
        32
      );
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xba3700,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

      ringMesh.position.set(0, ringPosition + 2, 0);

      three.group.add(ringMesh);
    }
  } else if (formData.value.type.shape === "funnel") {
    // ringPosition += 1;
  }
}

// function setupSpaceman() {
//   if (!models.spaceman) return;

//   if (!formData.value.isSpace) {
//     setupForceVector();
//   }

//   let spacemanPosition = -formData.value.radius;

//   three.spaceman = models.spaceman.scene;
//   three.spaceman.scale.set(0.04, 0.04, 0.04); // scales to ~2 meters
//   three.spaceman.rotation.set(0, 0, 0);

//   // Build shape
//   if (formData.value.type.shape === "can") {
//     spacemanPosition += 0.5;
//     three.spaceman.rotation.x = Math.PI / 2;
//     three.spaceman.rotation.y = 1.8;
//     three.spaceman.position.set(1, spacemanPosition, 0); // 6, if solid shape set Z to height of the extrusion

//     if (forces.vectorMesh) {
//       forces.vectorMesh.position.set(
//         three.spaceman.position.x - 1.5,
//         three.spaceman.position.y - 1.5,
//         three.spaceman.position.z
//       );
//     }
//   } else if (formData.value.type.shape === "cylinder") {
//     three.spaceman.rotation.y = -Math.PI / 2;
//     three.spaceman.position.set(
//       0,
//       spacemanPosition,
//       formData.value.shipLength / 2
//     );

//     // If the radius of the structure is too big our spaceman becomes tiny! let's highlight him with a ring.
//     if (formData.value.radius > 30) {
//       const ringGeometry = new THREE.RingGeometry(
//         3,
//         formData.value.radius / 20,
//         32
//       );
//       const ringMaterial = new THREE.MeshBasicMaterial({
//         color: 0xba3700,
//         side: THREE.DoubleSide,
//       });
//       const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

//       ringMesh.position.set(
//         0,
//         spacemanPosition + 2,
//         formData.value.shipLength / 2
//       );

//       three.group.add(ringMesh);
//     }
//   } else if (formData.value.type.shape === "bola") {
//     three.spaceman.rotation.y = -Math.PI / 2;
//     three.spaceman.position.set(0, spacemanPosition, 0);

//     // If the radius of the structure is too big our spaceman becomes tiny! let's highlight him with a ring.
//     if (stationWidth.value > 30) {
//       const ringGeometry = new THREE.RingGeometry(
//         3,
//         Math.max(formData.value.shipWidth - 2, 4),
//         32
//       );
//       const ringMaterial = new THREE.MeshBasicMaterial({
//         color: 0xba3700,
//         side: THREE.DoubleSide,
//       });
//       const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

//       ringMesh.position.set(0, spacemanPosition + 2, 0);

//       three.group.add(ringMesh);
//     }
//   } else if (formData.value.type.shape === "funnel") {
//     spacemanPosition += 1;

//     three.spaceman.rotation.z = forces.vector; //Math.PI / 2;
//     //three.spaceman.rotation.y = 1.8;
//     three.spaceman.position.set(spacemanPosition, 0, 0); // 6, if solid shape set Z to height of the extrusion

//     //three.group.rotation.x = -Math.PI / 2.5;

//     // If the radius of the structure is too big our spaceman becomes tiny! let's highlight him with a ring.
//     if (formData.value.radius > 30) {
//       const ringGeometry = new THREE.RingGeometry(
//         formData.value.shipLength,
//         formData.value.shipLength * 1.3,
//         32
//       );
//       const ringMaterial = new THREE.MeshBasicMaterial({
//         color: 0xba3700,
//         side: THREE.DoubleSide,
//       });
//       const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

//       ringMesh.rotation.z = forces.vector;

//       ringMesh.position.set(spacemanPosition + 2, 0, 0);

//       three.group.add(ringMesh);
//     }

//     if (forces.vectorMesh) {
//       forces.vectorMesh.position.set(three.spaceman.position.x, -2, 0);
//     }
//   }
//   // // Gui folder
//   // const spacemanFolder = three.gui.addFolder('Spaceman');
//   // spacemanFolder.add(three.spaceman.position, 'x', 0, stationWidth.value).name("px");
//   // spacemanFolder.add(three.spaceman.position, 'y', -stationWidth.value * 2, stationWidth.value * 2).name("py");
//   // spacemanFolder.add(three.spaceman.position, 'z', 0, stationWidth.value).name("pz");

//   // spacemanFolder.add(three.spaceman.rotation, 'x', -Math.PI / 2, 0).name("rx");
//   // spacemanFolder.add(three.spaceman.rotation, 'y', -Math.PI / 2, 0).name("ry");
//   // spacemanFolder.add(three.spaceman.rotation, 'z', -Math.PI / 2, 0).name("rz");
//   // spacemanFolder.open();

//   three.group.add(three.spaceman);

// }

function animate() {
  if (!three.renderer) return;

  requestAnimationFrame(animate);

  //three.controls.update();

  var cameraZoomDistance = planet.radius; //stationWidth.value * 10;
  var minMovement = new THREE.Vector3(
    -cameraZoomDistance,
    -cameraZoomDistance,
    -cameraZoomDistance
  );
  var maxMovement = new THREE.Vector3(
    cameraZoomDistance,
    cameraZoomDistance,
    cameraZoomDistance
  );
  three.camera.position.clamp(minMovement, maxMovement);

  three.renderer.render(three.scene, three.camera);

  if (formData.value.pause) return;

  // clamp to fixed framerate
  const now = Math.round((animation.FPS * window.performance.now()) / 1000);
  if (now == animation.prevTick) return;
  animation.prevTick = now;

  // three.group.rotation.z += this.rotationSpeed;
  if (formData.value.type.shape !== "funnel") {
    three.group.rotation.z += rotationSpeed.value;
  } else {
    three.group.rotation.y += rotationSpeed.value;
  }

  if (coriolis.tracing && coriolis.ball) {
    if (formData.value.type.shape !== "funnel") {
      coriolis.ball.position.y += velocityToUpdateSpeed(coriolis.velocity);
    } else {
      coriolis.ball.position.x += velocityToUpdateSpeed(coriolis.velocity);
      if (coriolis.applyGravity) {
        coriolis.ball.position.y -= velocityToUpdateSpeed(
          gTom2s(worldGravity.value)
        );
      }
    }
  }

  if (formData.value.showEnvironment && formData.value.isSpace) {
    planet.mesh.rotateOnAxis(planet.axis, -planet.speed);
    // planet.clouds.rotateOnAxis(planet.axis, planet.speed );
  }

  // three.stats.update();
}

function removeAllChildNodes(parent: HTMLElement) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function rpmToUpdateSpeed(rpm: number) {
  return (rpm / (animation.FPS * 60)) * animation.radians;
}
function velocityToUpdateSpeed(velocity: number) {
  return velocity / animation.FPS;
}

/**
 *
 * Form Actions
 *
 */
function updateType() {
  const newType = types.find(
    (type) => type.shape === formData.value.type.shape
  );

  console.log("newType", newType);

  if (!newType) return;

  formData.value.radius = newType.defaults.radius;
  formData.value.rpm = newType.defaults.rpm;
  formData.value.shipLength = newType.defaults.length;

  updateRadius();
}

function updateShipLength() {
  formData.value.shipLength = Math.min(
    Math.max(formData.value.shipLength, conversion.minLength),
    conversion.maxLength
  );

  // Ship length doesn't affect anything else so we can run it without "needs update"
  setupScene();
}

function updateRadius() {
  formData.value.radius = Math.min(
    Math.max(formData.value.radius, conversion.minLength),
    conversion.maxLength
  );

  needsUpdate.value = true;

  formData.value.gravity = +calcGravityFromRadius(
    formData.value.radius
  ).toFixed(2);

  formData.value.rulerPoint = formData.value.radius;
  updateMeasurementPoint();

  setupScene();
}

function updateRPM() {
  formData.value.rpm = clampNumber(formData.value.rpm, 0, 1000);

  formData.value.gravity = +calcGravityFromRadius(
    formData.value.radius
  ).toFixed(2);
}

function updateGravity() {
  formData.value.rpm = +radiansPerSecToRpm(
    Math.sqrt(gTom2s(formData.value.gravity) / formData.value.radius)
  ).toFixed(4);

  if (forces.vectorMesh) {
    calcForceVector();

    if (formData.value.type.shape === "funnel") {
      forces.vectorMesh.rotation.set(0, 0, forces.vector);
    } else {
      forces.vectorMesh.rotation.set(forces.vector + Math.PI / 2, 0, 0);
    }
  }
}

function updateMeasurementPoint() {
  if (formData.value.rulerPoint < 0) formData.value.rulerPoint = 0;
  if (formData.value.rulerPoint > formData.value.radius)
    formData.value.rulerPoint = formData.value.radius;

  const lineRadius = formData.value.radius / 30;

  if (
    formData.value.type.shape === "can" ||
    formData.value.type.shape === "funnel"
  ) {
    ruler.dial.position.x = -formData.value.rulerPoint + lineRadius / 2;
    ruler.dial.position.x = -formData.value.rulerPoint + lineRadius / 2;
  } else {
    ruler.dial.position.y = -formData.value.rulerPoint + lineRadius / 2;
  }
}

// "formData.isSpace": {
//       handler(isSpace) {
//         if (isSpace) {
//           formData.value.type = this.types[0];
//         } else {
//           formData.value.type = this.types[3];
//         }
//       },
//     },

/**
 *
 *
 * Toss Ball Simulation
 * Depricated: I don't believe this was accurately simulating the coriolis force. Left in because it is neat
 *
 */

//  function launchBall() {
//   if (!three.spaceman) return;

//   coriolis.startingVelocity = coriolis.velocity;

//   stopTrace();

//   const color = new THREE.Color(
//     Math.max(Math.random(), 0.5),
//     Math.max(Math.random(), 0.5),
//     Math.max(Math.random(), 0.5)
//   );

//   coriolis.geometry = new THREE.SphereGeometry(
//     Math.max(formData.value.radius / 100, 0.5),
//     4,
//     4
//   );
//   coriolis.material = new THREE.MeshBasicMaterial({ color: color });

//   coriolis.ball = new THREE.Mesh(coriolis.geometry, coriolis.material);

//   // var target = new THREE.Vector3();
//   // three.spaceman.getWorldPosition( target );
//   const ballHeight = formData.value.type.shape === "can" ? 3 : 0;
//   coriolis.ball.position.set(
//     three.spaceman.position.x,
//     three.spaceman.position.y,
//     three.spaceman.position.z + ballHeight
//   );
//   three.group.add(coriolis.ball);

//   //coriolis.ballGroup = [];//new THREE.Group();

//   coriolis.tracing = true;
//   coriolis.tickTime = formData.value.type.shape === "can" ? 100 : 500;
//   // Updating in the animate loop would be more accurate, but this is simple and accomplishes the same goal
//   coriolis.interval = setInterval(traceBall, coriolis.tickTime);
// }

// function traceBall() {
//   // TODO: Could use InstanceMesh to get better performance? https://threejs.org/docs/#api/en/objects/InstancedMesh

//   // Updating in the animate loop would be more accurate, but this is simple and accomplishes the same goal
//   if (coriolis.applyGravity) {
//     // TODO: Can we update this using our force vector? Perhaps rotate the ball in it's own local reference frame?
//     // TODO: This doesn't seem right. Test out gravity stuff
//     // if( formData.value.type.shape === 'funnel' ){
//     //   coriolis.velocity -= funnel.netCentripetalForce * ( coriolis.tickTime / 1000 );
//     // }else{
//     coriolis.velocity -=
//       centripetalAcceleration.value * (coriolis.tickTime / 1000);
//     //}
//   }

//   var target = new THREE.Vector3();
//   coriolis.ball.getWorldPosition(target);

//   if (
//     coriolis.ballGroup.length > 80 ||
//     Math.abs(target.y) > formData.value.radius ||
//     Math.abs(target.x) > formData.value.radius ||
//     Math.abs(target.z) > formData.value.radius
//   ) {
//     stopTrace();
//     return;
//   }
//   const ball = new THREE.Mesh(coriolis.geometry, coriolis.material);
//   ball.position.set(target.x, target.y, target.z);
//   coriolis.ballGroup.push(ball);

//   three.scene.add(ball);
// }

// function clearBalls() {
//   if (coriolis.ballGroup.length) {
//     for (let b = 0; b < coriolis.ballGroup.length; b++) {
//       three.scene.remove(coriolis.ballGroup[b]);
//     }

//     coriolis.ballGroup = [];
//   }
// }

// function stopTrace() {
//   if (coriolis.interval) {
//     clearInterval(coriolis.interval);
//   }
//   // TODO: Try to allow users to see the balls between scenes
//   // HOLD: Try and clear station and spaceman on change. not entire scene.

//   if (coriolis.ball) {
//     three.group.remove(coriolis.ball);
//   }

//   coriolis.tracing = false;
//   coriolis.velocity = coriolis.startingVelocity;
// }
</script>

<style></style>
