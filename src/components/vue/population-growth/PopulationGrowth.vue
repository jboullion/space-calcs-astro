<template>
	<div id="population-growth__app" class="row calculator">
		<div id="population-growth__form" class="col-xl-4 col-lg-5 col-md-6">
			<PopulationGrowthForm
				:formData="formData"
				@update:formData="updateFormData"
			/>
		</div>
		<div id="population-growth__results" class="col-xl-8 col-lg-7 col-md-6">
			<PopulationGrowthVisuals
				:ageDistribution="formData.initialAgeDistribution"
				:totalPopulation="formData.initialPopulation"
				:maxAge="formData.lifeExpectancy"
				:ageGroupSize="10"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { onMounted, reactive, ref } from 'vue';

import PopulationGrowthForm from './PopulationGrowthForm.vue';
import PopulationGrowthVisuals from './PopulationGrowthVisuals.vue';

import type { IPopulationGrowthForm } from './types';

const formData = ref<IPopulationGrowthForm>({
	initialPopulation: 1000,
	initialAgeDistribution: [
		0.19, 0.17, 0.15, 0.13, 0.12, 0.09, 0.07, 0.04, 0.03, 0.01,
	],
	birthRate: 0.02,
	deathRate: 0.01,
	lifeExpectancy: 80,
	years: 100,
});

const updateFormData = (newFormData: IPopulationGrowthForm) => {
	formData.value = newFormData;
};
</script>
<style></style>
