<template>
  <div id="hohmann-transfer__app" class="row"><h1>Test</h1></div>
</template>

<script setup lang="ts">
// @ts-ignore
import * as THREE from "three";
import { onMounted } from "vue";

const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const material = new THREE.MeshNormalMaterial();

const mesh = new THREE.Mesh(geometry, material);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();

let camera: any = null;

onMounted(() => {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    10
  );
  camera.position.z = 1;

  scene.add(mesh);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  const app = document.getElementById("hohmann-transfer__app");
  if (app) {
    app.appendChild(renderer.domElement);
  }
});

function animation(time: number) {
  mesh.rotation.x = time / 2000;
  mesh.rotation.y = time / 1000;

  renderer.render(scene, camera);
}
</script>
<style></style>
