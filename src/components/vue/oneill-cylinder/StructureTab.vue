<template>
  <div id="structureTab">
    <NumberInput
      id="radius"
      label="Radius"
      v-model.number="structure.radius"
      :step="0.1"
      :min="0.1"
      :max="1000000"
      description=""
      unit="km"
    />

    <NumberInput
      id="cylinderLength"
      label="Cylinder Length"
      v-model.number="structure.cylinderLength"
      :step="1"
      :min="10"
      :max="1000000"
      description=""
      unit="km"
    />

    <NumberInput
      id="surfaceGravity"
      label="Surface Gravity"
      v-model.number="structure.surfaceGravity"
      :step="0.1"
      :min="0.1"
      :max="10"
      description=""
      unit="G"
    />

    <NumberInput
      id="internalPressure"
      label="Internal Pressure"
      v-model.number="structure.internalPressure"
      :step="1"
      :min="1"
      :max="1000"
      description=""
      unit="kpa"
    />

    <SelectInput
      id="airMix"
      label="Air Mix"
      v-model="structure.airMix"
      :options="atmosphereCompositions"
    />

    <SelectInput
      id="material"
      label="Material"
      v-model="structure.material"
      :options="materials"
    />

    <NumberInput
      id="safetyFactor"
      label="Safety Factor"
      v-model.number="structure.safetyFactor"
      :step="0.1"
      :min="1"
      :max="10"
      description=""
    />

    <NumberInput
      id="shellWallThickness"
      label="Shell Wall Thickness"
      v-model.number="structure.shellWallThickness"
      :step="1"
      :min="1"
      :max="1000000"
      description=""
      unit="m"
    />

    <NumberInput
      id="minShieldingShellMass"
      label="Min Shielding Shell Mass"
      v-model.number="structure.minShieldingShellMass"
      :step="1"
      :min="1"
      :max="1000000"
      description=""
      unit="kg/m2"
    />

    <NumberInput
      id="internalStructureMass"
      label="Internal Structure Mass"
      v-model.number="structure.internalStructureMass"
      :step="1"
      :min="1"
      :max="1000000"
      description=""
      unit="kg/m2"
    />

    <SelectInput
      id="caps"
      label="Caps"
      v-model="structure.caps"
      :options="['flat', 'curved']"
    />
  </div>
</template>
<script setup lang="ts">
import { defineProps, ref, computed } from "vue";

import type {
  AtmosphereComposition,
  StationMaterial,
  Structure,
} from "./types";
import { atmosphereCompositions, materials } from "./constants";

import NumberInput from "../forms/NumberInput.vue";
import SelectInput from "../forms/SelectInput.vue";

const props = defineProps<{
  structure: Structure;
}>();
</script>
