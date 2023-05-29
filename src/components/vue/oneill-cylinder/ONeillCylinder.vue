<template>
  <div id="oneill__app" class="row justify-content-center">
    <div id="oneill__form" class="col-lg-4">
      <div class="p-2 rounded border mb-5">
        <ONeillForm :formData="formData" />
      </div>
    </div>
    <div id="oneill__results" class="col-lg-8">
      <div class="p-2 rounded border mb-5">
        <ONeillResults :formData="formData" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from "vue";
import ONeillForm from "./ONeillForm.vue";
import ONeillResults from "./ONeillResults.vue";

import type { ONeillCylinderForm } from "./types";
import {
  atmosphereCompositions,
  materials,
  populationDensityExamples,
} from "./constants";

// TODO: Do we want to move the default value to "constants.ts"?
const formData = ref<ONeillCylinderForm>({
  structure: {
    radius: 1,
    cylinderLength: 10,
    surfaceGravity: 1,
    internalPressure: 101,
    airMix: atmosphereCompositions[1],
    material: materials[1],
    safetyFactor: 1.3,
    shellWallThickness: 5000.0,
    minShieldingShellMass: 5000.0,
    internalStructureMass: 1000.0,
    caps: "flat",
  },
  internal: {
    levelHeight: 10, // m
    levels: 1,
    floorMaterial: materials[1],
  },
  landUse: {
    urbanDensity: 10,
    agriculturalDensity: 60,
    industrialDensity: 10,
    // unusedDensity: number; // % calculated
    urbanDensityExample: populationDensityExamples[5],
  },
  diet: {},
});

onMounted(() => {});
</script>
<style></style>
