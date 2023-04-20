<template>
  <div id="habitable__results" class="col-lg-8 calc-form">
    <div
      id="habitable-canvas"
      class="mb-3"
      style="position: relative; height: 600px; width: 100%"
    >
      <i v-if="loading" class="fas fa-cog fa-spin center-absolute h1"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: BREAK THIS UP INTO MULTIPLE FILES. BUILD REUSABLE FUNCTIONS
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { physicsConstants, removeAllChildNodes } from "../utils";
import type { HabitableZoneForm } from "./constants";

type Zone = {
  name: string;
  color: number;
  emissive: number;
  innerRadius: number;
  outerRadius: number;
  opacity: number;
};

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

const planet = {
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
  minMovement: null as THREE.Vector3 | null,
  maxMovement: null as THREE.Vector3 | null,
};

const loading = ref(true);
const textureDir = "/textures/";
const props = defineProps<{
  formData: HabitableZoneForm;
}>();

const animation = {
  prevTick: 0,
};

// const AURatio = 100000; // dividing our actual AU by this number to make it easier to work with
const AUtoDistance = 1000; // Turn AU into on screen distance

/**
 *
 * COMPUTED
 *
 * @link https://www.planetarybiology.com/calculating_habitable_zone.html
 */

/*
function log5(val: number) {
  return Math.log(val) / Math.log(5);
}
// Stage 1: Estimate the host star’s absolute luminosity based on the star’s apparent visual magnitude
// First Step (stage 1)  – Calculate the absolute visual magnitude of the host star based on the star’s apparent magnitude.
const visualMagnitude = computed(() => {
  const parsecs = 4.84814e-6 * props.formData.planetOrbit;
  console.log("visualMagnitude", 5 * log5(parsecs) - 5);
  return 5 * log5(parsecs) - 5;
});

// Second Step (stage 1)  – Calculate bolometric magnitude of the host star.
const bolometricMagnitude = computed(() => {
  const BC = bolometricCorrection.find(
    (bc) => bc.starType === props.formData.starType.value
  );

  if (!BC) return visualMagnitude.value + -0.4;
  console.log("bolometricMagnitude", visualMagnitude.value + BC.value);
  return visualMagnitude.value + BC.value;
});

// Third Step (stage 1) – Calculate the absolute luminosity of the host star
const absoluteLuminosity = computed(() => {
  const Mbol = 4.72;
  const pogsonsRatio = -2.5; // "Pogson's Ratio."
  console.log(
    "absoluteLuminosity",
    Math.pow(10, (bolometricMagnitude.value - Mbol) / pogsonsRatio)
  );
  return Math.pow(10, (bolometricMagnitude.value - Mbol) / pogsonsRatio);
});

// Stage 2: Approximate the radii of the boundaries of the host star’s habitable zone
const innerHabitableZone = computed(() => {
  return Math.sqrt(absoluteLuminosity.value / 1.1);
});
const outerHabitableZone = computed(() => {
  return Math.sqrt(absoluteLuminosity.value / 0.53);
});
*/
/**
 *
 *
 * SETUP
 *
 *
 */
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
 * THREE JS
 *
 *
 */

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

  if (three.scene && three.canvas) {
    removeAllChildNodes(three.canvas);
  }

  setupThreeJS();
  setupSun();
  setupZones();
  // setupPlanet();

  if (!animation.prevTick) {
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
  three.canvas = document.getElementById("habitable-canvas");

  if (!three.canvas) return;

  three.canvas.appendChild(three.renderer.domElement);

  const width = three.canvas.getBoundingClientRect().width;
  const height = 400;

  three.renderer.setSize(width, height);

  updateCamera();

  // Lights
  three.scene.add(new THREE.AmbientLight(0x404040));

  // TODO: Possibly create a point light for the sun
  //const light = new THREE.DirectionalLight(0xffffff, 0.5);
  //three.scene.add(light);

  // // GUI
  // this.three.gui = new dat.GUI( { autoPlace: false } );
  // this.three.canvas.appendChild(this.three.gui.domElement);
}

function updateCamera() {
  if (!three.renderer) return;

  // Camera
  const cameraPositionDistance = props.formData.planetOrbit * AUtoDistance * 6;
  const cameraZoomDistance = props.formData.planetOrbit * AUtoDistance * 12;
  let rendererSize = new THREE.Vector2();
  three.renderer.getSize(rendererSize);
  three.camera = new THREE.PerspectiveCamera(
    45,
    rendererSize.width / rendererSize.height,
    0.1,
    cameraZoomDistance * 2
  );

  three.minMovement = new THREE.Vector3(
    -cameraZoomDistance,
    -cameraZoomDistance,
    -cameraZoomDistance
  );
  three.maxMovement = new THREE.Vector3(
    cameraZoomDistance,
    cameraZoomDistance,
    cameraZoomDistance
  );

  three.camera.position.z = cameraPositionDistance;
  // this.three.controls.enableZoom = false;

  // Controls
  three.controls = new OrbitControls(three.camera, three.renderer.domElement);
}

