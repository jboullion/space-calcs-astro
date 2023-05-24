<template>
  <div class="calc-form">
    <div class="accordion" id="oneillAccordion">
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingOne">
          <button
            class="accordion-button"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#structureTab"
            aria-expanded="true"
            aria-controls="structureTab"
          >
            Structure
          </button>
        </h2>
        <div
          id="structureTab"
          class="accordion-collapse collapse show"
          aria-labelledby="headingOne"
          data-bs-parent="#oneillAccordion"
        >
          <div class="accordion-body">
            <NumberInput
              id="radius"
              label="Radius"
              v-model.number="formData.structure.radius"
              :step="1"
              :min="10"
              :max="1000000"
              description=""
              unit="m"
            />

            <NumberInput
              id="cylinderLength"
              label="Cylinder Length"
              v-model.number="formData.structure.cylinderLength"
              :step="1"
              :min="10"
              :max="1000000"
              description=""
              unit="m"
            />

            <NumberInput
              id="surfaceGravity"
              label="Surface Gravity"
              v-model.number="formData.structure.surfaceGravity"
              :step="0.1"
              :min="0.1"
              :max="10"
              description=""
              unit="G"
            />

            <NumberInput
              id="internalPressure"
              label="Internal Pressure"
              v-model.number="formData.structure.internalPressure"
              :step="1"
              :min="1"
              :max="1000"
              description=""
              unit="kpa"
            />

            <SelectInput
              id="airMix"
              label="Air Mix"
              v-model="formData.structure.airMix"
              :options="atmosphereCompositions"
              @update:modelValue="updateAirMix"
            />

            <SelectInput
              id="material"
              label="Material"
              v-model="formData.structure.material"
              :options="materials"
              @update:modelValue="updateMaterial"
            />

            <NumberInput
              id="safetyFactor"
              label="Safety Factor"
              v-model.number="formData.structure.safetyFactor"
              :step="0.1"
              :min="1"
              :max="10"
              description=""
            />

            <NumberInput
              id="shellWallThickness"
              label="Shell Wall Thickness"
              v-model.number="formData.structure.shellWallThickness"
              :step="1"
              :min="1"
              :max="1000000"
              description=""
              unit="m"
            />

            <NumberInput
              id="minShieldingShellMass"
              label="Min Shielding Shell Mass"
              v-model.number="formData.structure.minShieldingShellMass"
              :step="1"
              :min="1"
              :max="1000000"
              description=""
              unit="kg/m2"
            />

            <NumberInput
              id="internalStructureMass"
              label="Internal Structure Mass"
              v-model.number="formData.structure.internalStructureMass"
              :step="1"
              :min="1"
              :max="1000000"
              description=""
              unit="kg/m2"
            />

            <SelectInput
              id="caps"
              label="Caps"
              v-model="formData.structure.caps"
              :options="['flat', 'curved']"
            />
          </div>
        </div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingTwo">
          <button
            class="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#floorsTab"
            aria-expanded="false"
            aria-controls="floorsTab"
          >
            Internal Floors
          </button>
        </h2>
        <div
          id="floorsTab"
          class="accordion-collapse collapse"
          aria-labelledby="headingTwo"
          data-bs-parent="#oneillAccordion"
        >
          <div class="accordion-body">
            <NumberInput
              id="levelHeight"
              label="Level Height"
              v-model.number="formData.internal.roofHeight"
              :step="0.1"
              :min="0.1"
              :max="10"
              description=""
              unit="m"
            />

            <NumberInput
              id="levels"
              label="Levels"
              v-model.number="formData.internal.levels"
              :step="1"
              :min="1"
              :max="1000"
              description=""
            />

            <SelectInput
              id="floorMaterial"
              label="Floor Material"
              v-model="formData.internal.floorMaterial"
              :options="materials"
            />
          </div>
        </div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingThree">
          <button
            class="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#landTab"
            aria-expanded="false"
            aria-controls="landTab"
          >
            Land Allocation
          </button>
        </h2>
        <div
          id="landTab"
          class="accordion-collapse collapse"
          aria-labelledby="headingThree"
          data-bs-parent="#oneillAccordion"
        >
          <div class="accordion-body">
            <NumberInput
              id="urbanDensity"
              label="Urban Density"
              v-model.number="formData.land.urbanDensity"
              :step="1"
              :min="1"
              :max="100"
              description=""
              unit="%"
            />

            <NumberInput
              id="agriculturalDensity"
              label="Agricultural Density"
              v-model.number="formData.land.agriculturalDensity"
              :step="1"
              :min="1"
              :max="100"
              description=""
              unit="%"
            />

            <NumberInput
              id="industrialDensity"
              label="Industrial Density"
              v-model.number="formData.land.industrialDensity"
              :step="1"
              :min="1"
              :max="100"
              description=""
              unit="%"
            />

            <!-- <NumberInput
                    id="unusedDensity"
                    label="Unused Density"
                    v-model.number="formData.land.unusedDensity"
                    :step="1"
                    :min="1"
                    :max="100"
                    description=""
                    unit="%"
                  /> -->

            <SelectInput
              id="urbanDensityExample"
              label="Urban Density Example"
              v-model="formData.land.urbanDensityExample"
              :options="populationDensityExamples"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from "vue";
import NumberInput from "../forms/NumberInput.vue";
import SelectInput from "../forms/SelectInput.vue";

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
}

function updateMaterial(newMaterial: StationMaterial) {
  formData.value.structure.material = newMaterial;
}
</script>
