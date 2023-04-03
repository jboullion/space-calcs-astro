<template>
  <div id="hohmann-transfer__app" class="row">
    <div id="hohmann__form" class="col-lg-4">
      <div class="calc-form mb-5">
        <!-- <?php 
      selectInput(
        'startOrbit', 
        'Starting Orbit', 
        'formData.startOrbit', 
        'availableStartOrbits', 
        '', 
        '', 
        'updateOrbits');
      
      selectInput(
        'endOrbit', 
        'Ending Orbit', 
        'formData.endOrbit', 
        'availableEndOrbits', 
        '', 
        '', 
        'updateOrbits');
    ?> -->

        <table class="table table-striped">
          <!-- <tr>
        <th>{{ formData.startOrbit.name }} Orbit Radius</th>
        <td class="text-end">{{ formData.startOrbit.distance | addCommas }} km</td>
      </tr>
      <tr>
        <th>{{ formData.endOrbit.name }} Orbit Radius</th>
        <td class="text-end">{{ formData.endOrbit.distance | addCommas }} km</td>
      </tr> -->
          <tr>
            <th>{{ formData.endOrbit.name }} Starting Degree</th>
            <td class="text-end">{{ calcs.destinationStartingDegree }}&deg;</td>
          </tr>
          <tr>
            <th>{{ formData.startOrbit.name }} Ending Degree</th>
            <td class="text-end">
              {{ addCommas(calcs.originEndingDegree) }}&deg;
            </td>
          </tr>
          <tr>
            <th>Semi Major Axis</th>
            <td class="text-end">{{ addCommas(semiMajorAxis) }} km</td>
          </tr>
          <tr>
            <th>{{ formData.startOrbit.name }} Orbit Velocity</th>
            <td class="text-end">
              {{ addCommas(startingOrbitVelocity) }} km/s
            </td>
          </tr>
          <tr>
            <th>{{ formData.endOrbit.name }} Orbit Velocity</th>
            <td class="text-end">{{ addCommas(endingOrbitVelocity) }} km/s</td>
          </tr>
          <tr>
            <th>Hohman Orbit Velocity</th>
            <td class="text-end">{{ addCommas(hohmannOrbitVelocity) }} km/s</td>
          </tr>
          <!-- <tr>
        <th>Perihelion Velocity</th>
        <td class="text-end">{{ perihelionVelocity | addCommas }} m/s</td>
      </tr>
      <tr>
        <th>Aphelion Velocity</th>
        <td class="text-end">{{ aphelionVelocity | addCommas }} m/s</td>
      </tr> -->
          <tr>
            <th>Delta V1</th>
            <td class="text-end">{{ addCommas(firstDeltaV) }} m/s</td>
          </tr>
          <tr>
            <th>Delta V2</th>
            <td class="text-end">{{ addCommas(secondDeltaV) }} m/s</td>
          </tr>
          <tr>
            <th>Total Delta V</th>
            <td class="text-end">
              {{ addCommas(firstDeltaV + secondDeltaV) }} m/s
            </td>
          </tr>
          <!-- <tr>
        <th>Hohman Orbit Period</th>
        <td class="text-end">{{ transferPeriod / conversion.secondsToDays | addCommas }} days</td>
      </tr> -->
          <tr>
            <th>Travel Time</th>
            <td class="text-end">{{ addCommas(timeOfFlightDays) }} days</td>
          </tr>
        </table>
      </div>
    </div>
    <div id="hohmann__results" class="col-lg-8 calc-form">
      <div class="d-flex justify-content-between mb-3">
        <button class="btn btn-nexus" @click="play">
          <i class="fas" :class="playClass"></i>
        </button>
        <h3 class="mb-0">Day {{ currentDay }}</h3>
      </div>

      <div
        id="hohmann-canvas"
        class="mb-3"
        style="position: relative; height: 500px"
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

import { computed, onMounted, ref } from "vue";
import { addCommas } from "../utils";

import {
  locations,
  physicsConstants,
  scaleConversions,
  animationConstants,
} from "./constants";
import type { Location } from "./constants";

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

const planetTextures = ref<PlanetTextures>({
  sun: null,
  mercury: null,
  venus: null,
  earth: null,
  mars: null,
  jupiter: null,
  saturn: null,
  uranus: null,
  neptune: null,
});

