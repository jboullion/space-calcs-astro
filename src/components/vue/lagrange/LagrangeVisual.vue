<template>
    <div
        id="oneill-canvas"
        class="canvas-wrapper border"
        style="position: relative; height: 500px; width: 100%"
    >
        <i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
    </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ILagrangeForm } from './types';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// import {
//   CSS2DObject,
//   CSS2DRenderer,
// } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { formatNumber, physicsConstants, roundToDecimal } from '../utils';

const props = defineProps<{
    formData: ILagrangeForm;
}>();

const loading = ref(true);
</script>