/**
 * SETUP OBJECTS
 */
// function getMaterial(name: string) {
//   switch (name) {
//     case "Mercury":
//       return new THREE.MeshLambertMaterial({
//         map: planetTextures.mercury,
//         side: THREE.FrontSide,
//       });
//     case "Venus":
//       return new THREE.MeshLambertMaterial({
//         map: planetTextures.venus,
//         side: THREE.FrontSide,
//       });
//     case "Earth":
//       return new THREE.MeshLambertMaterial({
//         map: planetTextures.earth,
//         side: THREE.FrontSide,
//       });
//     case "Mars":
//       return new THREE.MeshLambertMaterial({
//         map: planetTextures.mars,
//         side: THREE.FrontSide,
//       });
//     case "Jupiter":
//       return new THREE.MeshLambertMaterial({
//         map: planetTextures.jupiter,
//         side: THREE.FrontSide,
//       });
//     case "Saturn":
//       return new THREE.MeshLambertMaterial({
//         map: planetTextures.saturn,
//         side: THREE.FrontSide,
//       });
//     case "Uranus":
//       return new THREE.MeshLambertMaterial({
//         map: planetTextures.uranus,
//         side: THREE.FrontSide,
//       });
//     case "Neptune":
//       return new THREE.MeshLambertMaterial({
//         map: planetTextures.neptune,
//         side: THREE.FrontSide,
//       });
//   }
// }

function setupSun() {
  if (!three.scene) return;

  const material = new THREE.MeshLambertMaterial({
    map: planetTextures.sun,
    side: THREE.FrontSide,
  });
  material.emissive = new THREE.Color(0xffff00);
  material.emissiveIntensity = 0.5;

  const geometry = new THREE.SphereGeometry(10, 32, 32);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.set(Math.PI / 2, 0, 0);

  three.scene.add(mesh);
}

function clearZones() {
  for (var i = three.scene.children.length - 1; i >= 0; i--) {
    // @ts-ignore
    if (!three.scene.children[i].geometry) continue;

    // @ts-ignore
    if (three.scene.children[i].geometry.type !== "ExtrudeGeometry") continue;

    three.scene.remove(three.scene.children[i]);
  }
}

function setupZones() {
  clearZones();

  // const hotZone: Zone = {
  //   name: "Hot Zone",
  //   color: 0xff0000,
  //   emissive: 0xdd0000,
  //   innerRadius: 0,
  //   outerRadius: 1 * AUtoDistance,
  //   opacity: 0.5,
  // };

  // const innerHabitableZone: Zone = {
  //   name: "Inner Habitable Zone",
  //   color: 0x00ff00,
  //   emissive: 0x00ff00,
  //   innerRadius: 1 * AUtoDistance,
  //   outerRadius: 1.5 * AUtoDistance,
  //   opacity: 0.5,
  // };

  // const outerHabitableZone: Zone = {
  //   name: "Outer Habitable Zone",
  //   color: 0x00ff00,
  //   emissive: 0x005500,
  //   innerRadius: 1.5 * AUtoDistance,
  //   outerRadius: 2 * AUtoDistance,
  //   opacity: 0.5,
  // };

  // const coldZone: Zone = {
  //   name: "Cold Zone",
  //   color: 0x0000ff,
  //   emissive: 0x000055,
  //   innerRadius: 2 * AUtoDistance,
  //   outerRadius: 3 * AUtoDistance,
  //   opacity: 0.5,
  // };

  const starRadius = props.formData.starRadius * physicsConstants.solarRadius;
  const [aInner, aOuter] = calculateHabitableZone(
    starRadius,
    props.formData.starTemperature
  );

  console.log("aInner", aInner);
  console.log("aOuter", aOuter);

  const innerHZ: Zone = {
    name: "Inner Habitable Zone",
    color: 0x00ff00,
    emissive: 0x00ff00,
    innerRadius: aInner * AUtoDistance,
    outerRadius: aOuter * AUtoDistance,
    opacity: 0.5,
  };

  const earthOrbit: Zone = {
    name: "Earth Orbit",
    color: 0xffffff,
    emissive: 0xffffff,
    innerRadius: props.formData.planetOrbit * AUtoDistance,
    outerRadius: props.formData.planetOrbit * AUtoDistance + 10,
    opacity: 1,
  };

  createZone(innerHZ);
  // createZone(hotZone);
  // createZone(innerHabitableZone);
  // createZone(outerHabitableZone);
  // createZone(coldZone);
  createOrbit(earthOrbit);
}

