<template>
	<div
		id="population-growth__app"
		class="row justify-content-center calculator"
	>
		<div id="population-growth__form" class="col-lg-6 m-auto">
			<PopulationGrowthForm :formData="formData" />
		</div>
	</div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { onMounted, reactive, ref } from 'vue';

import PopulationGrowthForm from './PopulationGrowthForm.vue';
import PopulationGrowthVisual from './PopulationGrowthVisual.vue';

import type { IPopulationGrowthForm } from './types';

const formData = ref<IPopulationGrowthForm>({
	initialPopulation: 1000,
	initialAgeDistribution: [0.15, 0.15, 0.15, 0.15, 0.15, 0.12, 0.08, 0.05],
	birthRate: 0.02,
	deathRate: 0.01,
	lifeExpectancy: 80,
	years: 100,
});
</script>
<style></style>
