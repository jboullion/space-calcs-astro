<template>
	<div id="landAllocation" class="py-2">
		<NumberInput
			id="urbanDensity"
			label="Urban Density"
			v-model.number="landUse.urbanDensity"
			:step="1"
			:min="1"
			:max="100"
			description=""
			unit="%"
		/>

		<NumberInput
			id="agriculturalDensity"
			label="Agricultural Density"
			v-model.number="landUse.agriculturalDensity"
			:step="1"
			:min="1"
			:max="100"
			description=""
			unit="%"
		/>

		<NumberInput
			id="industrialDensity"
			label="Industrial Density"
			v-model.number="landUse.industrialDensity"
			:step="1"
			:min="1"
			:max="100"
			description=""
			unit="%"
		/>

		<!-- <NumberInput
                    id="unusedDensity"
                    label="Unused Density"
                    v-model.number="formData.land.unusedDensity"
                    :step="1"
                    :min="1"
                    :max="100"
                    description=""
                    unit="%"
                  /> -->

		<SelectInput
			id="urbanDensityExample"
			label="Urban Density Example"
			v-model="landUse.urbanDensityExample"
			:options="populationDensityExamples"
		/>
	</div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';

import type { LandUse } from './types';

import { populationDensityExamples } from './constants';

import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';

const props = defineProps<{
	landUse: LandUse;
}>();
</script>
