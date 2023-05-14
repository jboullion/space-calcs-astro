<template>
  <div id="oneill__app" class="row justify-content-center">
    <div id="oneill__form" class="col-md-8 col-lg-6">
      <div class="p-2 rounded border mb-5">
        <div class="calc-form">
          <NumberInput
            id="radius"
            label="Radius"
            v-model.number="formData.structure.radius"
            :step="1"
            :min="10"
            :max="1000000"
            description=""
          />
        </div>
      </div>
    </div>
    <div id="oneill__results" class="col-md-4 col-lg-6 text-center"></div>
  </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from "vue";
import NumberInput from "../forms/NumberInput.vue";

import type { ONeillCylinderForm } from "./constants";
import {
  atmosphereCompositions,
  materials,
  populationDensityExamples,
} from "./constants";
import { clampNumber, formatNumber } from "../utils";

const formData = ref<ONeillCylinderForm>({
  structure: {
    radius: 225,
    cylinderLength: 338,
    surfaceGravity: 0.6,
    internalPressure: 50,
    airMix: atmosphereCompositions[1],
    material: materials[5],
    safetyFactor: 1.1,
    shellWallThickness: 5000.0,
    minShieldingShellMass: 5000.0,
    internalStructureMass: 1000.0,
    caps: "flat",
  },
  internal: {
    roofHeight: 1000,
    levels: 1,
    floorMaterial: materials[1],
  },
  land: {
    urbanDensity: 10,
    agriculturalDensity: 60,
    industrialDensity: 10,
    // unusedDensity: number; // % calculated
    urbanDensityExample: populationDensityExamples[5],
  },
  diet: {},
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

/**
 *
 *
 * METHODS
 *
 *
 */
</script>
<style></style>
