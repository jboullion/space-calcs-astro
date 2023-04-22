<template>
  <div id="habitable__results" class="col-lg-8 calc-form">
    <div
      id="habitable-canvas"
      class="mb-3"
      style="position: relative; height: 500px; width: 100%"
    >
      <i v-if="loading" class="fas fa-cog fa-spin center-absolute h1"></i>
    </div>
    <p>
      <strong>Note:</strong> Habitable zone is calculated for Earth like
      planets. Planets with different albedos and atmospheres will have
      different habitable zones.
    </p>
    <table class="table table-striped">
      <tbody>
        <tr class="">
          <th>Luminosity (L☉)</th>
          <td class="text-end">{{ luminosity }} L☉</td>
        </tr>
        <tr class="">
          <th>Flux (kT)</th>
          <td class="text-end">{{ formatNumber(energyFlux) }} kT</td>
        </tr>
        <tr class="">
          <th>Inner Radius (AU)</th>
          <td class="text-end">{{ formatNumber(hzInner) }} AU</td>
        </tr>
        <tr class="">
          <th>Outer Radius (AU)</th>
          <td class="text-end">{{ formatNumber(hzOuter) }} AU</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
// TODO: BREAK THIS UP INTO MULTIPLE FILES. BUILD REUSABLE FUNCTIONS
// TODO: Must Dos!
// 1.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { physicsConstants, removeAllChildNodes } from "../utils";
import { formatNumber } from "../utils";
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
  labelRenderer: new CSS2DRenderer(),
  renderOrder: 0,
  camera: new THREE.PerspectiveCamera(),
  controls: null as OrbitControls | null,
  // group: null,
  // stats: null, // used for debugging
  // gui: null, // used for debugging
  // raycaster: null,
  // mouse: null,
  // minMovement: null as THREE.Vector3 | null,
  // maxMovement: null as THREE.Vector3 | null,
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

const starArea = computed(() => {
  const radius = props.formData.starRadius * physicsConstants.solarRadius;
  return 4 * Math.PI * radius ** 2;
});

const starTemperature = computed(() => {
  return props.formData.starTemperature ** 4;
});

const energyFlux = computed(() => {
  return physicsConstants.stefanBoltzmann * starTemperature.value;
});

const luminosity = computed(() => {
  return energyFlux.value * starArea.value * 900000; // TODO: WHY 1000000? 1e6? What is causing us to need to add this value?
});

const L_rel = computed(() => {
  return luminosity.value / physicsConstants.L_sun;
});

const hzInner = computed(() => {
  return Math.sqrt(L_rel.value / 1.1); // / physicsConstants.AU;
});

const hzOuter = computed(() => {
  return Math.sqrt(L_rel.value / 0.53); // / physicsConstants.AU;
});

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
  const height = 500;

  three.renderer.setSize(width, height);

  three.labelRenderer.setSize(width, height);
  three.labelRenderer.domElement.style.position = "absolute";
  three.labelRenderer.domElement.style.top = "0px";
  three.labelRenderer.domElement.style.pointerEvents = "none";
  three.canvas.appendChild(three.labelRenderer.domElement);

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
  const baseDistance = Math.max(props.formData.planetOrbit, hzOuter.value);
  const cameraPositionDistance = baseDistance * AUtoDistance * 2.5;
  const cameraZoomDistance = baseDistance * AUtoDistance * 5;

  let rendererSize = new THREE.Vector2();
  three.renderer.getSize(rendererSize);
  three.camera = new THREE.PerspectiveCamera(
    45,
    rendererSize.width / rendererSize.height,
    0.1,
    cameraZoomDistance * 2
  );

  three.camera.position.z = cameraPositionDistance;

  // this.three.controls.enableZoom = false;

  // Controls
  three.controls = new OrbitControls(three.camera, three.renderer.domElement);
  // three.controls.enableDamping = true;
  // three.controls.dampingFactor = 0.05;
  three.controls.maxDistance = cameraZoomDistance;
  three.controls.minDistance = 100;
}

