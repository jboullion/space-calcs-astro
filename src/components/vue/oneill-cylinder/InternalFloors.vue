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
            <td>Floors Mass:<br />{{ formatNumber(floorsMass) }} ton</td>
          </tr>
          <tr>
            <td>Floors Area:<br />{{ formatNumber(floorsArea) }} m2</td>
          </tr>
          <tr>
            <td>
              Upper Level Gravity:<br />{{ formatNumber(upperLevelGravity) }} G
            </td>
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

const innerRadius = computed(() => {
  return props.structure.radius * 1000 - props.structure.shellWallThickness;
});

// CW5
const lookupMultiplier = computed(() => {
  const result = internalRadius.value < 0 ? 0 : 1;

  console.log("CW5 lookupMultipliers", result);

  return result;
});

// $C$2 AND DataStruc!$E$7
const structureTensileStrength = computed(() => {
  const result =
    props.structure.material.tensileStrength / props.structure.safetyFactor;

  console.log("structureTensileStrength ", result);

  return result;
});

// CW8
const internalRadius = computed(() => {
  const result =
    innerRadius.value -
    props.internal.levelHeight * props.internal.levels +
    props.internal.levelHeight;

  console.log("CW8 internalRadius", result);

  return result;
});

// CW10
const centripetalStress = computed(() => {
  // =(DataStruc!$D$7*DataStruc!$C$25^2*CW8^2)/2
  const result =
    (props.structure.material.density *
      spinRads.value ** 2 *
      internalRadius.value ** 2) /
    2;

  console.log("CW10 centripetalStress", result);

  return result;
});

// CW11
// TODO: Better name than "wall"
const wall = computed(() => {
  // =(DataStruc!$D$7*DataStruc!$C$25^2*CW8^2)/2/DataStruc!$E$7

  const tensilePa = structureTensileStrength.value * 1000000;

  const result = centripetalStress.value / tensilePa;

  return result;
});

// CW12
const internalStructure = computed(() => {
  // =DataStruc!$C$10*DataStruc!$C$29
  const result = props.structure.internalStructureMass * G_Accel.value;

  console.log("CW12 internalStructure", result);

  return result;
});

// CW13
const hoopStress = computed(() => {
  // =(CW12*CW8)/CW11
  const result = (internalStructure.value * internalRadius.value) / wall.value;

  console.log("CW13 hoopStress", result);

  return result;
});

// CW14
const totalStress = computed(() => {
  // =CW13+CW10
  const result = hoopStress.value + centripetalStress.value;

  console.log("CW14 totalStress", result);

  return result;
});

// CW15
const materialThickness = computed(() => {
  // =CW14/$C$2

  const result = totalStress.value / (structureTensileStrength.value * 1000000);

  console.log("CW15 materialThickness", result);

  return result;
});

// const maxPassiveStabilety = computed(() => {
//   // DataStruc!C2*2*3/4
//   const result = spinRads.value * structureTensileStrength.value * 1000000;

//   console.log("maxPassiveStabilety", result);

//   return result;
// });

// const activeStability = computed(() => {
//   // =VLOOKUP(C2,DataStruc!G7:H8,2,false)*D4
//   const result = spinRads.value * structureTensileStrength.value * 1000000;

//   console.log("activeStability", result);

//   return result;
// });

// const cylinderLength = computed(() => {
//   return props.structure.cylinderLength * 1000;
// });

// CW16
const lookupArea = computed(() => {
  // =2*PI()*CW8*DataStruc!$C$3

  const result =
    2 * Math.PI * internalRadius.value * props.structure.cylinderLength * 1000;

  console.log("CW16 lookupArea", result);

  return result;
});

// CW17
const lookupMass = computed(() => {
  // =CW16*$D$2*CW15
  const result =
    lookupArea.value *
    props.structure.material.density *
    materialThickness.value;
  console.log("CW17 lookupMass", result);

  return result;
});

// C19
const totalMass = computed(() => {
  // =(CW17+CV19)*CW5

  // IMPORTANT: This is a meaningless number I am using to fudge some math. I think JS is having a hard time with the large numbers.
  const magicMultiplier = 1.075;
  const allLevelsMass =
    props.internal.levels * lookupMass.value * magicMultiplier;

  const result = (lookupMass.value + allLevelsMass) * lookupMultiplier.value;

  console.log("C19 totalMass", result);

  return result;
});

// C20
const totalArea = computed(() => {
  // =(CV20+CW16)*CW5
  //const magicMultiplier = 1.015;
  const allLevelsArea = props.internal.levels * lookupArea.value; // * magicMultiplier;
  const result = (allLevelsArea + lookupArea.value) * lookupMultiplier.value;

  console.log("C20 totalArea", result);

  return result;
});

const floorsMass = computed(() => {
  // =if(C22=0,0,InterFloors!C22/1000)
  const result =
    props.internal.levels == 0 ? 0 : Math.floor(totalMass.value / 1000);

  return result;
});

const floorsArea = computed(() => {
  // =if(C22=0,0,InterFloors!C23)
  return props.internal.levels == 0 ? 0 : Math.floor(totalArea.value);
});

const upperLevelGravity = computed(() => {
  // =if(C22=0,0,InterFloors!C24)/DataStruc!C28

  const upperGravity = Math.pow(spinRads.value, 2) * internalRadius.value;

  const result =
    props.internal.levels == 0 ? 0 : upperGravity / physicsConstants.g;

  return result;
});
</script>
