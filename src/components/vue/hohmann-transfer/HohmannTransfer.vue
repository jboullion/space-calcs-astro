<template>
  <div id="hohmann-transfer__app" class="row">
    <div id="hohmann__form" class="col-lg-4">
      <div class="calc-form mb-5 p-2 rounded border">
        <SelectInput
          id="start-orbit"
          label="Starting Orbit"
          v-model="formData.startOrbit"
          :options="availableStartOrbits"
          @update:modelValue="updateOrbits"
        />

        <SelectInput
          id="end-orbit"
          label="Ending Orbit"
          v-model="formData.endOrbit"
          :options="availableEndOrbits"
          @update:modelValue="updateOrbits"
        />

        <table class="table">
          <tbody>
            <tr
              :style="{
                backgroundColor: getOrbitColorHex(formData.startOrbit),
              }"
            >
              <th class="text-light">
                {{ formData.startOrbit.name }} Ending Degree
              </th>
              <td class="text-end text-light">
                {{ addCommas(calcs.originEndingDegree) }}&deg;
              </td>
            </tr>
            <tr
              :style="{
                backgroundColor: getOrbitColorHex(formData.startOrbit),
              }"
            >
              <th class="text-light">Delta V1</th>
              <td class="text-light text-end">
                {{ addCommas(firstDeltaV) }} m/s
              </td>
            </tr>
            <tr
              :style="{
                backgroundColor: getOrbitColorHex(formData.startOrbit),
              }"
            >
              <th class="text-light">
                {{ formData.startOrbit.name }} Orbit Velocity
              </th>
              <td class="text-light text-end">
                {{ addCommas(startingOrbitVelocity) }} km/s
              </td>
            </tr>
            <tr
              :style="{
                backgroundColor: getOrbitColorHex(formData.endOrbit),
              }"
            >
              <th class="text-light">
                {{ formData.endOrbit.name }} Starting Degree
              </th>
              <td class="text-light text-end">
                {{ calcs.destinationStartingDegree }}&deg;
              </td>
            </tr>

            <tr
              :style="{
                backgroundColor: getOrbitColorHex(formData.endOrbit),
              }"
            >
              <th class="text-light">Delta V2</th>
              <td class="text-light text-end">
                {{ addCommas(secondDeltaV) }} m/s
              </td>
            </tr>
            <tr
              :style="{
                backgroundColor: getOrbitColorHex(formData.endOrbit),
              }"
            >
              <th class="text-light">
                {{ formData.endOrbit.name }} Orbit Velocity
              </th>
              <td class="text-light text-end">
                {{ addCommas(endingOrbitVelocity) }} km/s
              </td>
            </tr>
            <tr class="bg-orange">
              <th class="text-light">Semi Major Axis</th>
              <td class="text-light text-end">
                {{ addCommas(semiMajorAxis) }} km
              </td>
            </tr>
            <tr class="bg-orange">
              <th class="text-light">Hohmann Orbit Velocity</th>
              <td class="text-light text-end">
                {{ addCommas(hohmannOrbitVelocity) }} km/s
              </td>
            </tr>

            <tr class="bg-dark">
              <th class="text-light">Total Delta V</th>
              <td class="text-light text-end">
                {{ addCommas(firstDeltaV + secondDeltaV) }} m/s
              </td>
            </tr>
            <tr class="bg-dark">
              <th class="text-light">Travel Time</th>
              <td class="text-light text-end">
                {{ addCommas(timeOfFlightDays) }} days
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div id="hohmann__results" class="col-lg-8 calc-form">
      <div class="d-flex justify-content-between mb-3">
        <button class="btn btn-primary btn-lg px-5" @click="play">
          <i class="fas" :class="playClass"></i>
        </button>
        <h3 class="mb-0">Day {{ currentDay }}</h3>
      </div>

      <div
        id="hohmann-canvas"
        class="mb-3"
        style="position: relative; height: 600px; width: 100%"
      >
        <i v-if="loading" class="fas fa-cog fa-spin center-absolute h1"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!
// 9. Window resize

// ! BUGS

