<template>
  <div id="oneill__app" class="row justify-content-center">
    <div id="oneill__form" class="col-md-8 col-lg-6">
      <div class="p-2 rounded border mb-5">
        <div class="calc-form">
          <div class="accordion" id="accordionExample">
            <div class="accordion-item">
              <h2 class="accordion-header" id="headingOne">
                <button
                  class="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseOne"
                  aria-expanded="true"
                  aria-controls="collapseOne"
                >
                  Structure
                </button>
              </h2>
              <div
                id="collapseOne"
                class="accordion-collapse collapse show"
                aria-labelledby="headingOne"
                data-bs-parent="#accordionExample"
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
                  data-bs-target="#collapseTwo"
                  aria-expanded="false"
                  aria-controls="collapseTwo"
                >
                  Internal Floors
                </button>
              </h2>
              <div
                id="collapseTwo"
                class="accordion-collapse collapse"
                aria-labelledby="headingTwo"
                data-bs-parent="#accordionExample"
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
                  data-bs-target="#collapseThree"
                  aria-expanded="false"
                  aria-controls="collapseThree"
                >
                  Accordion Item #3
                </button>
              </h2>
              <div
                id="collapseThree"
                class="accordion-collapse collapse"
                aria-labelledby="headingThree"
                data-bs-parent="#accordionExample"
              >
                <div class="accordion-body">
                  <strong>This is the third item's accordion body.</strong> It
                  is hidden by default, until the collapse plugin adds the
                  appropriate classes that we use to style each element. These
                  classes control the overall appearance, as well as the showing
                  and hiding via CSS transitions. You can modify any of this
                  with custom CSS or overriding our default variables. It's also
                  worth noting that just about any HTML can go within the
                  <code>.accordion-body</code>, though the transition does limit
                  overflow.
                </div>
              </div>
            </div>
          </div>
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
