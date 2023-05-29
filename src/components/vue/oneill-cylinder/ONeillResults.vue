<template>
  <div>
    <div>
      <table class="table">
        <thead>
          <tr>
            <th class="bg-dark text-white" colspan="2">Area</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Shell Floor Area</td>
            <td class="text-end">{{ formatNumber(shellFloorArea) }} km</td>
          </tr>
          <tr>
            <td>Total Floor Area</td>
            <td class="text-end">{{ formatNumber(totalFloorArea) }} km</td>
          </tr>
        </tbody>
      </table>

      <table class="table">
        <thead>
          <tr>
            <th class="bg-dark text-white" colspan="2">Mass</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Structure</td>
            <td class="text-end">km</td>
          </tr>
          <tr>
            <td>Material</td>
            <td class="text-end">km</td>
          </tr>
          <tr>
            <td>Sheidling</td>
            <td class="text-end">km</td>
          </tr>
          <tr>
            <td>Air Mass</td>
            <td class="text-end">km</td>
          </tr>
          <tr>
            <th>Total Mass</th>
            <td class="text-end">km</td>
          </tr>
        </tbody>
      </table>

      <table class="table">
        <thead>
          <tr>
            <th class="bg-dark text-white" colspan="2">Mass</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Shell Floor Area</td>
            <td class="text-end">{{ formatNumber(shellFloorArea) }} km</td>
          </tr>
          <tr>
            <td>Total Floor Area</td>
            <td class="text-end">{{ formatNumber(totalFloorArea) }} km</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { defineProps, ref, computed } from "vue";
import type { ONeillCylinderForm } from "./types";

import { formatNumber } from "../utils";

const props = defineProps<{
  formData: ONeillCylinderForm;
}>();

const shellFloorArea = computed(() => {
  return (
    props.formData.structure.radius *
    2 *
    Math.PI *
    props.formData.structure.cylinderLength
  );
});

const totalFloorArea = computed(() => {
  return (
    shellFloorArea.value + shellFloorArea.value * props.formData.internal.levels
  );
});
</script>