let renderOrder = 1;

function createZone(zone: Zone) {
  var extrudeSettings = {
    depth: 1,
    steps: 1,
    bevelEnabled: false,
    curveSegments: 24,
  };

  var arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, zone.outerRadius, 0, Math.PI * 2, false);

  var holePath = new THREE.Path();
  holePath.absarc(
    0,
    0,
    zone.innerRadius, // This would be the radius of the smaller circle
    0,
    Math.PI * 2,
    true
  );
  arcShape.holes.push(holePath);

  const zoneMaterial = new THREE.MeshLambertMaterial({
    color: zone.color,
    emissive: zone.emissive,
    side: THREE.FrontSide, // DoubleSide, BackSide
    opacity: zone.opacity,
    transparent: true,
    depthWrite: false,
  });

  const zoneGeometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);

  const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
  zoneMesh.renderOrder = renderOrder++;

  three.scene.add(zoneMesh);
}

function createOrbit(orbit: Zone) {
  var extrudeSettings = {
    depth: 3,
    steps: 1,
    bevelEnabled: false,
    curveSegments: 24,
  };

  var arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, orbit.outerRadius, 0, Math.PI * 2, false);

  var holePath = new THREE.Path();
  holePath.absarc(
    0,
    0,
    orbit.innerRadius, // This would be the radius of the smaller circle
    0,
    Math.PI * 2,
    true
  );
  arcShape.holes.push(holePath);

  const zoneMaterial = new THREE.LineDashedMaterial({
    color: orbit.color,
    side: THREE.FrontSide, // DoubleSide, BackSide
    opacity: orbit.opacity,
    transparent: true,
    depthWrite: false,
    linewidth: 100,
    scale: 1,
    dashSize: 300,
    gapSize: 100,
  });

  const zoneGeometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);

  const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
  zoneMesh.renderOrder = renderOrder++;

  three.scene.add(zoneMesh);
}

/**
 * ANIMATE
 */
function animate() {
  if (!three.renderer) return;
  if (!three.controls) return;

  requestAnimationFrame(animate);

  three.controls.update();

  //this.three.camera.position.clamp(this.three.minMovement, this.three.maxMovement);
  three.renderer.render(three.scene, three.camera);

  // clamp to fixed framerate
  const now = Math.round((30 * window.performance.now()) / 1000);

  if (now == animation.prevTick) return;

  animation.prevTick = now;
}

/**
 * CONVERSIONS and CALCULATIONS
 */
function calculateHabitableZone(
  radius: number,
  temperature: number
): [number, number] {
  // Calculate the star's luminosity in W
  const starArea = 4 * Math.PI * radius ** 2;
  const starTemperature = temperature ** 4;
  const energyFlux = physicsConstants.stefanBoltzmann * starTemperature;
  const luminosity = energyFlux * starArea * 1000000; // TODO: WHY 1000000? 1e6? What is causing us to need to add this value?

  const L_rel = luminosity / physicsConstants.L_sun;

  console.log("starArea", starArea);
  console.log("starTemperature", starTemperature);
  console.log("luminosity", luminosity);
  console.log("L_rel", L_rel);

  // Calculate the inner and outer edges of the habitable zone in AU
  const aInner = Math.sqrt(L_rel / 1.1); // / physicsConstants.AU;
  const aOuter = Math.sqrt(L_rel / 0.53); // / physicsConstants.AU;

  // Return the habitable zone as a tuple of distances in AU
  return [aInner, aOuter];
}
// function calculateHabitableZone(): [number, number] {
//   // Calculate the star's luminosity in W
//   const luminosity =
//     4 *
//     Math.PI *
//     (props.formData.starRadius * physicsConstants.solarRadius) ** 2 *
//     physicsConstants.σ *
//     props.formData.starTemperature ** 4;

//   console.log(
//     "starRadius",
//     props.formData.starRadius * physicsConstants.solarRadius
//   );
//   console.log("starTemperature", props.formData.starTemperature);
//   console.log("luminosity", luminosity);

//   // Calculate the inner and outer edges of the habitable zone in AU
//   const aInner = Math.sqrt(luminosity / 1.1) / physicsConstants.AU;
//   const aOuter = Math.sqrt(luminosity / 0.53) / physicsConstants.AU;

//   console.log("aInner", aInner);
//   console.log("aOuter", aOuter);

//   // Return the habitable zone as a tuple of distances in AU
//   return [aInner, aOuter];
// }

/**
 * WATCHERS
 */
watch(props.formData, (newValue, oldValue) => {
  setupZones();
});
</script>
