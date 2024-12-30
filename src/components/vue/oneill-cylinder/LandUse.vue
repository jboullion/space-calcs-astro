<template>
	<div id="landAllocation" class="py-2">
		<NumberInput
			id="urbanDensity"
			label="Urban Density"
			v-model.number="landUse.urbanDensity"
			:step="1"
			:min="1"
			:max="100"
			:description="`${formatNumber(urbanArea)} km²`"
			unit="%"
		/>

		<NumberInput
			id="agriculturalDensity"
			label="Agricultural Density"
			v-model.number="landUse.agriculturalDensity"
			:step="1"
			:min="1"
			:max="100"
			:description="`${formatNumber(agriculturalArea)} km²`"
			unit="%"
		/>

		<NumberInput
			id="industrialDensity"
			label="Industrial Density"
			v-model.number="landUse.industrialDensity"
			:step="1"
			:min="1"
			:max="100"
			:description="`${formatNumber(industrialArea)} km²`"
			unit="%"
		/>

		<SelectInput
			id="urbanDensityExample"
			label="Urban Density Example"
			v-model="landUse.urbanDensityExample"
			:options="populationDensityExamples"
			:description="`${formatNumber(
				landUse.urbanDensityExample.popKm2,
			)} people / km²`"
		/>

		<div v-if="unusedArea > 0" class="alert alert-info mt-3">
			Unused Area: {{ formatNumber(unusedArea) }} km²
		</div>

		<div v-if="unusedArea < 0" class="alert mt-3 alert-danger">
			Overused Area: {{ formatNumber(unusedArea) }} km²
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ILandUse } from './types';
import { populationDensityExamples } from './constants';
import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import { formatNumber } from '../utils';

const props = defineProps<{
	landUse: ILandUse;
	totalArea?: number;
}>();

// Total usable area calculations
const totalUsableArea = computed(() => props.totalArea || 0);

// Area calculations
const urbanArea = computed(
	() => (totalUsableArea.value * props.landUse.urbanDensity) / 100,
);
const agriculturalArea = computed(
	() => (totalUsableArea.value * props.landUse.agriculturalDensity) / 100,
);
const industrialArea = computed(
	() => (totalUsableArea.value * props.landUse.industrialDensity) / 100,
);

// Unused area calculation
const unusedArea = computed(() => {
	const used =
		props.landUse.urbanDensity +
		props.landUse.agriculturalDensity +
		props.landUse.industrialDensity;
	return totalUsableArea.value * (1 - used / 100);
});

// Population calculations
const urbanPopulation = computed(() => {
	return Math.floor(
		urbanArea.value * props.landUse.urbanDensityExample.popKm2,
	);
});
</script>