// ? NOTE: Optional Improvements!
// 1. Do we want to have Earth based orbits as well? LEO to GEO for instance? Or LEO to the Moon?
// 2. How do we calculate the eliptical hohman orbits shape / size? https://en.wikipedia.org/wiki/Bi-elliptic_transfer
// 3. Add a bloom pass to the sun? https://stackoverflow.com/a/66171363
// 4. When the ship gets to the outer orbit should we move this.ship to endingorbitgroup and then rotate in that group?
// 5. Setup click events so users can click on something to get info
// 6. Show the vectors used in each burn

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { addCommas } from "../utils";

import {
  locations,
  physicsConstants,
  scaleConversions,
  animationConstants,
} from "./constants";
import type { Location } from "./constants";

import SelectInput from "../forms/SelectInput.vue";

const loading = ref(true);
const textureDir = "/textures/";

interface PlanetTextures {
  sun: THREE.Texture | null;
  mercury: THREE.Texture | null;
  venus: THREE.Texture | null;
  earth: THREE.Texture | null;
  mars: THREE.Texture | null;
  jupiter: THREE.Texture | null;
  saturn: THREE.Texture | null;
  uranus: THREE.Texture | null;
  neptune: THREE.Texture | null;
}

const planetTextures: PlanetTextures = {
  sun: null,
  mercury: null,
  venus: null,
  earth: null,
  mars: null,
  jupiter: null,
  saturn: null,
  uranus: null,
  neptune: null,
};

let threeCanvas: HTMLElement | HTMLCanvasElement | null = null;
let threeRenderer: THREE.WebGLRenderer | null = null;
let threeScene: THREE.Scene | null = null;
let threeCamera: THREE.PerspectiveCamera | null = null;
let threeControls: OrbitControls | null = null;
// let threeGroup: THREE.Group | null = null;
// let threeStats: null = null; // used for debugging
// let threeGui: null = null; // used for debugging
// let threeRaycaster: null = null;
// let threeMouse: null = null;
// let threeMinMovement: number | null = null;
// let threeMaxMovement: number | null = null;

// const help = ref({
//   tooltipModal: null,
//   tooltipTitle: null,
//   tooltipDescription: "",
// });

const formData = ref({
  startOrbit: locations[2],
  endOrbit: locations[3],
});

const calcs = ref({
  destinationStartingDegree: 0,
  destinationRads: 0,
  originEndingDegree: 0,
  originEndingRads: 0,
});

let startingOrbitGroup = new THREE.Group();
let endingOrbitGroup = new THREE.Group();
let hohmannOrbitGroup = new THREE.Group();

const hohmannCenter = ref(0);

/**
 *
 *
 * COMPUTED
 *
 *
 */
const availableStartOrbits = computed<Location[]>(() => {
  let locs = locations.filter(
    (location) => location.distance != formData.value.endOrbit.distance
  );

  return locs;
});

const availableEndOrbits = computed<Location[]>(() => {
  let locs = locations.filter(
    (location) => location.distance != formData.value.startOrbit.distance
  );

  return locs;
});

const semiMajorAxis = computed(() => {
  return (
    (formData.value.startOrbit.distance + formData.value.endOrbit.distance) / 2
  );
});

const transferPeriod = computed(() => {
  return Math.sqrt(
    (4 * Math.pow(Math.PI, 2) * Math.pow(semiMajorAxis.value, 3)) /
      physicsConstants.GM
  );
});

const startingOrbitVelocity = computed(() => {
  return (
    (2 * Math.PI * formData.value.startOrbit.distance) /
    (formData.value.startOrbit.orbitalPeriod * scaleConversions.secondsToDays)
  );
});

const endingOrbitVelocity = computed(() => {
  return (
    (2 * Math.PI * formData.value.endOrbit.distance) /
    (formData.value.endOrbit.orbitalPeriod * scaleConversions.secondsToDays)
  );
});

const perihelionVelocity = computed(() => {
  return (
    ((2 * Math.PI * semiMajorAxis.value) / transferPeriod.value) *
    Math.sqrt(
      (2 * semiMajorAxis.value) / formData.value.startOrbit.distance - 1
    )
  );
});

const aphelionVelocity = computed(() => {
  return (
    ((2 * Math.PI * semiMajorAxis.value) / transferPeriod.value) *
    Math.sqrt((2 * semiMajorAxis.value) / formData.value.endOrbit.distance - 1)
  );
});

