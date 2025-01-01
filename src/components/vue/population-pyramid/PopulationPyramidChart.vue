<template>
	<div class="population-pyramid">
		<div class="d-flex align-items-center mb-3">
			<div class="d-flex gap-2 align-items-center w-100">
				<input
					type="range"
					class="form-range flex-grow-1"
					v-model.number="currentYear"
					:min="2380"
					:max="2460"
					:step="1"
				/>
				<h3 class="mb-0 text-nowrap">Year {{ currentYear }}</h3>
			</div>
		</div>

		<svg :viewBox="`0 0 ${width} ${height}`" class="w-full">
			<!-- Title -->
			<text
				:x="width / 2"
				:y="padding.top / 2"
				class="text-lg font-semibold"
				text-anchor="middle"
			>
				Population Pyramid
			</text>

			<!-- Center line -->
			<line
				:x1="width / 2"
				:y1="padding.top"
				:x2="width / 2"
				:y2="height - padding.bottom"
				stroke="#666"
				stroke-width="1"
			/>

			<!-- Age group labels -->
			<text
				v-for="(group, i) in populationData"
				:key="`label-${group.ageGroup}`"
				:x="width / 2"
				:y="padding.top + i * barHeight + barHeight / 2"
				text-anchor="middle"
				alignment-baseline="middle"
				class="text-xs"
			>
				{{ group.ageGroup }}
			</text>

			<!-- Male bars (left side) -->
			<g v-for="(group, i) in populationData" :key="`male-${i}`">
				<rect
					:x="width / 2 - group.male * scale - labelWidth"
					:y="padding.top + i * barHeight"
					:width="group.male * scale"
					:height="barHeight - 2"
					fill="#2563eb"
					opacity="0.7"
				>
					<title>
						Males: {{ Math.round(group.male).toLocaleString() }}
					</title>
				</rect>
				<text
					:x="width / 2 - labelWidth - 5"
					:y="padding.top + i * barHeight + barHeight / 2"
					text-anchor="end"
					alignment-baseline="middle"
					class="text-xs"
				>
					{{ Math.round(group.male).toLocaleString() }}
				</text>
			</g>

			<!-- Female bars (right side) -->
			<g v-for="(group, i) in populationData" :key="`female-${i}`">
				<rect
					:x="width / 2 + labelWidth"
					:y="padding.top + i * barHeight"
					:width="group.female * scale"
					:height="barHeight - 2"
					fill="#db2777"
					opacity="0.7"
				>
					<title>
						Females: {{ Math.round(group.female).toLocaleString() }}
					</title>
				</rect>
				<text
					:x="width / 2 + labelWidth + 5"
					:y="padding.top + i * barHeight + barHeight / 2"
					alignment-baseline="middle"
					class="text-xs"
				>
					{{ Math.round(group.female).toLocaleString() }}
				</text>
			</g>

			<!-- Legend -->
			<g
				:transform="`translate(${padding.left}, ${
					height - padding.bottom + 20
				})`"
			>
				<rect width="20" height="20" fill="#2563eb" opacity="0.7" />
				<text x="25" y="15" class="text-sm">Males</text>
				<rect
					x="100"
					width="20"
					height="20"
					fill="#db2777"
					opacity="0.7"
				/>
				<text x="125" y="15" class="text-sm">Females</text>
			</g>
		</svg>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { IPopulationData } from './types';

interface Props {
	data: IPopulationData[];
}

const props = defineProps<Props>();

// Configuration
const width = 800;
const height = 600;
const barHeight = 25;
const padding = {
	top: 40,
	right: 60,
	bottom: 40,
	left: 60,
};
const labelWidth = 50;
const currentYear = ref(2400);

// Calculate population data based on current year
const populationData = computed(() => {
	const groups = Array.from({ length: 20 }, (_, i) => ({
		ageGroup: `${i * 5}-${i * 5 + 4}`,
		male: 0,
		female: 0,
	}));

	props.data.forEach((person) => {
		const birthYear = parseInt(person.birthdate.split('.')[0]);
		const deathYear = person.dateOfDeath
			? parseInt(person.dateOfDeath.split('.')[0])
			: null;

		// Skip if person not yet born or already dead in current year
		if (
			birthYear > currentYear.value ||
			(deathYear && deathYear < currentYear.value)
		) {
			return;
		}

		const age = currentYear.value - birthYear;
		const groupIndex = Math.floor(age / 5);

		if (groupIndex >= 0 && groupIndex < 20) {
			if (person.sex?.toLowerCase() === 'male') {
				groups[groupIndex].male++;
			} else if (person.sex?.toLowerCase() === 'female') {
				groups[groupIndex].female++;
			}
		}
	});

	return groups.reverse(); // Oldest age groups at top
});

// Calculate scale based on maximum value
const scale = computed(() => {
	const maxValue = Math.max(
		...populationData.value.flatMap((d) => [d.male, d.female]),
	);
	return (
		(width - padding.left - padding.right - labelWidth * 2) /
		(2 * maxValue || 1)
	);
});
</script>

<style scoped>
.population-pyramid {
	width: 100%;
	max-width: 800px;
	margin: 0 auto;
}

rect {
	transition: all 0.3s ease;
}

text {
	fill: currentColor;
}
</style>
