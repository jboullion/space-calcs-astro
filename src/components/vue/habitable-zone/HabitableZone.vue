<template>
  <div id="habitable-transfer__app" class="row">
    <HabitableForm :formData.sync="formData" />
    <HabitableResults :formData="formData" />
  </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!
// 1. Get star showing, along with orbits for planets
// 2. Get custom planet and orbit showing
// 3. Show habitable zones
// 4. Setup calculations to determin habitable zone size

// ! BUGS

// ? NOTE: Optional Improvements!

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

// import {
//   locations,
//   physicsConstants,
//   scaleConversions,
//   animationConstants,
// } from "./constants";
// import type { Location } from "./constants";

import SelectInput from "../forms/SelectInput.vue";
import HabitableResults from "./HabitableResults.vue";
import HabitableForm from "./HabitableForm.vue";
import type { HabitableZoneForm } from "./constants";

const loading = ref(true);
const textureDir = "/textures/";

const formData = ref<HabitableZoneForm>({
  starMass: 1, // Multiples of Sol
});

/**
 *
 *
 * COMPUTED
 *
 *
 */

/**
 *
 *
 * SETUP
 *
 *
 */
onMounted(() => {});

// function removeAllChildNodes(parent: HTMLElement) {
//   while (parent.firstChild) {
//     parent.removeChild(parent.firstChild);
//   }
// }

/**
 *
 *
 * METHODS
 *
 *
 */
</script>
<style></style>