interface ThreeElements {
  canvas: HTMLElement | HTMLCanvasElement | null;
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  controls: OrbitControls | null;
  group: null;
  stats: null; // used for debugging
  gui: null; // used for debugging
  raycaster: null;
  mouse: null;
  minMovement: null;
  maxMovement: null;
}

const three = ref<ThreeElements>({
  canvas: null,
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  group: null,
  stats: null, // used for debugging
  gui: null, // used for debugging
  raycaster: null,
  mouse: null,
  minMovement: null,
  maxMovement: null,
});

const help = ref({
  tooltipModal: null,
  tooltipTitle: null,
  tooltipDescription: "",
});

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

const startingOrbitGroup = ref<THREE.Group | null>(null);
const endingOrbitGroup = ref<THREE.Group | null>(null);
const hohmannOrbitGroup = ref<THREE.Group | null>(null);
const hohmannCenter = ref(0);

/**
 *
 *
 * COMPUTED
 *
 *
 */
const availableStartOrbits = computed(() => {
  let loc = locations.filter(
    (location) => location.distance != formData.value.endOrbit.distance
  );

  return loc;
});

const availableEndOrbits = computed(() => {
  let loc = locations.filter(
    (location) => location.distance != formData.value.startOrbit.distance
  );

  return loc;
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
  return (
    (animationConstants.currentFrame / totalFramesInHohmannOrbit.value) *
    timeOfFlightDays.value
  ).toFixed(0);
});

const totalFramesInHohmannOrbit = computed(() => {
  return animationConstants.duration * animationConstants.FPS;
});

const playClass = computed(() => {
  if (!animationConstants.complete) {
    if (!animationConstants.play) {
      return "fa-play";
    } else {
      return "fa-pause";
    }
  } else {
    return "fa-undo";
  }
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
});

async function loadModels() {
  const textureLoader = new THREE.TextureLoader();
  // TODO: Do we want to load these dynamically instead of on load?
  planetTextures.value.sun = await textureLoader.load(
    textureDir + "2k_sun.jpg"
  );
  planetTextures.value.mercury = await textureLoader.load(
    textureDir + "2k_mercury.jpg"
  );
  planetTextures.value.venus = await textureLoader.load(
    textureDir + "2k_venus_atmosphere.jpg"
  );
  planetTextures.value.earth = await textureLoader.load(
    textureDir + "4k_earth_day.jpg"
  );
  planetTextures.value.mars = await textureLoader.load(
    textureDir + "2k_mars.jpg"
  );
  planetTextures.value.jupiter = await textureLoader.load(
    textureDir + "2k_jupiter.jpg"
  );
  planetTextures.value.saturn = await textureLoader.load(
    textureDir + "2k_saturn.jpg"
  );
  planetTextures.value.uranus = await textureLoader.load(
    textureDir + "2k_uranus.jpg"
  );
  planetTextures.value.neptune = await textureLoader.load(
    textureDir + "2k_neptune.jpg"
  );

  loading.value = false;
  setupScene();
}

function setupScene() {
  if (loading.value) return;

  setupThreeJS();

  // setupSun();
  // updateOrbits();

  // if (!animationConstants.prevTick) {
  //   animate();
  // }
}

function setupThreeJS() {
  three.value.scene = new THREE.Scene();

  // Renderer
  three.value.renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true,
  }); // { alpha: true }
  three.value.canvas = document.getElementById("hohmann-canvas");
  if (!three.value.canvas) return;

  three.value.canvas.appendChild(three.value.renderer.domElement);

  const width = three.value.canvas.getBoundingClientRect().width;
  const height = 500;

  three.value.renderer.setSize(width, height);

  // updateCamera();

  // Lights
  three.value.scene.add(new THREE.AmbientLight(0xffffff));
  const light = new THREE.PointLight(0xffffff, 1, 0, 1);
  three.value.scene.add(light);
}

function updateCamera() {
  if (!three.value.renderer) return;

  // Camera
  const distanceMultiple = 1000; // ? NOTE: This is arbitrary and can be updated to give cammera different viewing distance
  const cameraPositionDistance = distanceMultiple * 5;
  const cameraZoomDistance = distanceMultiple * 5;
  let rendererSize = new THREE.Vector2();
  three.value.renderer.getSize(rendererSize);
  three.value.camera = new THREE.PerspectiveCamera(
    45,
    rendererSize.width / rendererSize.height,
    0.1,
    cameraZoomDistance * 20
  );

  three.value.camera.position.z = cameraPositionDistance;

  // Controls
  three.value.controls = new OrbitControls(
    three.value.camera,
    three.value.renderer.domElement
  );

  if (!three.value.controls) return;

  three.value.controls.minDistance = distanceMultiple;
  three.value.controls.maxDistance = cameraZoomDistance * 20;
}

