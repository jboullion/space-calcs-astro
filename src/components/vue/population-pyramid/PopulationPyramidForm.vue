<template>
	<div class="p-2 rounded border mb-5">
		<div class="calc-form">
			<InputWrapper
				id="csvFile"
				label="Population Data"
				description="Upload a CSV file containing population data with birth dates, death dates, and demographic information."
			>
				<template v-slot:input>
					<input
						type="file"
						id="csvFile"
						class="form-control"
						accept=".csv"
						@change="handleFileUpload"
					/>
				</template>
			</InputWrapper>

			<template v-if="hasData">
				<InputWrapper id="startYear" label="Start Year">
					<template v-slot:input>
						<input
							type="number"
							id="startYear"
							class="form-control"
							v-model="minYear"
						/>
					</template>
				</InputWrapper>

				<InputWrapper id="endYear" label="End Year">
					<template v-slot:input>
						<input
							type="number"
							id="endYear"
							class="form-control"
							v-model="maxYear"
						/>
					</template>
				</InputWrapper>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import InputWrapper from '../forms/v2/InputWrapper.vue';
// @ts-ignore
import Papa from 'papaparse';
import type { IPopulationData } from './types';

const emit = defineEmits<{
	'update:data': [data: IPopulationData[]];
	'update:year': [year: number];
	'update:startYear': [year: number];
	'update:endYear': [year: number];
}>();

const selectedYear = ref<number>(2000);
const minYear = ref<number>(2000);
const maxYear = ref<number>(2000);
const hasData = ref<boolean>(false);

const handleFileUpload = async (event: Event) => {
	const target = event.target as HTMLInputElement;
	if (!target.files?.length) return;

	const file = target.files[0];
	const text = await file.text();

	Papa.parse(text, {
		header: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		complete: (results: any) => {
			const data = results.data.map((row: any) => ({
				birthdate: row['Birthdate'],
				dateOfDeath: row['Date of Death'],
				lifespan: row['Lifespan'],
				sex: row['Sex'],
			})) as IPopulationData[];

			// Find min and max years from birth dates
			const years = data.map((row) =>
				new Date(row.birthdate).getFullYear(),
			);
			const deathYears = data.map((row) =>
				new Date(row.dateOfDeath).getFullYear(),
			);

			minYear.value = Math.min(...years) + 70;
			maxYear.value = Math.max(...deathYears);
			selectedYear.value = minYear.value;

			hasData.value = true;
			emit('update:data', data);
			emit('update:year', selectedYear.value);
		},
	});
};

// Watch for changes to min/max year
watch([minYear, maxYear], ([newMin, newMax]) => {
	emit('update:startYear', newMin);
	emit('update:endYear', newMax);

	// Ensure selected year stays within bounds
	if (selectedYear.value < newMin) {
		selectedYear.value = newMin;
	} else if (selectedYear.value > newMax) {
		selectedYear.value = newMax;
	}
	emit('update:year', selectedYear.value);
});
</script>
