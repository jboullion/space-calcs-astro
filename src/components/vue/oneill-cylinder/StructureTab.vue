<template>
  <div id="structureTab" class="py-2">
    <NumberInput
      id="radius"
      label="Radius"
      v-model.number="structure.radius"
      :step="0.1"
      :min="0.1"
      :max="1000000"
      unit="km"
    />

    <NumberInput
      id="cylinderLength"
      label="Cylinder Length"
      v-model.number="structure.cylinderLength"
      :step="1"
      :min="10"
      :max="1000000"
      :description="`Max Passive Stability: ${formatNumber(
        maxPassiveStabilty
      )} km`"
      unit="km"
    />

    <SelectInput
      id="material"
      label="Material"
      v-model="structure.material"
      :options="materials"
      :description="`Tensile Strength: ${formatNumber(
        structureTensileStrength,
        2
      )} MPa`"
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
      id="surfaceGravity"
      label="Surface Gravity"
      v-model.number="structure.surfaceGravity"
      :step="0.1"
      :min="0.1"
      :max="10"
      :description="`RPM: ${rpm}<br />Inner Gravity: ${formatNumber(
        upperLevelGravity
      )}G`"
      unit="G"
    />

    <NumberInput
      id="internalPressure"
      label="Internal Air Pressure"
      v-model.number="structure.internalPressure"
      :step="1"
      :min="20"
      :max="1200"
      :description="`${requiredO2}% O2 required`"
      tooltip="Min: 20 kPa. Max: 1200 kPa. 1 Atmosphere ~101 kPa"
      unit="kpa"
    />

    <div class="alert alert-warning" v-if="structure.internalPressure < 65">
      <strong>Warning:</strong> The internal pressure is low.
    </div>
    <div
      class="alert alert-warning"
      v-else-if="structure.internalPressure > 202"
    >
      <strong>Warning:</strong> The internal pressure is high.
    </div>

    <NumberInput
      id="internalTemperature"
      label="Internal Temperature"
      v-model.number="structure.internalTemperature"
      :step="1"
      :min="-273"
      :max="1000"
      description=""
      tooltip=""
      unit="C"
    />

    <!-- <SelectInput
      id="airMix"
      label="Air Mix"
      v-model="structure.airMix"
      :options="atmosphereCompositions"
      :description="`${requiredO2}% O2 required`"
    /> -->

    <NumberInput
      id="shellWallThickness"
      label="Shell Wall Thickness"
      v-model.number="structure.shellWallThickness"
      :step="1"
      :min="1"
      :max="structure.radius * 1000"
      :description="`Required Thickness: ${formatNumber(requiredThickness)}m`"
      unit="m"
    />

    <div class="alert alert-danger" v-if="shellTooThin">
      <strong>Warning:</strong> The shell wall is too thin.
    </div>
    <div class="alert alert-danger" v-else-if="shellTooThick">
      <strong>Warning:</strong> The shell wall is too thick
    </div>

    <NumberInput
      id="minShieldingShellMass"
      label="Min Shielding Shell Mass"
      v-model.number="structure.minShieldingShellMass"
      :step="1"
      :min="1"
      :max="1000000"
      description=""
      unit="kg/m<sup>2</sup>"
    />

    <NumberInput
      id="internalStructureMass"
      label="Internal Structure Mass"
      v-model.number="structure.internalStructureMass"
      :step="1"
      :min="1"
      :max="1000000"
      description=""
      unit="kg/m<sup>2</sup>"
    />

    <SelectInput
      id="caps"
      label="Caps"
      v-model="structure.caps"
      :options="structureCaps"
    />
  </div>
</template>
<script setup lang="ts">
import { defineProps, computed } from "vue";

import type { InternalFloors, Structure } from "./types";
import { materials, structureCaps } from "./constants";

import NumberInput from "../forms/NumberInput.vue";
import SelectInput from "../forms/SelectInput.vue";
import { formatNumber, physicsConstants, roundToDecimal } from "../utils";
import { calcG_Accel, calcSpinRads } from "./functions";

const props = defineProps<{
  structure: Structure;
  internal: InternalFloors;
}>();

const maxPassiveStabilty = computed(() => {
  // DataStruc!C2*2*3/4
  const result = (props.structure.radius * 2 * 3) / 4;
  return result;
});

const cylinderLength = computed(() => {
  return props.structure.cylinderLength * 1000;
});

const structureTensileStrength = computed(() => {
  return (
    props.structure.material.tensileStrength / props.structure.safetyFactor
  );
});

const requiredO2 = computed(() => {
  const stdO2AdjustedToPressure = 21210; // TODO: Magic number based on standard pressure of 101 kPa
  const ratio =
    (1 / (props.structure.internalPressure * 1000)) * stdO2AdjustedToPressure;
  const result = Math.min(ratio, 1) * 100; //return as percentage
  return formatNumber(result);
});

const addedShielding = computed<number>(() => {
  const shellMaterialMass =
    props.structure.shellWallThickness * props.structure.material.density; // kg/m2
  return props.structure.minShieldingShellMass > shellMaterialMass
    ? props.structure.minShieldingShellMass - shellMaterialMass
    : 0;
});

const innerRadius = computed(() => {
  return props.structure.radius * 1000 - props.structure.shellWallThickness;
});

const spinRads = computed(() => {
  const { radius, surfaceGravity } = props.structure;

  const result = calcSpinRads(radius, surfaceGravity);

  return roundToDecimal(result, 4);
});

const G_Accel = computed(() => {
  return calcG_Accel(props.structure.radius, spinRads.value);
});

const rpm = computed(() => {
  const { radius, surfaceGravity } = props.structure;

  const radiusM = radius * 1000;

  const soilDensity = 1500; //TODO: Do we really need this value?
  const wallDepth =
    addedShielding.value / soilDensity + props.structure.shellWallThickness;

  const result =
    Math.sqrt(G_Accel.value / (radiusM - wallDepth)) *
    physicsConstants.radiansPerSecToRpm;

  return formatNumber(result);
});

const shellWallThicknessMultiplier = computed(() => {
  return props.structure.shellWallThickness > props.structure.radius * 1000
    ? 0
    : 1;
});

const totalWallForce = computed(() => {
  const internalPressure = props.structure.internalPressure * 1000; // kPa to Pa
  const forceOnM1perM2 =
    (addedShielding.value + props.structure.internalStructureMass) *
    G_Accel.value;

  return internalPressure + forceOnM1perM2;
});

const drumStress = computed(() => {
  // = C19+C17+C18
  //return formatNumber(result);
});

// σt_max
const tensileTangentialStress = computed(() => {
  // =(C8*C11^2/4)*(1-C10)*((1-2*C10)*C3^2+(3-2*C10)*C4^2)
  const C8 = props.structure.material.density;
  const C10 = props.structure.material.poissonRatio;
  const C11 = spinRads.value;
  const C3 = innerRadius.value;
  const C4 = props.structure.radius * 1000;

  const result =
    ((C8 * C11 ** 2) / 4) *
    (1 - C10) *
    ((1 - 2 * C10) * C3 ** 2 + (3 - 2 * C10) * C4 ** 2);

  return result;
});

// σr1_max
const tensileRadialStress = computed(() => {
  // =C8*C11^2*(3-2*C10)/8*(1-C10)*((C4^2-C3^2))
  const C8 = props.structure.material.density;
  const C10 = props.structure.material.poissonRatio;
  const C11 = spinRads.value;
  const C3 = innerRadius.value;
  const C4 = props.structure.radius * 1000;

  const result =
    ((C8 * C11 ** 2 * (3 - 2 * C10)) / 8) * (1 - C10) * (C4 ** 2 - C3 ** 2);

  return result;
});

// σr2
const hoopStress = computed(() => {
  // =C5* C3/C2
  const C5 = props.structure.internalPressure * 1000; // kPa to Pa
  const C3 = innerRadius.value;
  const C2 = props.structure.shellWallThickness;

  const result = (C5 * C3) / C2;
  return result;
});

const totalTensileStress = computed(() => {
  const result =
    tensileTangentialStress.value +
    tensileRadialStress.value +
    hoopStress.value;
  return result;
});

const hoopStressPercent = computed(() => {
  const result =
    (1 / structureTensileStrength.value) *
    (totalTensileStress.value / 1000000) *
    shellWallThicknessMultiplier.value;

  return result;
});

const requiredThickness = computed(() => {
  const result = props.structure.shellWallThickness * hoopStressPercent.value;
  return result;
});

const shellTooThin = computed(() => {
  // (C12<D12,K6,K7)

  return requiredThickness.value > props.structure.shellWallThickness;
});

// TODO: Left in place for now, but not used.
const shellTooThick = computed(() => {
  return false; // requiredThickness.value < props.structure.shellWallThickness;
});

const levelsRadius = computed(() => {
  const result =
    innerRadius.value -
    props.internal.levelHeight * props.internal.levels +
    props.internal.levelHeight;

  // console.log("CW8 internalRadius", result);

  return result;
});

const upperLevelGravity = computed(() => {
  // =if(C22=0,0,InterFloors!C24)/DataStruc!C28

  const upperGravity = Math.pow(spinRads.value, 2) * levelsRadius.value;

  const result =
    props.internal.levels == 0 ? 0 : upperGravity / physicsConstants.g;

  return result;
});
</script>
