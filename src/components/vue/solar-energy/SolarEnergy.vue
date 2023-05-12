<template>
  <div id="solar-energy__app" class="row">
    <div id="solar-energy__form" class="col-lg-4">
      <div class="calc-form mb-5 p-2 bg-light rounded border">
        <NumberInput
          id="efficiency"
          label="Solar Panel Efficiency"
          v-model.number="formData.solarPanelEfficiency"
          unit="%"
          :step="0.1"
          showRange
          tooltip="How efficient are the solar panels at converting sunlight into electricity?"
          @change="
            formData.solarPanelEfficiency = clampNumber(
              formData.solarPanelEfficiency,
              1,
              100
            )
          "
        />

        <NumberInput
          id="orbit"
          label="Planet Orbit"
          v-model.number="formData.planetOrbit"
          unit="AU"
          :step="0.1"
          tooltip="Distance from the star in astronomical units. Earth is ~1 AU. Mars is ~1.5 AU."
          @change="
            formData.planetOrbit = clampNumber(formData.planetOrbit, 0.1, 100)
          "
        />

        <NumberInput
          id="atmosphere"
          label="Atmosphere Absorption"
          v-model.number="formData.atmosphereAbsorption"
          showRange
          :min="0"
          :max="100"
          :step="0.1"
          unit="%"
          tooltip="Earth's atmosphere absorbs ~37% of the solar energy. Mars atmosphere absorbs ~7%."
        />

        <NumberInput
          id="star-radius"
          label="Star Radius"
          v-model.number="formData.starRadius"
          :step="0.1"
          :max="1000"
          :min="0.1"
          unit="R☉"
          tooltip="Radius of the star in solar radii. Our sun is ~1 R☉"
          @change="
            formData.starRadius = clampNumber(formData.starRadius, 0.1, 1000)
          "
        />
        <NumberInput
          id="star-temperature"
          label="Star Temperature"
          v-model.number="formData.starTemperature"
          unit="K"
          :min="1000"
          :max="20000"
          tooltip="Temperature of the star in Kelvin. Our sun is ~5778 K"
          @change="
            formData.starTemperature = clampNumber(
              formData.starTemperature,
              1000,
              20000
            )
          "
        />
      </div>
    </div>

    <SolarEnergyResults :formData="formData" />
  </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { onMounted, ref } from "vue";
import NumberInput from "../forms/NumberInput.vue";

import SolarEnergyResults from "./SolarEnergyResults.vue";
import type { SolarEnergyForm } from "./constants";
import { clampNumber } from "../utils";

const loading = ref(true);

const formData = ref<SolarEnergyForm>({
  starRadius: 1, // In solar radii
  starTemperature: 5778, // In Kelvin
  planetOrbit: 1, // In AU
  atmosphereAbsorption: 37, // 0-100%
  solarPanelEfficiency: 20, // 0-100%
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
