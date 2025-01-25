<template>
	<div id="population-growth__app" class="row calculator">
		<div id="specific-impulse__form" class="col-xl-4 col-lg-5 col-md-6">
			<SpecificImpulseForm
				:formData="formData"
				@update:formData="updateFormData"
			/>
		</div>
		<div id="specific-impulse__results" class="col-xl-8 col-lg-7 col-md-6">
			<SpecificImpulseResults :formData="formData" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';

import SpecificImpulseForm from './SpecificImpulseForm.vue';
import SpecificImpulseResults from './SpecificImpulseResults.vue';

import { exampleEngines, type ISpecificImpulseForm } from './types';

const formData = ref<ISpecificImpulseForm>({
	massFlowRate: 1200,
	exhaustVelocity: 3290,
	gravity: 9.81, // Standard gravity
	selectedEngineId: exampleEngines[1].id,
});

const updateFormData = (newFormData: ISpecificImpulseForm) => {
	formData.value = newFormData;

	console.log('formData', formData.value);
};
</script>
