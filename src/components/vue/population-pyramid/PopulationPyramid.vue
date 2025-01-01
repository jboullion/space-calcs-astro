<template>
	<div id="population-pyramid__app" class="row calculator">
		<div id="population-pyramid__form" class="col-xl-4 col-lg-5 col-md-6">
			<PopulationPyramidForm
				@update:data="updatePopulationData"
				@update:year="updateSelectedYear"
			/>
		</div>
		<div id="population-pyramid__chart" class="col-xl-8 col-lg-7 col-md-6">
			<PopulationPyramidChart
				:data="populationData"
				:selectedYear="selectedYear"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PopulationPyramidForm from './PopulationPyramidForm.vue';
import PopulationPyramidChart from './PopulationPyramidChart.vue';
import type { IPopulationData } from './types';

const populationData = ref<IPopulationData[]>([]);
const selectedYear = ref<number>(2000);

const updatePopulationData = (data: IPopulationData[]) => {
	populationData.value = data;
};

const updateSelectedYear = (year: number) => {
	selectedYear.value = year;
};
</script>
