<template>
  <div id="internalFloors">
    <NumberInput
      id="levelHeight"
      label="Level Height"
      v-model.number="internal.levelHeight"
      :step="1"
      :min="10"
      :max="100"
      description="Min: 10m, Maximum: 100m"
      unit="m"
    />

    <NumberInput
      id="levels"
      label="Levels"
      v-model.number="internal.levels"
      :step="1"
      :min="1"
      :max="maxLevels"
      :description="`Max Levels: ${maxLevels}`"
    />

    <SelectInput
      id="floorMaterial"
      label="Floor Material"
      v-model="internal.floorMaterial"
      :options="materials"
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, computed } from "vue";

import NumberInput from "../forms/NumberInput.vue";
import SelectInput from "../forms/SelectInput.vue";

import type { InternalFloors, Structure } from "./types";
import { materials } from "./constants";

const props = defineProps<{
  internal: InternalFloors;
  structure: Structure;
}>();

const maxLevels = computed(() => {
  //const defaultMax = 100;

  return Math.floor(
    (props.structure.radius * 1000) / props.internal.levelHeight
  );
});
</script>