const firstDeltaV = computed(() => {
  return (
    Math.abs(perihelionVelocity.value - startingOrbitVelocity.value) * 1000
  );
});

const secondDeltaV = computed(() => {
  return Math.abs(endingOrbitVelocity.value - aphelionVelocity.value) * 1000;
});

const timeOfFlightSeconds = computed(() => {
  return transferPeriod.value * 0.5;
});

const timeOfFlightDays = computed(() => {
  return timeOfFlightSeconds.value / scaleConversions.secondsToDays;
});

const hohmannOrbitVelocity = computed(() => {
  return (2 * Math.PI * semiMajorAxis.value) / transferPeriod.value;
});

const startingOrbitAnimationSpeed = computed(() => {
  return radsToAnimationSpeed(calcs.value.originEndingRads);
});

const endingOrbitAnimationSpeed = computed(() => {
  return radsToAnimationSpeed(calcs.value.destinationRads);
});

const hohmannAnimationSpeed = computed(() => {
  return radsToAnimationSpeed(Math.PI);
});

const currentDay = computed(() => {
  return animationConstants.value.currentFrame === 1
    ? 1
    : (
        (animationConstants.value.currentFrame /
          totalFramesInHohmannOrbit.value) *
        timeOfFlightDays.value
      ).toLocaleString(undefined, { maximumFractionDigits: 0 });
});

const totalFramesInHohmannOrbit = computed(() => {
  return animationConstants.value.duration * animationConstants.value.FPS;
});

const playClass = computed(() => {
  if (!animationConstants.value.complete) {
    if (!animationConstants.value.play) {
      return "fa-play";
    } else {
      return "fa-pause";
    }
  } else {
    return "fa-undo";
  }
});

const farthestOrbitScaled = computed(() => {
  return (
    Math.max(
      formData.value.startOrbit.distance,
      formData.value.endOrbit.distance
    ) / scaleConversions.scaleFactor
  );
});

/**
 *
 *
 * SETUP
 *
 *
 */
onMounted(() => {
  loadModels();

  formData.value.startOrbit = locations[2];
  formData.value.endOrbit = locations[3];

  window.addEventListener("resize", setupScene, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", setupScene);
});

function removeAllChildNodes(parent: HTMLElement) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

/**
 *
 *
 * METHODS
 *
 *
 */

function getOrbitColorHex(location: Location) {
  if (!location.orbitColor) return "#ffffff";

  let hex = location.orbitColor.toString(16).replace(/^0x/, "");
  if (hex.length < 6) {
    hex = "0" + hex;
  }

  // orbitColor is setup for Three.js to use 0x######, so we need to convert it to a hex (16) string
  return "#" + hex;
}

async function loadModels() {
  const textureLoader = new THREE.TextureLoader();
  // TODO: Do we want to load these dynamically instead of on load?
  planetTextures.sun = await textureLoader.load(textureDir + "2k_sun.jpg");

  planetTextures.mercury = await textureLoader.load(
    textureDir + "2k_mercury.jpg"
  );
  planetTextures.venus = await textureLoader.load(
    textureDir + "2k_venus_atmosphere.jpg"
  );
  planetTextures.earth = await textureLoader.load(
    textureDir + "4k_earth_day.jpg"
  );
  planetTextures.mars = await textureLoader.load(textureDir + "2k_mars.jpg");
  planetTextures.jupiter = await textureLoader.load(
    textureDir + "2k_jupiter.jpg"
  );
  planetTextures.saturn = await textureLoader.load(
    textureDir + "2k_saturn.jpg"
  );
  planetTextures.uranus = await textureLoader.load(
    textureDir + "2k_uranus.jpg"
  );
  planetTextures.neptune = await textureLoader.load(
    textureDir + "2k_neptune.jpg"
  );

  loading.value = false;
  setupScene();
}

function setupScene() {
  if (loading.value) return;

  if (threeCanvas) {
    removeAllChildNodes(threeCanvas);
  }

  setupThreeJS();

  setupSun();
  updateOrbits();

  if (!animationConstants.value.prevTick) {
    animate();
  }
}

function setupThreeJS() {
  threeScene = new THREE.Scene();

  // Renderer
  threeRenderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true,
  }); // { alpha: true }
  threeCanvas = document.getElementById("hohmann-canvas");
  if (!threeCanvas) return;

  threeCanvas.appendChild(threeRenderer.domElement);

  const width = threeCanvas.getBoundingClientRect().width;
  const height = 500;

  threeRenderer.setSize(width, height);

  updateCamera();

  // Lights
  threeScene.add(new THREE.AmbientLight(0xffffff));
  const light = new THREE.PointLight(0xffffff, 1, 0, 1);
  threeScene.add(light);
}

