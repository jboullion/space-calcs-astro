<template>
	<div id="population-pyramid__app" class="row calculator">
		<div id="population-pyramid__form" class="col-xl-4 col-lg-5 col-md-6">
			<PopulationPyramidForm
				@update:data="updatePopulationData"
				@update:year="updateSelectedYear"
				@update:startYear="updateMinYear"
				@update:endYear="updateMaxYear"
			/>
		</div>
		<div id="population-pyramid__chart" class="col-xl-8 col-lg-7 col-md-6">
			<PopulationPyramidChart
				v-show="populationData.length > 0"
				:data="populationData"
				:selectedYear="selectedYear"
				:minYear="minYear"
				:maxYear="maxYear"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import PopulationPyramidForm from './PopulationPyramidForm.vue';
import PopulationPyramidChart from './PopulationPyramidChart.vue';
import type { IPopulationData } from './types';

const populationData = ref<IPopulationData[]>([]);
const selectedYear = ref<number>(0);
const minYear = ref<number>(0);
const maxYear = ref<number>(0);

const updatePopulationData = (data: IPopulationData[]) => {
	populationData.value = data;
};

const updateSelectedYear = (year: number) => {
	selectedYear.value = year;
};

const updateMinYear = (year: number) => {
	minYear.value = year;
};

const updateMaxYear = (year: number) => {
	maxYear.value = year;
};

const currentYear = ref(minYear.value);

// Watch for changes to minYear/maxYear props
watch([() => minYear.value, () => maxYear.value], ([newMin, newMax]) => {
	// If current year is outside new bounds, update it
	if (currentYear.value < newMin) {
		currentYear.value = newMin;
	} else if (currentYear.value > newMax) {
		currentYear.value = newMax;
	}
});
</script>
