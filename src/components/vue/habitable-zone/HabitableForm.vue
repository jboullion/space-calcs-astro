<template>
  <div id="habitable__form" class="col-lg-4">
    <div class="calc-form mb-5 p-2 bg-light rounded border">
      <NumberInput
        id="star-mass"
        label="Star Mass"
        v-model="formData.starMass"
        @update:modelValue="updateOrbits"
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
  emit("update:modelValue", props.formData);
};
</script>
