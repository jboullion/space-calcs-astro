<template>
	<div class="p-2 rounded border mb-5">
		<div class="calc-form">
			<InputWrapper
				id="initialPopulation"
				label="Initial Population"
				description="Enter the starting population size."
			>
				<template v-slot:input>
					<NumberInput
						id="initialPopulation"
						:key="`initialPopulation-${localFormData.initialPopulation}`"
						type="number"
						class="form-control"
						:model-value="localFormData.initialPopulation"
						@update:model-value="
							updateField('initialPopulation', $event)
						"
						:min="1"
						:max="10000"
						:step="1"
					/>
				</template>
			</InputWrapper>

			<InputWrapper
				id="childrenPerWoman"
				label="Children per Woman"
				description="The average number of children a woman has in her lifetime"
			>
				<template v-slot:input>
					<NumberInput
						id="childrenPerWoman"
						type="number"
						class="form-control"
						:model-value="localFormData.childrenPerWoman"
						@update:model-value="
							updateField('childrenPerWoman', $event)
						"
						:min="0"
						:step="0.1"
					/>
				</template>
			</InputWrapper>

			<InputWrapper
				id="lifeExpectancy"
				label="Life Expectancy"
				description="Enter the average number of years an individual is expected to live."
			>
				<template v-slot:input>
					<NumberInput
						id="lifeExpectancy"
						type="number"
						class="form-control"
						:model-value="localFormData.lifeExpectancy"
						@update:model-value="
							updateField('lifeExpectancy', $event)
						"
						:min="1"
						:step="1"
					/>
				</template>
			</InputWrapper>

			<InputWrapper
				id="years"
				label="Years"
				description="Enter the number of years to simulate population growth."
			>
				<template v-slot:input>
					<NumberInput
						id="years"
						type="number"
						class="form-control"
						:model-value="localFormData.years"
						@update:model-value="updateField('years', $event)"
						:min="1"
						:step="1"
					/>
				</template>
			</InputWrapper>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import InputWrapper from '../forms/v2/InputWrapper.vue';
import NumberInput from '../forms/v2/NumberInput.vue';
import type { IPopulationGrowthForm } from './types';

const props = defineProps<{
	formData: IPopulationGrowthForm;
}>();

const emit = defineEmits<{
	'update:formData': [formData: IPopulationGrowthForm];
}>();

// Create a local copy of the form data
const localFormData = ref<IPopulationGrowthForm>({ ...props.formData });

// Watch for changes in the props and update local data
watch(
	() => props.formData,
	(newValue) => {
		localFormData.value = { ...newValue };
	},
	{ deep: true },
);

// Function to update individual fields
const updateField = (field: keyof IPopulationGrowthForm, value: number) => {
	localFormData.value[field] = value;
	emit('update:formData', { ...localFormData.value });
};
</script>
