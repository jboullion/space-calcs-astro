<template>
  <div>
    <section class="py-5 text-center border-bottom bg-black" id="home-canvas">
      <div class="container">
        <div class="row">
          <div class="col-lg-6 col-md-8 mx-auto">
            <div class="d-flex justify-content-center gap-3">
              <!-- <img src="/logo.svg" alt="Space Calcs" height="70" width="30" /> -->
              <Logo />
              <h1 class="fw-light">Space Calcs</h1>
            </div>

            <p class="lead my-4">
              All the tools you need to calculate your mission to space
            </p>

            <div class="row">
              <div class="col-md-6 mb-3">
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Search for a tool"
                    aria-label="Search for a tool"
                    v-model="search"
                  />
                  <span class="input-group-text"
                    ><i class="fas fa-search"></i
                  ></span>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <select
                  class="form-select"
                  placeholder="Select Category"
                  aria-label="Select Category"
                  v-model="selectedCategory"
                  @change="toggleCategory()"
                >
                  <option value="" selected>All</option>
                  <option
                    v-for="category in categories"
                    :key="category.slug"
                    :value="category.slug"
                  >
                    {{ category.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <CalcList :search="search" :active-categories="activeCategories" />
  </div>
</template>

<script setup lang="ts">
import * as THREE from "three";

import CalcList from "./CalcList.vue";
import Logo from "../shared/Logo.vue";

import { onMounted, ref } from "vue";
import { categories } from "./constants";

const loading = ref(true);
const textureDir = "/textures/";

interface PlanetTextures {
  sun: THREE.Texture | null;
  earth: THREE.Texture | null;
}

const planetTextures: PlanetTextures = {
  sun: null,
  earth: null,
};

let sunMesh: THREE.Mesh | null = null;
let earthMesh: THREE.Mesh | null = null;

const animationConstants = {
  FPS: 60, // In order to ensure things run smoothly on all devices we need to set a fixed framerate
  prevTick: 0, // track the last tick timestamp
  axis: new THREE.Vector3(0, 1, 0),
  speed: 0.003,
};

let threeCanvas: HTMLElement | HTMLCanvasElement | null = null;
let threeRenderer: THREE.WebGLRenderer | null = null;
let threeScene: THREE.Scene | null = null;
let threeCamera: THREE.OrthographicCamera | null = null;

const search = ref("");

const activeCategories = ref<string[]>([]);
const selectedCategory = ref<string>("");

function toggleCategory() {
  if (selectedCategory.value === "") {
    activeCategories.value = [];
  } else {
    activeCategories.value = [selectedCategory.value];
  }
}

onMounted(() => {
  loadModels();

  window.addEventListener("resize", setupScene, { passive: true });
});

async function loadModels() {
  const textureLoader = new THREE.TextureLoader();

  planetTextures.sun = await textureLoader.load(textureDir + "2k_sun.jpg");

  planetTextures.earth = await textureLoader.load(
    textureDir + "4k_earth_day.jpg"
  );

  loading.value = false;
  setupScene();
}

function setupScene() {
  if (loading.value) return;

  if (threeCanvas) {
    threeCanvas.removeChild(threeCanvas.children[1]);
  }

  setupThreeJS();

  setupSun();
  setupEarth();

  if (!animationConstants.prevTick) {
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
  threeCanvas = document.getElementById("home-canvas");
  if (!threeCanvas) return;

  threeCanvas.appendChild(threeRenderer.domElement);

  const width = threeCanvas.getBoundingClientRect().width;
  const height = threeCanvas.getBoundingClientRect().height;

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
  const cameraPositionDistance = 1000;

  let rendererSize = new THREE.Vector2();
  threeRenderer.getSize(rendererSize);

  threeCamera = new THREE.OrthographicCamera(
    0,
    rendererSize.width,
    0,
    rendererSize.height
  );

  threeCamera.position.z = cameraPositionDistance;
}

function setupSun() {
  if (!threeScene || !threeCanvas || !threeRenderer) return;

  const material = new THREE.MeshLambertMaterial({
    map: planetTextures.sun,
    side: THREE.FrontSide,
  });
  material.emissive = new THREE.Color(0xffff00);
  material.emissiveIntensity = 0.3;

  let rendererSize = new THREE.Vector2();
  threeRenderer.getSize(rendererSize);

  const geometry = new THREE.SphereGeometry(rendererSize.height / 2, 64, 64);
  sunMesh = new THREE.Mesh(geometry, material);
  sunMesh.rotation.set(0, 0, 0);

  sunMesh.position.set(0, rendererSize.height / 2, 0);

  threeScene.add(sunMesh);
}

function setupEarth() {
  if (!threeScene || !threeCanvas || !threeRenderer) return;

  const material = new THREE.MeshLambertMaterial({
    map: planetTextures.earth,
    side: THREE.FrontSide,
  });

  let rendererSize = new THREE.Vector2();
  threeRenderer.getSize(rendererSize);

  const geometry = new THREE.SphereGeometry(rendererSize.height / 6, 32, 32);
  earthMesh = new THREE.Mesh(geometry, material);
  earthMesh.rotation.set(Math.PI, 0, 0.5);
  earthMesh.position.set(rendererSize.width, rendererSize.height / 2, 0);

  threeScene.add(earthMesh);
}

function animate() {
  if (!threeScene) return;
  if (!threeCamera) return;
  if (!threeRenderer) return;
  if (!sunMesh) return;
  if (!earthMesh) return;

  requestAnimationFrame(animate);

  if (window.screen.width < 768) return;

  //threeCamera.position.clamp(three.value.minMovement, three.value.maxMovement);
  threeRenderer.render(threeScene, threeCamera);

  // clamp to fixed framerate
  const now = Math.round(
    (animationConstants.FPS * window.performance.now()) / 1000
  );
  if (now == animationConstants.prevTick) return;
  animationConstants.prevTick = now;

  sunMesh.rotateOnAxis(animationConstants.axis, -animationConstants.speed / 10);
  earthMesh.rotateOnAxis(animationConstants.axis, animationConstants.speed);

  // three.value.stats.update();
}
</script>

<style>
#home-canvas {
  position: relative;
}

#home-canvas .container {
  position: relative;
  z-index: 2;
}

#home-canvas canvas {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

@media (max-width: 768px) {
  #home-canvas canvas {
    display: none !important;
  }
}
</style>