function updateCamera() {
  if (!threeRenderer) return;

  // Camera
  const cameraPositionDistance = farthestOrbitScaled.value * 3;
  const cameraZoomDistance = farthestOrbitScaled.value * 3 * 20;

  let rendererSize = new THREE.Vector2();
  threeRenderer.getSize(rendererSize);

  threeCamera = new THREE.PerspectiveCamera(
    45,
    rendererSize.width / rendererSize.height,
    0.1,
    cameraZoomDistance
  );

  threeCamera.position.z = cameraPositionDistance;

  // Controls
  threeControls = new OrbitControls(threeCamera, threeRenderer.domElement);

  if (!threeControls) return;

  threeControls.minDistance = farthestOrbitScaled.value;
  threeControls.maxDistance = cameraZoomDistance;
}

function setupSun() {
  if (!threeScene) return;

  const material = new THREE.MeshLambertMaterial({
    map: planetTextures.sun,
    side: THREE.FrontSide,
  });
  material.emissive = new THREE.Color(0xffff00);
  material.emissiveIntensity = 0.3;

  const geometry = new THREE.SphereGeometry(200, 64, 64);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.set(Math.PI / 2, 0, 0);

  threeScene.add(mesh);
}

function updateOrbits() {
  if (!threeScene) return;

  threeScene.remove(startingOrbitGroup);
  threeScene.remove(endingOrbitGroup);
  threeScene.remove(hohmannOrbitGroup);
  startingOrbitGroup = new THREE.Group();
  endingOrbitGroup = new THREE.Group();
  hohmannOrbitGroup = new THREE.Group();

  setupOrbits(formData.value.startOrbit, false);
  setupOrbits(formData.value.endOrbit, true);
  setupHohmannOrbit();
  setupShip();

  threeScene.add(startingOrbitGroup);
  threeScene.add(endingOrbitGroup);
  threeScene.add(hohmannOrbitGroup);

  updateCamera();

  animationConstants.value.play = false;
  animationConstants.value.complete = false;
  animationConstants.value.currentFrame = 1;
}

function setupOrbits(orbit: Location, endOrbit: boolean) {
  if (!threeScene) return;

  const orbitSize = orbit.distance / scaleConversions.scaleFactor;
  const lineSize = farthestOrbitScaled.value / 100;
  const planetMaterial = getMaterial(orbit.name);

  const planetGeometry = new THREE.SphereGeometry(lineSize * 2, 32, 32);
  const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
  // Rotate the planet to the (more or less) correct orientation compared to the plane of the system
  planetMesh.rotation.set(Math.PI / 2, 0, 0);

  const orbitGeometry = new THREE.RingGeometry(
    orbitSize - lineSize,
    orbitSize + lineSize,
    128
  );
  const orbitMaterial = new THREE.MeshBasicMaterial({
    color: orbit.orbitColor,
    side: THREE.DoubleSide,
  });
  const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);

  // this.drawDeltaV(orbit, endOrbit);

  if (endOrbit && endingOrbitGroup) {
    planetMesh.position.set(orbitSize, 0, 0);

    // This planet will be at 180º when the ship reaches it.
    planetMesh.rotation.set(Math.PI / 2, 0, 0);

    // How far does this body move in its orbit during the transit?
    const radiansPerDay = (Math.PI * 2) / orbit.orbitalPeriod;

    calcs.value.destinationRads = radiansPerDay * timeOfFlightDays.value;
    const startingRadiansAtLaunch = Math.PI - calcs.value.destinationRads;
    calcs.value.destinationStartingDegree = radiansToDegrees(
      startingRadiansAtLaunch
    );

    // Set the starting location of the planet in it's orbit
    rotateAboutPoint(
      planetMesh,
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 1),
      startingRadiansAtLaunch, // + calcs.value.destinationRads // this will set the planet to the ending position in orbit
      false
    );

    endingOrbitGroup.add(planetMesh);
    endingOrbitGroup.add(orbitMesh);
    //threeScene.add(endingOrbitGroup);
  } else if (startingOrbitGroup) {
    planetMesh.position.set(orbitSize, 0, 0);

    // How far does this body move in its orbit during the transit?
    const radiansPerDay = (Math.PI * 2) / orbit.orbitalPeriod;
    calcs.value.originEndingRads = radiansPerDay * timeOfFlightDays.value;
    calcs.value.originEndingDegree = radiansToDegrees(
      calcs.value.originEndingRads
    );

    startingOrbitGroup.add(planetMesh);
    startingOrbitGroup.add(orbitMesh);
    //threeScene.add(startingOrbitGroup);

    // ? This will move the planet to the correct "end" position in the orbit. Can be used for testing endingRads calcualtions
    // this.rotateAboutPoint(
    //   planetMesh,
    //   new THREE.Vector3(0, 0, 0),
    //   new THREE.Vector3(0, 0, 1),
    //   calcs.value.originEndingRads,
    //   false
    // );
  }
}

