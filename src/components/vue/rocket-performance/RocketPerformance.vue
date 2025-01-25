<template>
	<div id="rocket-performance__app" class="row calculator">
		<div id="rocket-performance__form" class="col-xl-4 col-lg-5 col-md-6">
			<RocketPerformanceForm
				:formData="formData"
				@update:formData="updateFormData"
			/>
		</div>
		<div
			id="rocket-performance__results"
			class="col-xl-8 col-lg-7 col-md-6"
		>
			<RocketPerformanceResults :formData="formData" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';

import RocketPerformanceForm from './RocketPerformanceForm.vue';
import RocketPerformanceResults from './RocketPerformanceResults.vue';

import { exampleEngines, type IRocketPerformanceForm } from './types';

const formData = ref<IRocketPerformanceForm>({
	massFlowRate: 1200,
	baseExhaustVelocity: 3290,
	gravity: 9.81, // Standard gravity
	selectedEngineId: exampleEngines[1].id,
	ambientPressure: 101.325, // Sea level (kPa)
	expansionRatio: 40, // Typical for vacuum-optimized engines
	chamberPressure: 25, // 25 MPa, common for modern engines
	mixtureRatio: 3.6, // Good for methane/LOX
	combustionEfficiency: 96, // Modern engines typically >95%
});

const updateFormData = (newFormData: IRocketPerformanceForm) => {
	formData.value = newFormData;
};
</script>
