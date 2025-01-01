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

			<!-- <InputWrapper
				id="yearSlider"
				label="Simulation Year"
				:description="`Current Year: ${selectedYear}`"
			>
				<template v-slot:input>
					<input
						type="range"
						id="yearSlider"
						class="form-range"
						:min="minYear"
						:max="maxYear"
						:step="1"
						:disabled="!hasData"
						v-model="selectedYear"
						@input="updateYear"
					/>
				</template>
			</InputWrapper> -->
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
			minYear.value = Math.min(...years);
			maxYear.value = Math.max(...years) + 100; // Add 100 years for projection
			selectedYear.value = minYear.value;

			hasData.value = true;
			emit('update:data', data);
			emit('update:year', selectedYear.value);
		},
	});
};

const updateYear = () => {
	emit('update:year', selectedYear.value);
};
</script>
