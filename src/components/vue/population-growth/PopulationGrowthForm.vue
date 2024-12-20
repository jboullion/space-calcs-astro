<template>
	<div class="p-2 rounded border mb-5">
		<div class="calc-form">
			<InputWrapper
				id="initialPopulation"
				label="Initial Population"
				description="Enter the starting population size. This represents the total number of individuals at the beginning of the simulation."
			>
				<template v-slot:input>
					<NumberInput
						id="initialPopulation"
						:key="`initialPopulation-${formData.initialPopulation}`"
						type="number"
						class="form-control"
						v-model.number="formData.initialPopulation"
						:min="1"
						:max="10000"
						:step="1"
					/>
				</template>
			</InputWrapper>

			<div class="age-distribution-inputs mb-3">
				<label class="mb-2 form-label">Age Distribution (%)</label>
				<p class="description">
					<small class="text-muted">
						Specify the percentage of population in each 10-year age
						group. The distribution should show how your population
						is structured across different age ranges, with
						percentages totaling 100%.
					</small>
				</p>
				<div
					v-for="(value, index) in ageDistribution"
					:key="index"
					class="d-flex align-items-center gap-4 mb-2"
				>
					<label
						class="flex-shrink-0 w-25 text-nowrap"
						:for="`age-group-${index}`"
					>
						<small
							>{{ index * 10 }}-{{ index * 10 + 9 }} years:</small
						>
					</label>
					<div class="d-flex gap-2 align-items-center w-100">
						<input
							:id="`age-group-${index}`"
							type="range"
							class="form-range flex-grow-1"
							v-model.number="ageDistribution[index]"
							:min="0"
							:max="50"
							:step="1"
						/>
						<span class="flex-shrink-0" style="min-width: 4rem">
							{{ ageDistribution[index].toFixed(0) }}%
						</span>
					</div>
				</div>
				<div :class="{ 'text-danger': !isValidDistribution }">
					Total: {{ totalDistribution.toFixed(0) }}%
				</div>
			</div>

			<InputWrapper
				id="birthRate"
				label="Birth Rate"
				description="Enter the annual birth rate as a decimal (e.g., 0.02 = 2%). This represents the number of births per person per year in the population."
			>
				<template v-slot:input>
					<NumberInput
						id="birthRate"
						type="number"
						class="form-control"
						v-model.number="formData.birthRate"
						:min="0"
						:step="0.01"
					/>
				</template>
			</InputWrapper>

			<InputWrapper
				id="deathRate"
				label="Death Rate"
				description="Enter the annual death rate as a decimal (e.g., 0.01 = 1%). This represents the probability of death per person per year, excluding age-specific mortality."
			>
				<template v-slot:input>
					<NumberInput
						id="deathRate"
						type="number"
						class="form-control"
						v-model.number="formData.deathRate"
						:min="0"
						:step="0.01"
					/>
				</template>
			</InputWrapper>

			<InputWrapper
				id="lifeExpectancy"
				label="Life Expectancy"
				description="Enter the average number of years an individual is expected to live. This will determine the number of age groups in the simulation and influence mortality patterns."
			>
				<template v-slot:input>
					<NumberInput
						id="lifeExpectancy"
						type="number"
						class="form-control"
						v-model.number="formData.lifeExpectancy"
						:min="1"
						:step="1"
					/>
				</template>
			</InputWrapper>

			<InputWrapper
				id="years"
				label="Years"
				description="Enter the number of years to simulate population growth. This determines how far into the future the projection will calculate."
			>
				<template v-slot:input>
					<NumberInput
						id="years"
						type="number"
						class="form-control"
						v-model.number="formData.years"
						:min="1"
						:step="1"
					/>
				</template>
			</InputWrapper>
		</div>
	</div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref, watch } from 'vue';
import InputWrapper from '../forms/v2/InputWrapper.vue';
import NumberInput from '../forms/v2/NumberInput.vue';
import type { IPopulationGrowthForm } from './types';

const props = defineProps<{
	formData: IPopulationGrowthForm;
}>();

const emit = defineEmits<{
	(e: 'update:formData', value: IPopulationGrowthForm): void;
}>();

// Calculate number of age groups based on life expectancy
const ageDistribution = ref<number[]>(
	props.formData.initialAgeDistribution.map((value) => value * 100),
);

console.log(
	'props.formData.initialAgeDistribution',
	props.formData.initialAgeDistribution,
);
console.log('ageDistribution', ageDistribution.value);

// // Watch for changes in life expectancy and update array length
// watch(
// 	() => props.formData.lifeExpectancy,
// 	(newValue) => {
// 		const groups = Math.ceil(newValue / 10);
// 		const currentLength = ageDistribution.value.length;

// 		if (groups > currentLength) {
// 			// Add new groups with 0%
// 			ageDistribution.value.push(
// 				...Array(groups - currentLength).fill(0),
// 			);
// 		} else if (groups < currentLength) {
// 			// Remove excess groups
// 			ageDistribution.value.splice(groups);
// 		}
// 	},
// 	{ immediate: true },
// );

// Calculate total distribution
const totalDistribution = computed(() => {
	return ageDistribution.value.reduce((sum, value) => sum + value, 0);
});

// Validate distribution
const isValidDistribution = computed(() => {
	console.log('totalDistribution', totalDistribution.value);
	return totalDistribution.value < 101;
});

// Emit changes when distribution is updated
watch(
	ageDistribution,
	(newValue) => {
		if (isValidDistribution.value) {
			emit('update:formData', {
				...props.formData,
				initialAgeDistribution: newValue,
			});
		}
	},
	{ deep: true },
);
</script>

<style scoped>
.calc-form .description,
.calc-form :deep(.description) {
	display: none;
}
</style>
