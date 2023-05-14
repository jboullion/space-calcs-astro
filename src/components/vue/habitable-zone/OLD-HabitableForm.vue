<template>
  <div id="habitable__form" class="col-lg-4">
    <div class="calc-form mb-5 p-2 rounded border">
      <NumberInput
        id="star-mass"
        label="Star Mass"
        v-model.number="formData.starMass"
        @update:modelValue="updateOrbits"
        unit="M☉"
        tooltip="Mass of the star in solar masses. Our sun is ~1 M☉"
      />

      <NumberInput
        id="star-age"
        label="Star Age"
        v-model.number="formData.starAge"
        @update:modelValue="updateOrbits"
        unit="Gyr"
        tooltip="Age of the star in billions of years. Our sun is ~4.6 Gyrs old"
      />

      <NumberInput
        id="orbit"
        label="Orbit"
        v-model.number="formData.planetOrbit"
        @update:modelValue="updateOrbits"
        unit="AU"
        tooltip="Distance from the star in astronomical units. Earth is ~1 AU"
      />
      <NumberInput
        id="albedo"
        label="Albedo"
        v-model.number="formData.planetAlbedo"
        @update:modelValue="updateOrbits"
        unit="%"
        tooltip="Percentage of light reflected by the planet. Earth is ~37%"
      />
      <NumberInput
        id="atmosphere"
        label="Atmosphere Density"
        v-model.number="formData.planetAtmosphere"
        @update:modelValue="updateOrbits"
        unit="atm"
        tooltip="Density of the atmosphere in atmospheres. Earth is ~1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import NumberInput from "../forms/NumberInput.vue";
import type { HabitableZoneForm } from "./constants";

const emit = defineEmits<{
  (e: "update:modelValue", value: HabitableZoneForm): void;
}>();

const props = defineProps<{
  formData: HabitableZoneForm;
}>();

const updateOrbits = () => {
  console.log("updateOrbits", props.formData);
  emit("update:modelValue", props.formData);
};
</script>
