<template>
  <div class="calc-form">
    <div
      class="btn-group w-100"
      role="group"
      aria-label="Vertical radio toggle button group"
    >
      <template v-for="(tab, index) in tabs">
        <input
          type="radio"
          class="btn-check"
          name="vbtn-radio"
          :value="tab.id"
          v-model="currentTab"
          :id="tab.id"
          autocomplete="off"
          :checked="index == 0"
        />
        <label
          class="btn btn-outline-secondary rounded-bottom-0"
          :for="tab.id"
          >{{ tab.label }}</label
        >
      </template>
    </div>

    <StructureTab
      v-show="currentTab == 'structureTab'"
      :structure="formData.structure"
    />

    <InternalFloors
      v-show="currentTab == 'internalFloors'"
      :internal="formData.internal"
      :structure="formData.structure"
    />

    <LandUse v-show="currentTab == 'landUse'" :landUse="formData.landUse" />
  </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from "vue";

import type { ONeillCylinderForm } from "./types";

import StructureTab from "./StructureTab.vue";
import InternalFloors from "./InternalFloors.vue";
import LandUse from "./LandUse.vue";

const currentTab = ref<"structureTab" | "internalFloors" | "landUse">(
  "structureTab"
);

const tabs = [
  {
    id: "structureTab",
    label: "Structure",
  },
  {
    id: "internalFloors",
    label: "Floors",
  },
  {
    id: "landUse",
    label: "Land Use",
  },
];

const props = defineProps<{
  formData: ONeillCylinderForm;
}>();

onMounted(() => {});
</script>
