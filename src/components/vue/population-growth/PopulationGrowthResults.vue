<template>
	<div>
		<ResultTable>
			<template #title>
				<h2>Population Growth</h2>
			</template>
			<tr>
				<th>Growth Rate</th>
				<td class="text-end">{{ growthRatePercentage.toFixed(2) }}%</td>
			</tr>
			<tr>
				<th>Final Population</th>
				<td class="text-end">
					{{ formatNumber(finalPopulation, 0) }}
				</td>
			</tr>
		</ResultTable>
	</div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import ResultTable from '../forms/v2/ResultTable.vue';
import type { IPopulationGrowthForm } from './types';
import { formatNumber } from '../utils';

const props = defineProps<{
	formData: IPopulationGrowthForm;
}>();

const growthRate = computed(() => {
	return props.formData.birthRate - props.formData.deathRate;
});

const growthRatePercentage = computed(() => {
	return growthRate.value * 100;
});

const finalPopulation = computed(() => {
	return (
		props.formData.initialPopulation *
		Math.pow(1 + growthRate.value, props.formData.years)
	);
});
</script>
