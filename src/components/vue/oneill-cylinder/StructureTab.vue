<template>
	<div id="structureTab" class="py-2">
		<NumberInput
			id="radius"
			label="Radius"
			v-model="model.radius"
			:step="0.05"
			:min="0.05"
			:max="1000000"
			unit="km"
		/>

		<NumberInput
			id="cylinderLength"
			label="Cylinder Length"
			v-model="model.cylinderLength"
			:step="0.05"
			:min="0.05"
			:max="1000000"
			:description="`Max Passive Stability: ${formatNumber(
				maxPassiveStabilty,
			)} km`"
			unit="km"
		/>

		<SelectInput
			id="material"
			label="Material"
			v-model="model.material"
			:options="materials"
			:description="`Tensile Strength: ${formatNumber(
				structureTensileStrength,
				2,
			)} MPa`"
		/>

		<NumberInput
			id="safetyFactor"
			label="Safety Factor"
			v-model="model.safetyFactor"
			:step="0.1"
			:min="1"
			:max="10"
			description=""
		/>

		<!-- <NumberInput
			id="surfaceGravity"
			label="Surface Gravity"
			v-model="model.surfaceGravity"
			:step="0.1"
			:min="0.1"
			:max="100"
			:description="`RPM: ${rpm}<br />Inner Gravity: ${formatNumber(
				upperLevelGravity,
			)}G`"
			unit="G"
		/> -->

		<NumberInput
			id="internalPressure"
			label="Internal Air Pressure"
			v-model="model.internalPressure"
			:step="1"
			:min="20"
			:max="1200"
			:description="`${requiredO2}% O2 required`"
			tooltip="Min: 20 kPa. Max: 1200 kPa. 1 Atmosphere ~101 kPa"
			unit="kpa"
		/>

		<div class="alert alert-warning" v-if="model.internalPressure < 65">
			<strong>Warning:</strong> The internal pressure is low.
		</div>
		<div
			class="alert alert-warning"
			v-else-if="model.internalPressure > 202"
		>
			<strong>Warning:</strong> The internal pressure is high.
		</div>

		<!-- <NumberInput
      id="internalTemperature"
      label="Internal Temperature"
      v-model.number="structure.internalTemperature"
      :step="1"
      :min="-273"
      :max="1000"
      description=""
      tooltip=""
      unit="C"
    /> -->

		<!-- <SelectInput
      id="airMix"
      label="Air Mix"
      v-model="structure.airMix"
      :options="atmosphereCompositions"
      :description="`${requiredO2}% O2 required`"
    /> -->

		<NumberInput
			id="shellWallThickness"
			:key="shellKey"
			label="Shell Wall Thickness"
			v-model="model.shellWallThickness"
			:step="1"
			:min="1"
			:max="maxShellThickness"
			:description="`Required Thickness: ${formatNumber(
				requiredThickness,
			)}m`"
			unit="m"
		/>

		<div class="alert alert-danger" v-if="shellTooThin">
			<strong>Warning:</strong> The shell wall is too thin.
		</div>
		<div class="alert alert-danger" v-else-if="shellTooThick">
			<strong>Warning:</strong> The shell wall is too thick
		</div>

		<!-- <NumberInput
      id="minShieldingShellMass"
      label="Min Shielding Shell Mass"
      v-model.number="structure.minShieldingShellMass"
      :step="1"
      :min="1"
      :max="1000000"
      description=""
      unit="kg/m<sup>2</sup>"
    /> -->

		<NumberInput
			id="internalStructureMass"
			label="Internal Structure Mass"
			v-model="model.internalStructureMass"
			:step="1"
			:min="1"
			:max="1000000"
			description=""
			unit="kg/m<sup>2</sup>"
		/>

		<SelectInput
			id="caps"
			label="Caps"
			v-model="model.caps"
			:options="structureCaps"
		/>
	</div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { IInternalFloors, IStructure } from './types';
import { materials, structureCaps } from './constants';

import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import { formatNumber, physicsConstants, roundToDecimal } from '../utils';
import { calcG_Accel, calcSpinRads } from './functions';

const model = defineModel<IStructure>({ required: true });
const props = defineProps<{
	internal: IInternalFloors;
}>();

const emit = defineEmits(['update:modelValue']);

// Handle special case for radius updates
watch(
	() => model.value.radius,
	(newRadius) => {
		if (maxShellThickness.value < model.value.shellWallThickness) {
			model.value = {
				...model.value,
				shellWallThickness: maxShellThickness.value,
			};
			shellKey.value++;
		}
	},
);

const shellKey = ref(0);

// function updateStructure(field: keyof IStructure, value: any) {
// 	// Handle special case for radius updates
// 	if (field === 'radius') {
// 		const maxShellThickness = (value / 2) * 1000;
// 		if (maxShellThickness < model.value.shellWallThickness) {
// 			model.value.shellWallThickness = maxShellThickness;
// 			shellKey.value++;
// 		}
// 	}
// }

const maxPassiveStabilty = computed(() => {
	// DataStruc!C2*2*3/4
	const result = (model.value.radius * 2 * 3) / 4;
	return result;
});

const cylinderLength = computed(() => {
	return model.value.cylinderLength * 1000;
});

const structureTensileStrength = computed(() => {
	return model.value.material.tensileStrength / model.value.safetyFactor;
});

const requiredO2 = computed(() => {
	const stdO2AdjustedToPressure = 21210; // TODO: Magic number based on standard pressure of 101 kPa
	const ratio =
		(1 / (model.value.internalPressure * 1000)) * stdO2AdjustedToPressure;
	const result = Math.min(ratio, 1) * 100; //return as percentage
	return formatNumber(result);
});

const addedShielding = computed<number>(() => {
	const shellMaterialMass =
		model.value.shellWallThickness * model.value.material.density; // kg/m2
	return model.value.minShieldingShellMass > shellMaterialMass
		? model.value.minShieldingShellMass - shellMaterialMass
		: 0;
});

const innerRadius = computed(() => {
	return model.value.radius * 1000 - model.value.shellWallThickness;
});

const spinRads = computed(() => {
	const { radius, surfaceGravity } = model.value;

	const result = calcSpinRads(radius, surfaceGravity);

	return roundToDecimal(result, 4);
});

const G_Accel = computed(() => {
	return calcG_Accel(model.value.radius, spinRads.value);
});

// const rpm = computed(() => {
// 	const { radius, surfaceGravity } = model.value;

// 	const radiusM = radius * 1000;

// 	const soilDensity = 1500; //TODO: Do we really need this value?
// 	const wallDepth =
// 		addedShielding.value / soilDensity + model.value.shellWallThickness;

// 	const result =
// 		Math.sqrt(G_Accel.value / (radiusM - wallDepth)) *
// 		physicsConstants.radiansPerSecToRpm;

// 	return formatNumber(result);
// });

const shellWallThicknessMultiplier = computed(() => {
	return model.value.shellWallThickness > model.value.radius * 1000 ? 0 : 1;
});

const totalWallForce = computed(() => {
	const internalPressure = model.value.internalPressure * 1000; // kPa to Pa
	const forceOnM1perM2 =
		(addedShielding.value + model.value.internalStructureMass) *
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
	const C8 = model.value.material.density;
	const C10 = model.value.material.poissonRatio;
	const C11 = spinRads.value;
	const C3 = innerRadius.value;
	const C4 = model.value.radius * 1000;

	const result =
		((C8 * C11 ** 2) / 4) *
		(1 - C10) *
		((1 - 2 * C10) * C3 ** 2 + (3 - 2 * C10) * C4 ** 2);

	return result;
});

// σr1_max
const tensileRadialStress = computed(() => {
	// =C8*C11^2*(3-2*C10)/8*(1-C10)*((C4^2-C3^2))
	const C8 = model.value.material.density;
	const C10 = model.value.material.poissonRatio;
	const C11 = spinRads.value;
	const C3 = innerRadius.value;
	const C4 = model.value.radius * 1000;

	const result =
		((C8 * C11 ** 2 * (3 - 2 * C10)) / 8) * (1 - C10) * (C4 ** 2 - C3 ** 2);

	return result;
});

// σr2
const hoopStress = computed(() => {
	// =C5* C3/C2
	const C5 = model.value.internalPressure * 1000; // kPa to Pa
	const C3 = innerRadius.value;
	const C2 = model.value.shellWallThickness;

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
	const result = model.value.shellWallThickness * hoopStressPercent.value;
	return result;
});

const shellTooThin = computed(() => {
	// (C12<D12,K6,K7)

	return requiredThickness.value > model.value.shellWallThickness;
});

// TODO: Left in place for now, but not used.
const shellTooThick = computed(() => {
	return false; // requiredThickness.value < model.value.shellWallThickness;
});

const maxShellThickness = computed(() => {
	const result = (model.value.radius / 2) * 1000;
	return result;
});
</script>
