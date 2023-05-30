<template>
  <div>
    <h2>Results</h2>
    <div>
      <table class="table">
        <thead class="cursor-pointer">
          <tr @click="showArea = !showArea">
            <th class="bg-dark text-white" colspan="2">Area</th>
          </tr>
        </thead>
        <tbody v-show="showArea">
          <tr>
            <td>Shell Floor Area</td>
            <td class="text-end">
              {{ formatNumber(shellFloorArea) }} km<sup>2</sup>
            </td>
          </tr>
          <tr>
            <td>Internal Floors Area</td>
            <td class="text-end">
              {{ formatNumber(floorsArea) }} km<sup>2</sup>
            </td>
          </tr>
          <tr>
            <th>Total Floor Area</th>
            <th class="text-end">
              {{ formatNumber(totalFloorArea) }} km<sup>2</sup>
            </th>
          </tr>
        </tbody>
      </table>

      <table class="table">
        <thead class="cursor-pointer">
          <tr @click="showMass = !showMass">
            <th class="bg-dark text-white" colspan="2">Mass</th>
          </tr>
        </thead>
        <tbody v-show="showMass">
          <tr>
            <td>Internal Floors Mass</td>
            <td class="text-end">{{ formatNumber(floorsMass, 0) }} ton</td>
          </tr>
          <tr>
            <td>{{ formData.structure.material.name }} Mass</td>
            <td class="text-end">
              {{ formatNumber(materialMass / 1000, 0) }} ton
            </td>
          </tr>
          <!-- <tr>
            <td>Shielding Mass</td>
            <td class="text-end">ton</td>
          </tr> -->
          <tr>
            <td>Internal Structures Mass</td>
            <td class="text-end">
              {{ formatNumber(internalStructureMass / 1000, 0) }} ton
            </td>
          </tr>
          <tr>
            <td>Air Mass</td>
            <td class="text-end">{{ formatNumber(airMass, 0) }} ton</td>
          </tr>
          <tr class="">
            <th>Total Mass</th>
            <th class="text-end">{{ formatNumber(finalTotalMass, 0) }} ton</th>
          </tr>
        </tbody>
      </table>

      <!-- <table class="table">
        <thead class="cursor-pointer">
          <tr @click="showShielding = !showShielding">
            <th class="bg-dark text-white" colspan="2">
              <i class="fa-solid fa-caret-up" v-if="showShielding"></i>
              <i class="fa-solid fa-caret-down" v-else></i> Shielding
            </th>
          </tr>
        </thead>
        <tbody v-show="showShielding">
          <tr>
            <td>Up Shielding</td>
            <td class="text-end">kg</td>
          </tr>
          <tr>
            <td>Down Shielding</td>
            <td class="text-end">kg</td>
          </tr>
          <tr>
            <td>Center Shielding</td>
            <td class="text-end">kg</td>
          </tr>
        </tbody>
      </table> -->
    </div>
  </div>
</template>
<script setup lang="ts">
import { defineProps, ref, computed } from "vue";
import type { ONeillCylinderForm } from "./types";

import { formatNumber, physicsConstants, roundToDecimal } from "../utils";
import { calcSpinRads, calcG_Accel } from "./functions";

const props = defineProps<{
  formData: ONeillCylinderForm;
}>();

const showArea = ref(true);
const showMass = ref(true);
const showShielding = ref(false);

/**
 * COMPUTED CALCUATIONS
 */
const shellFloorArea = computed(() => {
  return (
    props.formData.structure.radius *
    2 *
    Math.PI *
    props.formData.structure.cylinderLength
  );
});

const totalFloorArea = computed(() => {
  return Math.ceil(shellFloorArea.value + floorsArea.value);
});

const radiusM = computed(() => {
  return props.formData.structure.radius * 1000;
});

const cylinderLengthM = computed(() => {
  return props.formData.structure.cylinderLength * 1000;
});

