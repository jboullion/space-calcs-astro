<template>
    <div
        id="lagrange-canvas"
        class="canvas-wrapper border"
        style="position: relative; height: 500px; width: 100%"
    >
        <i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
    </div>

    <div class="p-2 rounded border mb-5">
        <div>
            <h2>Results</h2>
            <div>
                <table class="table">
                    <tbody>
                        <!-- <tr>
                            <th>One AU</th>
                            <td class="text-end">
                                {{ formatNumber(physicsConstants.AU) }} km
                            </td>
                        </tr> -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
// TODO:

// OPTIONAL:

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { IMassDriverForm } from './types';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import {
    CSS2DObject,
    CSS2DRenderer,
} from 'three/examples/jsm/renderers/CSS2DRenderer';
// import { GUI } from 'dat.gui';

import { formatNumber, physicsConstants } from '../utils';

const props = defineProps<{
    formData: IMassDriverForm;
}>();

const loading = ref(true);

interface Textures {
    earth: THREE.Texture | null;
    moon: THREE.Texture | null;
}

const textures: Textures = {
    earth: null,
    moon: null,
};

const three = {
    canvas: null as HTMLElement | HTMLCanvasElement | null,
    renderer: null as THREE.WebGLRenderer | null,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    controls: null as OrbitControls | null,
    bodyOne: new THREE.Mesh(),
    bodyTwo: new THREE.Mesh(),
    renderOrder: 0,
    labelRenderer: null as CSS2DRenderer | null,
    group: new THREE.Group(),
    orbitGroup: new THREE.Group(),
    //earthRotationGroup: new THREE.Group(),
    minMovement: null as THREE.Vector3 | null,
    maxMovement: null as THREE.Vector3 | null,
};

const animation = {
    FPS: 60, // In order to ensure things run smoothly on all devices we need to set a fixed framerate
    prevTick: 0, // track the last tick timestamp
    rotationAxis: new THREE.Vector3(0, 0, 1),
    earthRotationAxis: new THREE.Vector3(0, 1, 0),
};

// onMounted(() => {
//     window.addEventListener('resize', setupScene, { passive: true });
// });

// onBeforeUnmount(() => {
//     window.removeEventListener('resize', setupScene);
// });
</script>
