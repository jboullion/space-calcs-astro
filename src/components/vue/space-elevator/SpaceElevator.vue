<template>
  <div id="space-elevator__app" class="row" v-cloak>
    <div id="space-elevator__form" class="col-lg-4">
      <div class="calc-form col-12 mb-5 px-2 rounded border">
        <SEForm :formData="formData" />
      </div>
    </div>
    <div id="space-elevator__results" class="col-lg-8 calc-form">
      <SEVisual :formData="formData" />
    </div>
  </div>
</template>
<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { ref } from "vue";

import type { SpaceElevatorForm } from "./types";

import SEForm from "./SEForm.vue";
import SEVisual from "./SEVisual.vue";

const formData = ref<SpaceElevatorForm>({
  planetRadius: 6378.14,
  planetDensity: 5514,
  planetGravity: 9.807,
  // planetMass: 5.972 * Math.pow(10, 24),
  // planetGravity: 9.807,
  planetRotation: 0.0000729211585532747,
  carSpeed: 100, //km/h
  payloadMass: 1000, //kg
});
</script>

<style></style>
