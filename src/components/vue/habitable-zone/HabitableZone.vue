<template>
  <div id="habitable-transfer__app" class="row">
    <div id="habitable__form" class="col-lg-4">
      <div class="calc-form mb-5 p-2 bg-light rounded border">
        <!-- <SelectInput
          id="star-type"
          label="Star Type"
          v-model="formData.starType"
          :options="starTypes"
          tooltip="Type of star. Our sun is a G type star"
        >
        </SelectInput> -->

        <!-- <NumberInput
          id="star-mass"
          label="Star Mass"
          v-model.number="formData.starMass"
          unit="M☉"
          tooltip="Mass of the star in solar masses. Our sun is ~1 M☉"
        />

        <NumberInput
          id="star-age"
          label="Star Age"
          v-model.number="formData.starAge"
          unit="Gyr"
          tooltip="Age of the star in billions of years. Our sun is ~4.6 Gyrs old"
        /> -->

        <NumberInput
          id="star-radius"
          label="Star Radius"
          v-model.number="formData.starRadius"
          :step="0.1"
          unit="R☉"
          tooltip="Radius of the star in solar radii. Our sun is ~1 R☉"
        />
        <NumberInput
          id="star-temperature"
          label="Star Temperature"
          v-model.number="formData.starTemperature"
          unit="K"
          tooltip="Temperature of the star in Kelvin. Our sun is ~5778 K"
        />
        <!-- <NumberInput
          id="star-luminosity"
          label="Star Luminosity"
          v-model.number="formData.starLuminosity"
          unit="L☉"
          tooltip="Luminosity of the star in solar luminosities. Our sun is ~1 L☉"
        /> -->

        <NumberInput
          id="orbit"
          label="Orbit"
          v-model.number="formData.planetOrbit"
          unit="AU"
          tooltip="Distance from the star in astronomical units. Earth is ~1 AU"
        />
        <NumberInput
          id="albedo"
          label="Albedo"
          v-model.number="formData.planetAlbedo"
          unit="%"
          tooltip="Percentage of light reflected by the planet. Earth is ~37%"
        />
        <NumberInput
          id="atmosphere"
          label="Atmosphere Density"
          v-model.number="formData.planetAtmosphere"
          unit="atm"
          tooltip="Density of the atmosphere in atmospheres. Earth is ~1"
        />
      </div>
    </div>

    <HabitableResults :formData="formData" />
  </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!
// 1. Get star showing, along with orbits for planets
// 2. Get custom planet and orbit showing
// 3. Show habitable zones
// 4. Setup calculations to determine habitable zone size

// ! BUGS

// ? NOTE: Optional Improvements!
// 1. Change star color and size based on the mass and age?

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import NumberInput from "../forms/NumberInput.vue";

// import {
//   locations,
//   physicsConstants,
//   scaleConversions,
//   animationConstants,
// } from "./constants";
// import type { Location } from "./constants";

import SelectInput from "../forms/SelectInput.vue";
import HabitableResults from "./HabitableResults.vue";
//import HabitableForm from "./OLD-HabitableForm.vue";
import type { HabitableZoneForm, StarType } from "./constants";

const loading = ref(true);
const textureDir = "/textures/";

const starTypes: StarType[] = [
  { value: "G", name: "G" },
  { value: "M", name: "M" },
  { value: "K", name: "K" },
  { value: "F", name: "F" },
  { value: "A", name: "A" },
  { value: "B", name: "B" },
  { value: "O", name: "O" },
];

const formData = ref<HabitableZoneForm>({
  starMass: 1, // Multiples of Sol
  starAge: 5, // In billions of years
  starType: starTypes[0], // G, M, K, F, A, B, O
  starRadius: 1, // In solar radii
  starTemperature: 5778, // In Kelvin
  planetOrbit: 1, // In AU
  planetAlbedo: 0.37, // Percentage
  planetAtmosphere: 1, // In atmospheres
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