function setupHohmannOrbit() {
  if (!threeScene) return;
  if (!hohmannOrbitGroup) return;

  // setup orbit
  const sMajorAxis = semiMajorAxis.value / scaleConversions.scaleFactor;
  const lineSize = farthestOrbitScaled.value / 100;

  const axisMaterial = new THREE.MeshBasicMaterial({
    color: 0xfd7e14,
    side: THREE.FrontSide,
  });
  const axisGeometry = new THREE.SphereGeometry(lineSize * 2, 12, 12);
  const axisMesh = new THREE.Mesh(axisGeometry, axisMaterial);

  const hohmannGeometry = new THREE.RingGeometry(
    sMajorAxis - lineSize,
    sMajorAxis + lineSize,
    128
  );
  const hohmannMaterial = new THREE.MeshBasicMaterial({
    color: 0xfd7e14,
    side: THREE.DoubleSide,
  });
  const hohmannMesh = new THREE.Mesh(hohmannGeometry, hohmannMaterial);

  let innerOrbitScaled = 0;

  if (formData.value.startOrbit.distance > formData.value.endOrbit.distance) {
    innerOrbitScaled =
      formData.value.endOrbit.distance / scaleConversions.scaleFactor;
    hohmannCenter.value = sMajorAxis - innerOrbitScaled;
  } else {
    innerOrbitScaled =
      formData.value.startOrbit.distance / scaleConversions.scaleFactor;
    hohmannCenter.value = -sMajorAxis + innerOrbitScaled;
  }

  axisMesh.position.set(hohmannCenter.value, 0, 0);
  hohmannMesh.position.set(hohmannCenter.value, 0, -1);

  hohmannOrbitGroup.add(axisMesh);
  hohmannOrbitGroup.add(hohmannMesh);

  //threeScene.add(hohmannOrbitGroup);
}

function setupShip() {
  if (!hohmannOrbitGroup) return;

  const orbitSize =
    formData.value.startOrbit.distance / scaleConversions.scaleFactor;
  const lineSize = farthestOrbitScaled.value / 100;

  const material = new THREE.MeshBasicMaterial({
    color: 0xea6730,
    side: THREE.FrontSide,
  });
  const geometry = new THREE.SphereGeometry(
    farthestOrbitScaled.value / 50,
    12,
    12
  );
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(orbitSize, 0, 0); // 80 * formData.value.startOrbit.planetSize // ? NOTE: Do we want to put the ship above the starting planet?

  hohmannOrbitGroup.add(mesh);
}

function drawDeltaV(orbit: Location, endOrbit: Location) {
  if (!threeScene) return;

  const orbitSize = orbit.distance / scaleConversions.scaleFactor;
  const deltaVgeometry = new THREE.ConeGeometry(50, 150, 32);
  const deltaVmaterial = new THREE.MeshBasicMaterial({
    color: orbit.orbitColor,
  });
  const deltaVcone = new THREE.Mesh(deltaVgeometry, deltaVmaterial);

  if (endOrbit) {
    deltaVcone.position.set(-orbitSize - 50 * orbit.planetSize - 75, 0, 0);
    deltaVcone.rotation.set(Math.PI, 0, 0);
  } else {
    deltaVcone.position.set(orbitSize + 50 * orbit.planetSize + 75, 0, 0);
  }

  threeScene.add(deltaVcone);
}