const spinRads = computed(() => {
  const { radius, surfaceGravity } = props.formData.structure;

  const result = calcSpinRads(radius, surfaceGravity);

  return roundToDecimal(result, 4);
});

const G_Accel = computed(() => {
  return calcG_Accel(props.formData.structure.radius, spinRads.value);
});

const innerRadius = computed(() => {
  return radiusM.value - props.formData.structure.shellWallThickness;
});

// CW5
const lookupMultiplier = computed(() => {
  const result = internalRadius.value < 0 ? 0 : 1;

  // console.log("CW5 lookupMultipliers", result);

  return result;
});

// $C$2 AND DataStruc!$E$7
const structureTensileStrength = computed(() => {
  const result =
    props.formData.structure.material.tensileStrength /
    props.formData.structure.safetyFactor;

  // console.log("structureTensileStrength ", result);

  return result;
});

// CW8
const internalRadius = computed(() => {
  const result =
    innerRadius.value -
    props.formData.internal.levelHeight * props.formData.internal.levels +
    props.formData.internal.levelHeight;

  // console.log("CW8 internalRadius", result);

  return result;
});

// CW10
const centripetalStress = computed(() => {
  // =(DataStruc!$D$7*DataStruc!$C$25^2*CW8^2)/2
  const result =
    (props.formData.structure.material.density *
      spinRads.value ** 2 *
      internalRadius.value ** 2) /
    2;

  // console.log("CW10 centripetalStress", result);

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
  const result = props.formData.structure.internalStructureMass * G_Accel.value;

  // console.log("CW12 internalStructure", result);

  return result;
});

// CW13
const hoopStress = computed(() => {
  // =(CW12*CW8)/CW11
  const result = (internalStructure.value * internalRadius.value) / wall.value;

  // console.log("CW13 hoopStress", result);

  return result;
});

// CW14
const totalStress = computed(() => {
  // =CW13+CW10
  const result = hoopStress.value + centripetalStress.value;

  // console.log("CW14 totalStress", result);

  return result;
});

// CW15
const materialThickness = computed(() => {
  // =CW14/$C$2

  const result = totalStress.value / (structureTensileStrength.value * 1000000);

  // console.log("CW15 materialThickness", result);

  return result;
});

// CW16
const lookupArea = computed(() => {
  // =2*PI()*CW8*DataStruc!$C$3

  const result = 2 * Math.PI * internalRadius.value * cylinderLengthM.value;

  // console.log("CW16 lookupArea", result);

  return result;
});

// CW17
const lookupMass = computed(() => {
  // =CW16*$D$2*CW15
  const result =
    lookupArea.value *
    props.formData.structure.material.density *
    materialThickness.value;
  // console.log("CW17 lookupMass", result);

  return result;
});

// CW19
const totalMass = computed(() => {
  // =(CW17+CV19)*CW5

  // IMPORTANT: This is a meaningless number I am using to fudge some math.
  // TODO: We may want to dig deeper into this issue if other numbers are off.
  //const magicMultiplier = 1.075;

  const allLevelsMass = props.formData.internal.levels * lookupMass.value; // * magicMultiplier;

  const result = (lookupMass.value + allLevelsMass) * lookupMultiplier.value;

  // console.log("C19 totalMass", result);

  return result;
});

// CW20
const totalArea = computed(() => {
  // =(CV20+CW16)*CW5
  //const magicMultiplier = 1.015;
  const allLevelsArea = props.formData.internal.levels * lookupArea.value; // * magicMultiplier;
  const result = (allLevelsArea + lookupArea.value) * lookupMultiplier.value;

  // console.log("C20 totalArea", result);

  return result;
});

const floorsMass = computed(() => {
  // =if(C22=0,0,InterFloors!C22/1000)
  const result =
    props.formData.internal.levels == 0
      ? 0
      : Math.floor(totalMass.value) / 1000;

  return result;
});

