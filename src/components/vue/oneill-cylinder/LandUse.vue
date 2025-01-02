<template>
	<div id="landAllocation" class="py-2">
		<NumberInput
			id="urbanDensity"
			label="Urban Density"
			v-model.number="model.landUse.urbanDensity"
			:step="1"
			:min="1"
			:max="100"
			:description="`${formatNumber(urbanArea)} km²`"
			unit="%"
		/>

		<NumberInput
			id="agriculturalDensity"
			label="Agricultural Density"
			v-model.number="model.landUse.agriculturalDensity"
			:step="1"
			:min="1"
			:max="100"
			:description="`${formatNumber(agriculturalArea)} km²`"
			unit="%"
		/>

		<NumberInput
			id="industrialDensity"
			label="Industrial Density"
			v-model.number="model.landUse.industrialDensity"
			:step="1"
			:min="1"
			:max="100"
			:description="`${formatNumber(industrialArea)} km²`"
			unit="%"
		/>

		<SelectInput
			id="urbanDensityExample"
			label="Urban Density Example"
			v-model="model.landUse.urbanDensityExample"
			:options="populationDensityExamples"
			:description="`${formatNumber(
				model.landUse.urbanDensityExample.popKm2,
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
import type { ILandUse, ONeillCylinderForm } from './types';
import { populationDensityExamples } from './constants';
import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import { formatNumber } from '../utils';
import { useStationCalculations } from './composables/useStationCalculations';

const model = defineModel<ONeillCylinderForm>({ required: true });

const props = defineProps<{
	totalArea?: number;
}>();

const {
	urbanPopulation,
	unusedArea,
	urbanArea,
	agriculturalArea,
	industrialArea,
} = useStationCalculations(model.value);
</script>