function getSunColor() {
  if (props.formData.starTemperature > 11000) {
    return 0x5555ff;
  } else if (props.formData.starTemperature > 7500) {
    return 0xffffff;
  } else if (props.formData.starTemperature > 5000) {
    return 0xffff00;
  } else if (props.formData.starTemperature > 3600) {
    return 0xffa500;
  } else if (props.formData.starTemperature > 2500) {
    return 0xaa0000;
  } else {
    return 0x220000;
  }
}

function setupSun() {
  if (!three.scene) return;

  const material = new THREE.MeshLambertMaterial({
    map: planetTextures.sun,
    side: THREE.FrontSide,
    color: getSunColor(),
    emissive: getSunColor(),
    emissiveIntensity: 0.8,
  });

  // This is the radius of the sun in the simulation. NOT ACCURATE. Just a visual representation.
  const sunRadius = 4.7 * props.formData.starRadius;

  const geometry = new THREE.SphereGeometry(sunRadius, 32, 32);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.set(Math.PI / 2, 0, 0);

  three.scene.add(mesh);
}

function clearZones() {
  three.renderOrder = 0;
  three.labelRenderer.domElement.innerHTML = "";

  for (var i = three.scene.children.length - 1; i >= 0; i--) {
    // @ts-ignore
    if (!three.scene.children[i].geometry) continue;

    if (
      // @ts-ignore
      three.scene.children[i].geometry.type !== "ExtrudeGeometry" &&
      // @ts-ignore
      three.scene.children[i].geometry.type !== "SphereGeometry"
    )
      continue;

    three.scene.remove(three.scene.children[i]);
  }
}

