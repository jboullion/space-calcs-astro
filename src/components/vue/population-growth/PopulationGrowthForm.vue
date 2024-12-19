<template>
	<div class="calc-form">
		<div class="p-2 rounded border mb-3">
			<NumberInput
				id="initialPopulation"
				:key="`initialPopulation-${formData.initialPopulation}`"
				type="number"
				class="form-control"
				v-model.number="formData.initialPopulation"
				:min="2"
				:step="1"
			/>

			<div class="age-distribution-inputs">
				<h4 class="mb-2">Age Distribution (%)</h4>
				<div
					v-for="(value, index) in ageDistribution"
					:key="index"
					class="d-flex align-items-center gap-2 mb-2"
				>
					<label class="flex-shrink-0" :for="`age-group-${index}`">
						{{ index * 10 }}-{{ index * 10 + 9 }} years:
					</label>
					<NumberInput
						:id="`age-group-${index}`"
						type="number"
						class="form-control"
						v-model.number="ageDistribution[index]"
						:min="0"
						:max="100"
						:step="0.1"
					/>
				</div>
				<div
					class="text-muted"
					:class="{ 'text-danger': !isValidDistribution }"
				>
					Total: {{ totalDistribution }}% (should equal 100%)
				</div>
			</div>

			<NumberInput
				id="birthRate"
				:key="`birthRate-${formData.birthRate}`"
				type="number"
				class="form-control"
				v-model.number="formData.birthRate"
				:min="0"
				:step="0.01"
			/>

			<NumberInput
				id="deathRate"
				:key="`deathRate-${formData.deathRate}`"
				type="number"
				class="form-control"
				v-model.number="formData.deathRate"
				:min="0"
				:step="0.01"
			/>

			<NumberInput
				id="lifeExpectancy"
				:key="`lifeExpectancy-${formData.lifeExpectancy}`"
				type="number"
				class="form-control"
				v-model.number="formData.lifeExpectancy"
				:min="1"
				:step="1"
			/>

			<NumberInput
				id="years"
				:key="`years-${formData.years}`"
				type="number"
				class="form-control"
				v-model.number="formData.years"
				:min="1"
				:step="1"
			/>

			<!-- 			
			<SelectInput
				id="flywheelType"
				label="Flywheel Type"
				v-model="formData.geometry"
				:options="flyWheelGeometry"
				:description="`Inertial constant k: ${formData.geometry.k}`"
			/>

			<InputWrapper
				id="mass"
				label="Mass"
				:description="`Stored Energy: ${formatNumber(
					convertedStoredEnergy,
					3,
				)} kWh`"
			>
				<template v-slot:input>
					<NumberInput
						id="mass"
						:key="`mass-${formData.mass}`"
						type="number"
						class="form-control"
						v-model.number="formData.mass"
						:min="1"
						:max="100000"
						:step="1"
					/>
				</template>
				<template v-slot:unit>
					<SimpleUnit unit="kg" />
				</template>
			</InputWrapper>

			<InputWrapper
				id="radius"
				label="Radius"
				:description="`Moment of Inertia: ${formatNumber(
					momentOfInertia,
				)} kg.m<sup>2</sup>`"
			>
				<template v-slot:input>
					<NumberInput
						id="radius"
						:key="`radius-${formData.radius}`"
						type="number"
						class="form-control"
						v-model.number="formData.radius"
						:min="1"
						:max="100000"
						:step="1"
					/>
				</template>
				<template v-slot:unit>
					<SimpleUnit unit="m" />
				</template>
			</InputWrapper>

			<InputWrapper
				id="rpm"
				label="RPM"
				:description="`Specific Energy: ${formatNumber(
					specificEnergy,
				)} J/kg`"
			>
				<template v-slot:input>
					<NumberInput
						id="rpm"
						:key="`rpm-${formData.rpm}`"
						type="number"
						class="form-control"
						v-model.number="formData.rpm"
						:min="1"
						:max="1000000"
						:step="1"
					/>
				</template>
				<template v-slot:unit>
					<SimpleUnit unit="rpm" />
				</template>
			</InputWrapper>

			<SelectInput
				id="material"
				label="Material"
				v-model="formData.material"
				:options="materials"
				:description="`Density: ${
					formData.material.density
				} g/cm<sup>3</sup><br />Mat. Tensile Strength: ${formatNumber(
					formData.material.tensileStrength,
				)} MPa<br />Req. Tensile Strength: ${formatNumber(
					requiredTensileStrength,
				)} MPa`"
			/> -->
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
import SelectInput from '../forms/SelectInput.vue';
import SimpleUnit from '../forms/v2/SimpleUnit.vue';
import UnitSelect from '../forms/v2/UnitSelect.vue';
import type { IPopulationGrowthForm } from './types';

const props = defineProps<{
	formData: IPopulationGrowthForm;
}>();

// Calculate number of age groups based on life expectancy
const ageDistribution = ref<number[]>([]);

// Watch for changes in life expectancy and update array length
watch(
	() => props.formData.lifeExpectancy,
	(newValue) => {
		const groups = Math.ceil(newValue / 10);
		const currentLength = ageDistribution.value.length;

		if (groups > currentLength) {
			// Add new groups with 0%
			ageDistribution.value.push(
				...Array(groups - currentLength).fill(0),
			);
		} else if (groups < currentLength) {
			// Remove excess groups
			ageDistribution.value.splice(groups);
		}
	},
	{ immediate: true },
);

// Calculate total distribution
const totalDistribution = computed(() => {
	return ageDistribution.value.reduce((sum, value) => sum + value, 0);
});

// Validate distribution
const isValidDistribution = computed(() => {
	return Math.abs(totalDistribution.value - 100) < 0.1; // Allow for small floating point errors
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
.age-distribution-inputs {
	border: 1px solid #dee2e6;
	padding: 1rem;
	border-radius: 0.25rem;
	margin-bottom: 1rem;
}
</style>
