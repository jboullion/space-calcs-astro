<template>
	<div>
		<ResultTable>
			<template #title>
				<h2>Population Growth</h2>
			</template>
			<tr>
				<th>Birth Rate</th>
				<td class="text-end">
					{{ (calculateBirthRate * 100).toFixed(2) }}%
				</td>
			</tr>
			<tr>
				<th>Death Rate</th>
				<td class="text-end">
					{{ (calculateDeathRate * 100).toFixed(2) }}%
				</td>
			</tr>
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

const calculateBirthRate = computed(() => {
	const femaleRatio = 0.5;

	// Simple birth rate calculation based on children per woman over lifetime
	return (
		(femaleRatio * props.formData.childrenPerWoman) /
		props.formData.lifeExpectancy
	);
});

const calculateDeathRate = computed(() => {
	// Base death rate from life expectancy
	const baseDeathRate = 1 / props.formData.lifeExpectancy;

	return baseDeathRate;
});

const growthRate = computed(() => {
	return calculateBirthRate.value - calculateDeathRate.value;
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