function setupZones() {
  const innerHZ: Zone = {
    name: "Inner Habitable Zone",
    color: 0x00ff00,
    emissive: 0x00ff00,
    innerRadius: hzInner.value * AUtoDistance,
    outerRadius: hzOuter.value * AUtoDistance,
    opacity: 0.5,
  };

  // At large star sizes the orbit is too small to see
  const orbitWidth = Math.max(
    4 + Math.floor(props.formData.starRadius / 3),
    10
  );

  const planetOrbit: Zone = {
    name: "Planet Orbit",
    color: 0xffffff,
    emissive: 0xffffff,
    innerRadius: props.formData.planetOrbit * AUtoDistance,
    outerRadius: props.formData.planetOrbit * AUtoDistance + orbitWidth,
    opacity: 1,
  };

  createZone(innerHZ);
  createOrbit(planetOrbit);

  if (props.formData.showExampleOrbits) {
    const earthOrbit: Zone = {
      name: "Earth Orbit",
      color: 0x0000ff,
      emissive: 0x0000ff,
      innerRadius: 1 * AUtoDistance,
      outerRadius: 1 * AUtoDistance + orbitWidth,
      opacity: 1,
    };

    const marsOrbit: Zone = {
      name: "Mars Orbit",
      color: 0xff0000,
      emissive: 0xff0000,
      innerRadius: 1.5 * AUtoDistance,
      outerRadius: 1.5 * AUtoDistance + orbitWidth,
      opacity: 1,
    };

    const venusOrbit: Zone = {
      name: "Venus Orbit",
      color: 0xffff00,
      emissive: 0xffff00,
      innerRadius: 0.7 * AUtoDistance,
      outerRadius: 0.7 * AUtoDistance + orbitWidth,
      opacity: 1,
    };

    const mercuryOrbit: Zone = {
      name: "Mercury Orbit",
      color: 0xcccccc,
      emissive: 0xcccccc,
      innerRadius: 0.4 * AUtoDistance,
      outerRadius: 0.4 * AUtoDistance + orbitWidth,
      opacity: 1,
    };

    createOrbit(earthOrbit);
    createOrbit(marsOrbit);
    createOrbit(venusOrbit);
    createOrbit(mercuryOrbit);

    if (hzOuter.value > 3) {
      const jupiterOrbit: Zone = {
        name: "Jupiter Orbit",
        color: 0xffaa00,
        emissive: 0xffaa00,
        innerRadius: 5.2 * AUtoDistance,
        outerRadius: 5.2 * AUtoDistance + orbitWidth,
        opacity: 1,
      };

      createOrbit(jupiterOrbit);
    }

    if (hzOuter.value > 7) {
      const saturnOrbit: Zone = {
        name: "Saturn Orbit",
        color: 0xaaaa00,
        emissive: 0xaaaa00,
        innerRadius: 9.5 * AUtoDistance,
        outerRadius: 9.5 * AUtoDistance + orbitWidth,
        opacity: 1,
      };

      createOrbit(saturnOrbit);
    }

    if (hzOuter.value > 15) {
      const uranusOrbit: Zone = {
        name: "Uranus Orbit",
        color: 0x00aaff,
        emissive: 0x00aaff,
        innerRadius: 19.8 * AUtoDistance,
        outerRadius: 19.8 * AUtoDistance + orbitWidth,
        opacity: 1,
      };

      createOrbit(uranusOrbit);
    }

    if (hzOuter.value > 25) {
      const neptuneOrbit: Zone = {
        name: "Neptune Orbit",
        color: 0x0033ff,
        emissive: 0x0033ff,
        innerRadius: 30 * AUtoDistance,
        outerRadius: 30 * AUtoDistance + orbitWidth,
        opacity: 1,
      };

      createOrbit(neptuneOrbit);
    }

    if (hzOuter.value > 30) {
      const plutoOrbit: Zone = {
        name: "Pluto Orbit",
        color: 0xa020f0,
        emissive: 0xa020f0,
        innerRadius: 39 * AUtoDistance,
        outerRadius: 39 * AUtoDistance + orbitWidth,
        opacity: 1,
      };

      createOrbit(plutoOrbit);
    }
  }
}

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
  three.renderOrder++;

  three.scene.add(zoneMesh);

  if (props.formData.showLabels) {
    zoneMesh.layers.enableAll();

    const labelDiv = document.createElement("div");
    labelDiv.className = "label";
    labelDiv.textContent = orbit.name;
    labelDiv.style.backgroundColor = "transparent";
    labelDiv.style.color = "white";
    labelDiv.style.fontSize = "12px";
    labelDiv.style.fontFamily = "sans-serif";
    labelDiv.style.padding = "0.5em";
    labelDiv.style.borderRadius = "0.5em";
    labelDiv.style.pointerEvents = "none";
    labelDiv.style.textAlign = "center";
    labelDiv.style.opacity = "0.8";
    // labelDiv.style.border = "1px solid white";

    const label = new CSS2DObject(labelDiv);
    //const side = zoneMesh.renderOrder % 2 == 0 ? 1 : -1;
    const upOrDown = three.renderOrder % 2 == 0 ? 1 : -1;
    label.position.set(0, upOrDown * orbit.outerRadius - 80, 0);
    // @ts-ignore
    label.center.set(0, 1);
    zoneMesh.add(label);
    label.layers.set(0);
  }
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
  three.labelRenderer.render(three.scene, three.camera);

  // clamp to fixed framerate
  const now = Math.round((30 * window.performance.now()) / 1000);

  if (now == animation.prevTick) return;

  animation.prevTick = now;
}

/**
 * WATCHERS
 */
watch(props.formData, (newValue, oldValue) => {
  //updateCamera();
  const baseDistance = Math.max(props.formData.planetOrbit, hzOuter.value);
  const cameraZoomDistance = baseDistance * AUtoDistance * 4;
  three.camera.far = cameraZoomDistance * 2;
  three.camera.updateProjectionMatrix();
  if (three.controls) {
    three.controls.maxDistance = cameraZoomDistance;
  }

  clearZones();
  setupSun();
  setupZones();
});
</script>