function setupSun() {
  if (!three.value.scene) return;

  const material = new THREE.MeshLambertMaterial({
    map: planetTextures.value.sun,
    side: THREE.FrontSide,
  });
  material.emissive = new THREE.Color(0xffff00);
  material.emissiveIntensity = 0.3;

  const geometry = new THREE.SphereGeometry(200, 64, 64);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.set(Math.PI / 2, 0, 0);

  three.value.scene.add(mesh);
}

function updateOrbits() {
  if (!three.value.scene) return;

  if (startingOrbitGroup.value) {
    three.value.scene.remove(startingOrbitGroup.value);
  }

  if (endingOrbitGroup.value) {
    three.value.scene.remove(endingOrbitGroup.value);
  }

  if (hohmannOrbitGroup.value) {
    three.value.scene.remove(hohmannOrbitGroup.value);
  }

  // if(ship.value){
  //   three.value.scene.remove(ship.value);
  // }

  startingOrbitGroup.value = new THREE.Group();
  endingOrbitGroup.value = new THREE.Group();
  hohmannOrbitGroup.value = new THREE.Group();

  setupOrbits(formData.value.startOrbit, false);
  setupOrbits(formData.value.endOrbit, true);
  setupHohmannOrbit();
  setupShip();

  three.value.scene.add(startingOrbitGroup.value);
  three.value.scene.add(endingOrbitGroup.value);
  three.value.scene.add(hohmannOrbitGroup.value);

  animationConstants.play = false;
  animationConstants.complete = false;
  animationConstants.currentFrame = 1;
}
function setupOrbits(orbit: Location, endOrbit: boolean) {
  if (!three.value.scene) return;

  const orbitSize = orbit.distance / scaleConversions.scaleFactor;
  const planetMaterial = getMaterial(orbit.name);

  const planetGeometry = new THREE.SphereGeometry(
    50 * orbit.planetSize,
    32,
    32
  );
  const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
  // Rotate the planet to the (more or less) correct orientation compared to the plane of the system
  planetMesh.rotation.set(Math.PI / 2, 0, 0);

  const orbitGeometry = new THREE.RingGeometry(
    orbitSize - 5,
    orbitSize + 5,
    128
  );
  const orbitMaterial = new THREE.MeshBasicMaterial({
    color: orbit.orbitColor,
    side: THREE.DoubleSide,
  });
  const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);

  // this.drawDeltaV(orbit, endOrbit);

  if (endOrbit && endingOrbitGroup.value) {
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

    endingOrbitGroup.value.add(planetMesh);
    endingOrbitGroup.value.add(orbitMesh);
    three.value.scene.add(endingOrbitGroup.value);
  } else if (startingOrbitGroup.value) {
    planetMesh.position.set(orbitSize, 0, 0);

    // How far does this body move in its orbit during the transit?
    const radiansPerDay = (Math.PI * 2) / orbit.orbitalPeriod;
    calcs.value.originEndingRads = radiansPerDay * timeOfFlightDays.value;
    calcs.value.originEndingDegree = radiansToDegrees(
      calcs.value.originEndingRads
    );

    startingOrbitGroup.value.add(planetMesh);
    startingOrbitGroup.value.add(orbitMesh);
    three.value.scene.add(startingOrbitGroup.value);

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
  if (!three.value.scene) return;
  if (!hohmannOrbitGroup.value) return;

  // setup orbit
  const sMajorAxis = semiMajorAxis.value / scaleConversions.scaleFactor;

  const axisMaterial = new THREE.MeshBasicMaterial({
    color: 0xea6730,
    side: THREE.FrontSide,
  });
  const axisGeometry = new THREE.SphereGeometry(20, 12, 12);
  const axisMesh = new THREE.Mesh(axisGeometry, axisMaterial);

  const hohmannGeometry = new THREE.RingGeometry(
    sMajorAxis - 5,
    sMajorAxis + 5,
    128
  );
  const hohmannMaterial = new THREE.MeshBasicMaterial({
    color: 0xea6730,
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
  hohmannMesh.position.set(hohmannCenter.value, 0, 0);

  hohmannOrbitGroup.value.add(axisMesh);
  hohmannOrbitGroup.value.add(hohmannMesh);

  three.value.scene.add(hohmannOrbitGroup.value);
}

function setupShip() {
  if (!hohmannOrbitGroup.value) return;

  const orbitSize =
    formData.value.startOrbit.distance / scaleConversions.scaleFactor;

  const material = new THREE.MeshBasicMaterial({
    color: 0xea6730,
    side: THREE.FrontSide,
  });
  const geometry = new THREE.SphereGeometry(30, 12, 12);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(orbitSize, 0, 0); // 80 * formData.value.startOrbit.planetSize // ? NOTE: Do we want to put the ship above the starting planet?

  hohmannOrbitGroup.value.add(mesh);
}

function drawDeltaV(orbit: Location, endOrbit: Location) {
  if (!three.value.scene) return;

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

  three.value.scene.add(deltaVcone);
}
function play() {
  if (animationConstants.complete) {
    reset();
    return;
  }

  animationConstants.play = !animationConstants.play;
}
function reset() {
  updateOrbits();
}
function animate() {
  if (!three.value.scene) return;
  if (!three.value.camera) return;
  if (!three.value.renderer) return;
  if (!three.value.controls) return;
  if (!startingOrbitGroup.value) return;
  if (!endingOrbitGroup.value) return;

  requestAnimationFrame(animate);

  three.value.controls.update();

  //three.value.camera.position.clamp(three.value.minMovement, three.value.maxMovement);
  three.value.renderer.render(three.value.scene, three.value.camera);

  if (animationConstants.complete || !animationConstants.play) return;

  // clamp to fixed framerate
  const now = Math.round(
    (animationConstants.FPS * window.performance.now()) / 1000
  );
  if (now == animationConstants.prevTick) return;
  animationConstants.prevTick = now;

  // Move the planets about their orbits
  startingOrbitGroup.value.rotateOnAxis(
    animationConstants.orbitRotationVector,
    startingOrbitAnimationSpeed.value
  );
  endingOrbitGroup.value.rotateOnAxis(
    animationConstants.orbitRotationVector,
    endingOrbitAnimationSpeed.value
  );

  // Move our ship along the hohmann orbit
  rotateAboutPoint(
    hohmannOrbitGroup.value,
    new THREE.Vector3(hohmannCenter.value, 0, 0),
    new THREE.Vector3(0, 0, 1),
    hohmannAnimationSpeed.value,
    false
  );

  // three.value.stats.update();

  // Are we at the end of our orbit?
  animationConstants.currentFrame++;

  if (animationConstants.currentFrame >= totalFramesInHohmannOrbit.value) {
    animationConstants.play = false;
    animationConstants.complete = true;
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
//   return velocity / scaleConversions.secondsToDays / animationConstants.FPS * animationConstants.simulationSpeed;
// },

function radsToAnimationSpeed(rads: number) {
  const radsPerSecond = rads / animationConstants.duration;
  const radsPerFrame = radsPerSecond / animationConstants.FPS;
  return radsPerFrame;
}

function getMaterial(name: string) {
  switch (name) {
    case "Mercury":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.value.mercury,
        side: THREE.FrontSide,
      });
    case "Venus":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.value.venus,
        side: THREE.FrontSide,
      });
    case "Earth":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.value.earth,
        side: THREE.FrontSide,
      });
    case "Mars":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.value.mars,
        side: THREE.FrontSide,
      });
    case "Jupiter":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.value.jupiter,
        side: THREE.FrontSide,
      });
    case "Saturn":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.value.saturn,
        side: THREE.FrontSide,
      });
    case "Uranus":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.value.uranus,
        side: THREE.FrontSide,
      });
    case "Neptune":
      return new THREE.MeshLambertMaterial({
        map: planetTextures.value.neptune,
        side: THREE.FrontSide,
      });
  }
}

/**
 * 
 * 
data: {

  filters: {
    addCommas(value) {
      return value.toLocaleString();
    },
    capitalize(value) {
      return value.charAt(0).toUpperCase() + value.slice(1);
    },
  },
  watch: {},
*/
</script>
<style></style>