const floorsArea = computed(() => {
  // =if(C22=0,0,InterFloors!C23)
  return props.formData.internal.levels == 0
    ? 0
    : Math.ceil(totalArea.value / 1000000);
});

// C34
const circumfrence = computed(() => {
  // =2*PI()*DataStruc!C2

  const result = 2 * Math.PI * radiusM.value;

  // console.log("C34 circumfrence", result);

  return result;
});

// C35
const floorArea = computed(() => {
  // =C34*DataStruc!C3

  const result = circumfrence.value * cylinderLengthM.value;

  // console.log("C35 floorArea", result);

  return result;
});

// E35
const internalFloorArea = computed(() => {
  // =C34*DataStruc!C3

  const internalCircumfrence =
    2 * Math.PI * (radiusM.value - props.formData.structure.shellWallThickness);

  const result = internalCircumfrence * cylinderLengthM.value;

  // console.log("C35 floorArea", result);

  return result;
});

// C36
const capSurfaceArea = computed(() => {
  let result = 0;

  switch (props.formData.structure.caps.value) {
    case "flat":
      // =PI()*C33^2
      result = Math.PI * radiusM.value ** 2;
      break;
    case "convex":
      // =4*PI()*$C$2^2/2
      result = (4 * Math.PI * radiusM.value ** 2) / 2;
      break;
    case "concave":
      // =4*PI()*$C$2^2/2
      result = (4 * Math.PI * radiusM.value ** 2) / 2;
      break;
  }

  // console.log("C36 capSurfaceArea", result * 2);

  return Math.ceil(result * 2);
});

// C37
const totalSurfaceArea = computed(() => {
  // =C36+C35

  const result = floorArea.value + capSurfaceArea.value;

  // console.log("C37 totalSurfaceArea", result);

  return result;
});

// C42
const materialMass = computed(() => {
  // =C37*D7*C8

  const result =
    totalSurfaceArea.value *
    props.formData.structure.material.density *
    props.formData.structure.shellWallThickness;

  return result;
});

// E42
const internalStructureMass = computed(() => {
  // =E35*C10

  const result =
    floorArea.value * props.formData.structure.internalStructureMass;

  return result;
});

// E37
const internalSurfaceArea = computed(() => {
  // =E35*2

  const result = internalFloorArea.value + capSurfaceArea.value;

  return result;
});

// Air D4
const airTemperature = computed(() => {
  // =273.15-C4

  const result = 273.15 - props.formData.structure.internalTemperature;

  return result;
});

// Air C6
const airMoles = computed(() => {
  // =C2/(C5*D4)

  const C2 = props.formData.structure.internalPressure;
  const C5 = physicsConstants.idealGasConstant;

  const result = C2 / (C5 * airTemperature.value);

  return result;
});

// Air C7
const airDensity = computed(() => {
  // =C6*VLOOKUP(UI!C8,F4:M5,8,false)

  const result = airMoles.value * props.formData.structure.airMix.molarMass;

  return result;
});

// Air C11
const airmassHeight = computed(() => {
  // =if((C2/(C7*C9))>DataStruc!D33,DataStruc!D33,(C2/(C7*C9)))

  const C2 = props.formData.structure.internalPressure;
  const C7 = airDensity.value;
  const C9 = G_Accel.value;
  const D33 = radiusM.value;

  const result = C2 / (C7 * C9) > D33 ? D33 : C2 / (C7 * C9);

  return result;
});

// Air C12
const airDensityMass = computed(() => {
  // =C11*C7

  const result = airmassHeight.value * airDensity.value;

  return result;
});

// Air C8/1000
const airMass = computed(() => {
  // =C12*C3

  const result = airDensityMass.value * internalSurfaceArea.value;

  return result;
});

const finalTotalMass = computed(() => {
  // =C42+E42+CV19

  const result =
    materialMass.value +
    internalStructureMass.value +
    //floorsMass.value +
    airMass.value;

  return result;
});
</script>
