<template>
  <div id="internalFloors" class="py-2">
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

    <div class="table-wrapper">
      <table class="table">
        <tbody>
          <tr>
            <td>Floors Mass</td>
            <td class="text-end">{{ formatNumber(floorsMass) }} ton</td>
          </tr>
          <tr>
            <td>Floors Area</td>
            <td class="text-end">{{ formatNumber(floorsArea) }} m2</td>
          </tr>
          <tr>
            <td>Upper Level Gravity</td>
            <td class="text-end">{{ formatNumber(upperLevelGravity) }} G</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, computed } from "vue";

import NumberInput from "../forms/NumberInput.vue";
import SelectInput from "../forms/SelectInput.vue";

import type { InternalFloors, Structure } from "./types";
import { materials } from "./constants";

import { formatNumber, physicsConstants, roundToDecimal } from "../utils";
import { calcG_Accel, calcSpinRads } from "./functions";

const props = defineProps<{
  internal: InternalFloors;
  structure: Structure;
}>();

const maxLevels = computed(() => {
  const defaultMax = 100;

  return Math.min(
    Math.floor((props.structure.radius * 1000) / props.internal.levelHeight),
    defaultMax
  );
});

const spinRads = computed(() => {
  const { radius, surfaceGravity } = props.structure;

  const result = calcSpinRads(radius, surfaceGravity);

  return roundToDecimal(result, 4);
});

const G_Accel = computed(() => {
  return calcG_Accel(props.structure.radius, spinRads.value);
});

// CW5
const lookupMultiplier = computed(() => {
  const result = internalRadius.value < 0 ? 0 : 1;
  return result;
});

// $C$2 AND DataStruc!$E$7
const structureTensileStrength = computed(() => {
  return (
    props.structure.material.tensileStrength / props.structure.safetyFactor
  );
});

// CW8
const internalRadius = computed(() => {
  const levelsHeight = props.internal.levelHeight * props.internal.levels;
  const result = levelsHeight;
  return result;
});

// CW11
// TODO: Better name than "wall"
const wall = computed(() => {
  // =(DataStruc!$D$7*DataStruc!$C$25^2*CW8^2)/2/DataStruc!$E$7
  const result =
    (props.structure.material.density *
      spinRads.value ** 2 *
      internalRadius.value ** 2) /
    2 /
    structureTensileStrength.value;

  return result;
});

// CW12
const internalStructure = computed(() => {
  // =DataStruc!$C$10*DataStruc!$C$29
  const result = props.structure.internalStructureMass * G_Accel.value;
  return result;
});

// CW13
const hoopStress = computed(() => {
  // =(CW12*CW8)/CW11
  const result = (internalStructure.value * internalRadius.value) / wall.value;
  return result;
});

// CW14
const totalStress = computed(() => {
  // =CW13+CW10
  const result = hoopStress.value + structureTensileStrength.value;
  return result;
});

// CW15
const materialThickness = computed(() => {
  // =CW14/$C$2
  const result = totalStress.value / structureTensileStrength.value;
  return result;
});

// CW16
const lookupArea = computed(() => {
  // =2*PI()*CW8*DataStruc!$C$3
  const result =
    2 * Math.PI * internalRadius.value * props.structure.cylinderLength;
  return result;
});

// CW17
const lookupMass = computed(() => {
  // =CW16*$D$2*CW15
  const result =
    lookupArea.value *
    props.structure.material.density *
    materialThickness.value;
  return result;
});

// C19
const totalMass = computed(() => {
  // =(CW17+CV19)*CW5

  const result =
    lookupMass.value * props.internal.levels * lookupMultiplier.value;
  return result;
});

const floorsMass = computed(() => {
  const result = props.internal.levels == 0 ? 0 : totalMass.value / 1000;
  return result;
});

const floorsArea = computed(() => {
  return (
    props.internal.levelHeight *
    props.internal.levels *
    props.structure.radius *
    2 *
    Math.PI *
    props.structure.cylinderLength
  );
});

const upperLevelGravity = computed(() => {
  return (
    floorsMass.value *
    physicsConstants.g *
    (props.structure.radius * 1000) *
    2 *
    Math.PI *
    props.structure.cylinderLength
  );
});
</script>
