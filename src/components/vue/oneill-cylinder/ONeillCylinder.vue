<template>
  <div id="oneill__app" class="row justify-content-center">
    <div id="oneill__form" class="col-lg-4">
      <div class="p-2 rounded border mb-5">
        <ONeillForm />
      </div>
    </div>
    <div id="oneill__results" class="col-lg-8"></div>
  </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from "vue";
import NumberInput from "../forms/NumberInput.vue";
import SelectInput from "../forms/SelectInput.vue";
import ONeillForm from "./ONeillForm.vue";

import type {
  AtmosphereComposition,
  StationMaterial,
  ONeillCylinderForm,
} from "./constants";
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

function updateAirMix(newMix: AtmosphereComposition) {
  formData.value.structure.airMix = newMix;
  // formData.value.specificImpulse = formData.value.engine.ispVacuum;
  // formData.value.seaLevelSpecificImpulse = formData.value.engine.ispSeaLevel;
  // formData.value.exhaustVelocity = convertIspToVe(
  //   formData.value.specificImpulse
  // );
  // formData.value.seaLevelVelocity = convertIspToVe(
  //   formData.value.seaLevelSpecificImpulse
  // );
}

function updateMaterial(newMaterial: StationMaterial) {
  formData.value.structure.material = newMaterial;
}
</script>
<style></style>
