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
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { HabitableZoneForm } from "./constants";

type Zone = {
  name: string;
  color: number;
  emissive: number;
  innerRadius: number;
  outerRadius: number;
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

// function removeAllChildNodes(parent: HTMLElement) {
//   while (parent.firstChild) {
//     parent.removeChild(parent.firstChild);
//   }
// }

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
    // removeAllChildNodes(three.canvas);
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
  const light = new THREE.DirectionalLight(0xffffff, 0.5);
  three.scene.add(light);

  // // GUI
  // this.three.gui = new dat.GUI( { autoPlace: false } );
  // this.three.canvas.appendChild(this.three.gui.domElement);
}

function updateCamera() {
  if (!three.renderer) return;

  // Camera
  const cameraPositionDistance = 1000; // totalOrbitHeight.value * 3;
  const cameraZoomDistance = 2000; // totalOrbitHeight.value * 6; //this.stationWidth * 10;
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

function setupSun() {
  if (!three.scene) return;

  const material = new THREE.MeshLambertMaterial({
    map: planetTextures.sun,
    side: THREE.FrontSide,
  });
  material.emissive = new THREE.Color(0xffff00);
  material.emissiveIntensity = 0.3;

  const geometry = new THREE.SphereGeometry(200, 64, 64);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.set(Math.PI / 2, 0, 0);

  three.scene.add(mesh);
}

function setupZones() {
  const hotZone: Zone = {
    name: "Hot Zone",
    color: 0xff0000,
    emissive: 0x550000,
    innerRadius: 0,
    outerRadius: 1000,
  };

  const habitableZone: Zone = {
    name: "Habitable Zone",
    color: 0x00ff00,
    emissive: 0x005500,
    innerRadius: 1000,
    outerRadius: 2000,
  };

  const coldZone: Zone = {
    name: "Cold Zone",
    color: 0x0000ff,
    emissive: 0x000055,
    innerRadius: 2000,
    outerRadius: 3000,
  };

  createZone(hotZone);
  createZone(habitableZone);
  createZone(coldZone);
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

  const zoneMaterial = new THREE.MeshPhongMaterial({
    color: zone.color,
    emissive: zone.emissive,
    side: THREE.FrontSide, // DoubleSide, BackSide
  });

  const zoneGeometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);

  const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);

  three.scene.add(zoneMesh);
}

function animate() {
  if (!three.renderer) return;
  if (!three.controls) return;

  requestAnimationFrame(animate);

  three.controls.update();

  //this.three.camera.position.clamp(this.three.minMovement, this.three.maxMovement);
  three.renderer.render(three.scene, three.camera);

  // clamp to fixed framerate
  const now = Math.round((60 * window.performance.now()) / 1000);

  if (now == animation.prevTick) return;

  animation.prevTick = now;
}
</script>
