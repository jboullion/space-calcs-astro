<template>
	<div class="population-pyramid">
		<div class="d-flex align-items-center mb-3">
			<div class="d-flex gap-2 align-items-center w-100">
				<input
					type="range"
					class="form-range flex-grow-1"
					v-model.number="currentYear"
					:min="1"
					:max="formData.years"
					:step="1"
				/>
				<h3 class="mb-0 text-nowrap">Year {{ currentYear }}</h3>
			</div>
		</div>

		<svg :viewBox="`0 0 ${width} ${height}`" class="w-full">
			<!-- Center line -->
			<line
				:x1="width / 2"
				:y1="0"
				:x2="width / 2"
				:y2="height"
				stroke="#ccc"
				stroke-width="1"
			/>

			<!-- Male bars (left side) -->
			<rect
				v-for="(group, i) in reversedPopulationData"
				:key="`male-${i}`"
				:x="width / 2 - group.male * scale"
				:y="i * barHeight + labelPadding / 2"
				:width="group.male * scale"
				:height="barHeight - 1 - labelPadding"
				fill="#2563eb"
				opacity="0.7"
			>
				<title>
					Males: {{ Math.round(group.male).toLocaleString() }}
				</title>
			</rect>

			<!-- Female bars (right side) -->
			<rect
				v-for="(group, i) in reversedPopulationData"
				:key="`female-${i}`"
				:x="width / 2"
				:y="i * barHeight + labelPadding / 2"
				:width="group.female * scale"
				:height="barHeight - 1 - labelPadding"
				fill="#db2777"
				opacity="0.7"
			>
				<title>
					Females: {{ Math.round(group.female).toLocaleString() }}
				</title>
			</rect>

			<!-- Axis labels in dedicated space -->
			<text
				:x="width * 0.25"
				:y="height"
				text-anchor="middle"
				class="text-sm fill-gray-600"
				fill="white"
			>
				Males
			</text>
			<text
				:x="width * 0.75"
				:y="height"
				text-anchor="middle"
				class="text-sm fill-gray-600"
				fill="white"
			>
				Females
			</text>

			<!-- Age group labels -->
			<text
				v-for="(group, i) in reversedPopulationData"
				:key="`label-${i}`"
				:x="width / 2"
				:y="i * barHeight + barHeight / 2"
				text-anchor="middle"
				alignment-baseline="middle"
				class="text-xs"
				fill="white"
			>
				{{ group.ageGroup }}
			</text>
		</svg>
	</div>
</template>

<script setup lang="ts">
// TODO:

// 1. Add a slider to control the year
// 2. Add a button to play/pause the simulation
// 3. Add a button to reset the simulation
// 4. Display the number of people in each age group

import { computed, ref, watch, onUnmounted } from 'vue';
import type { IPopulationGrowthForm } from './types';

const props = defineProps<{
	formData: IPopulationGrowthForm;
}>();

const ageGroupSize = 10;

const simulatedData = ref<
	Array<{
		year: number;
		distribution: number[];
		total: number;
	}>
>([]);

// Constants
const width = 800;
const barHeight = 60;
const labelHeight = 40;
const labelPadding = 10;
const currentYear = ref(1);

// Computed values
const numGroups = computed(() => {
	return Math.ceil((props.formData.lifeExpectancy || 80) / ageGroupSize);
});

// Get current distribution based on simulation year
const currentDistribution = computed(() => {
	if (!simulatedData.value || simulatedData.value.length === 0) {
		return {
			distribution: props.formData.initialAgeDistribution,
			total: props.formData.initialPopulation,
		};
	}
	const currentData =
		simulatedData.value[currentYear.value] || simulatedData.value[0];
	return {
		distribution: currentData.distribution,
		total: currentData.total,
	};
});

// Transform input data into population pyramid data
const populationData = computed(() => {
	return currentDistribution.value.distribution.map(
		(percentage: number, i: number) => {
			const totalInGroup =
				(percentage / 100) * currentDistribution.value.total;
			return {
				ageGroup: `${i * ageGroupSize}-${(i + 1) * ageGroupSize - 1}`,
				male: totalInGroup * 0.49,
				female: totalInGroup * 0.51,
			};
		},
	);
});

// Reverse the data for display (oldest at top)
const reversedPopulationData = computed(() => {
	return [...populationData.value].reverse();
});

// Calculate scale based on maximum value
const scale = computed(() => {
	const maxValue = Math.max(
		...populationData.value.flatMap((d) => [d.male, d.female]),
	);
	return width / 2 / maxValue;
});

const height = computed((): number => {
	// add another numgroup to account for labels
	const calcHeight = (numGroups.value + 1) * (barHeight + labelPadding);
	return calcHeight;
});
</script>

<style scoped>
.population-pyramid {
	width: 100%;
	max-width: 800px;
	margin: 0 auto;
}

/* Smooth transitions for updates */
rect {
	transition: all 0.3s ease;
}
</style>
