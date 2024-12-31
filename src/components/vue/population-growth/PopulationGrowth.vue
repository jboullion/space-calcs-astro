<template>
	<div id="population-growth__app" class="row calculator">
		<div id="population-growth__form" class="col-xl-4 col-lg-5 col-md-6">
			<PopulationGrowthForm
				:formData="formData"
				@update:formData="updateFormData"
			/>
		</div>
		<div id="population-growth__results" class="col-xl-8 col-lg-7 col-md-6">
			<PopulationGrowthResults :formData="formData" />
			<PopulationGrowthChart :formData="formData" />
		</div>
	</div>
</template>

<script setup lang="ts">
// TODO: Must Dos!
// As the Year slider updates, update the population pyramid
// Change the name of "Birth Rate" to Avg Children per Woman
// Update Death Rate to Death Rate per 1000 OR a Death Rate %
// Show the total population for each year
// Show the actual number of people in each age range
// Run the actual calculations based on the life expectancy

// ! BUGS

// ? NOTE: Optional Improvements!
// Set up disasters to occur every X years (Plague / War / etc.)
// Allow users to drag the male and female sliders to adjust the gender ratio for that year range

import { onMounted, reactive, ref } from 'vue';

import PopulationGrowthForm from './PopulationGrowthForm.vue';
import PopulationGrowthResults from './PopulationGrowthResults.vue';
import PopulationGrowthChart from './PopulationGrowthChart.vue';

import type { IPopulationGrowthForm } from './types';

const formData = ref<IPopulationGrowthForm>({
	initialPopulation: 1000,
	childrenPerWoman: 2.1,
	lifeExpectancy: 80,
	years: 100,
});

const updateFormData = (newFormData: IPopulationGrowthForm) => {
	formData.value = newFormData;
};
</script>