function play() {
  if (animationConstants.value.complete) {
    reset();
    return;
  }

  animationConstants.value.play = !animationConstants.value.play;
}

function reset() {
  updateOrbits();
}

function animate() {
  if (!threeScene) return;
  if (!threeCamera) return;
  if (!threeRenderer) return;
  if (!threeControls) return;
  if (!startingOrbitGroup) return;
  if (!endingOrbitGroup) return;

  requestAnimationFrame(animate);

  threeControls.update();

  //threeCamera.position.clamp(three.value.minMovement, three.value.maxMovement);
  threeRenderer.render(threeScene, threeCamera);

  if (animationConstants.value.complete || !animationConstants.value.play)
    return;

  // clamp to fixed framerate
  const now = Math.round(
    (animationConstants.value.FPS * window.performance.now()) / 1000
  );
  if (now == animationConstants.value.prevTick) return;
  animationConstants.value.prevTick = now;

  // Move the planets about their orbits
  startingOrbitGroup.rotateOnAxis(
    animationConstants.value.orbitRotationVector,
    startingOrbitAnimationSpeed.value
  );
  endingOrbitGroup.rotateOnAxis(
    animationConstants.value.orbitRotationVector,
    endingOrbitAnimationSpeed.value
  );

  // Move our ship along the hohmann orbit
  rotateAboutPoint(
    hohmannOrbitGroup,
    new THREE.Vector3(hohmannCenter.value, 0, 0),
    new THREE.Vector3(0, 0, 1),
    hohmannAnimationSpeed.value,
    false
  );

  // three.value.stats.update();

  // Are we at the end of our orbit?
  animationConstants.value.currentFrame++;

  if (
    animationConstants.value.currentFrame >= totalFramesInHohmannOrbit.value
  ) {
    animationConstants.value.play = false;
    animationConstants.value.complete = true;
  }
}

function rotateAboutPoint(
  obj: THREE.Group | THREE.Mesh | any,
  point: THREE.Vector3,
  axis: THREE.Vector3,
  theta: number,
  pointIsWorld: boolean
) {
  pointIsWorld = pointIsWorld === undefined ? false : pointIsWorld;

  if (obj.parent && pointIsWorld) {
    obj.parent.localToWorld(obj.position); // compensate for world coordinate
  }

  obj.position.sub(point); // remove the offset
  obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
  obj.position.add(point); // re-add the offset

  if (obj.parent && pointIsWorld) {
    obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
  }

  obj.rotateOnAxis(axis, theta); // rotate the OBJECT
}

function radiansToDegrees(radians: number) {
  return Math.floor(radians * (180 / Math.PI));
}

// velocityToAnimationSpeed(velocity) {
//   // convert days -> seconds -> frames -> simulation speed
//   return velocity / scaleConversions.secondsToDays / animationConstants.value.FPS * animationConstants.value.simulationSpeed;
// },

function radsToAnimationSpeed(rads: number) {
  const radsPerSecond = rads / animationConstants.value.duration;
  const radsPerFrame = radsPerSecond / animationConstants.value.FPS;
  return radsPerFrame;
}

function getMaterial(name: string) {
  switch (name) {
    case "Mercury":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.mercury,
        side: THREE.FrontSide,
      });
    case "Venus":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.venus,
        side: THREE.FrontSide,
      });
    case "Earth":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.earth,
        side: THREE.FrontSide,
      });
    case "Mars":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.mars,
        side: THREE.FrontSide,
      });
    case "Jupiter":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.jupiter,
        side: THREE.FrontSide,
      });
    case "Saturn":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.saturn,
        side: THREE.FrontSide,
      });
    case "Uranus":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.uranus,
        side: THREE.FrontSide,
      });
    case "Neptune":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.neptune,
        side: THREE.FrontSide,
      });
  }
}
</script>
<style></style>
