<template>
	<div class="">
		<div style="height: 350px">
			<canvas ref="chartRef"></canvas>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import Chart from 'chart.js/auto';
import type { IPopulationData } from './types';

const props = defineProps<{
	data: IPopulationData[];
	minYear: number;
	maxYear: number;
}>();

const chartRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const chartData = computed(() => {
	const yearData = new Map();

	// Initialize years
	for (let year = props.minYear; year <= props.maxYear; year++) {
		yearData.set(year, 0);
	}

	// Count population for each year
	props.data.forEach((person) => {
		const birthYear = parseInt(person.birthdate.split('.')[0]);
		const deathYear = person.dateOfDeath
			? parseInt(person.dateOfDeath.split('.')[0])
			: null;

		for (
			let year = birthYear;
			year <= (deathYear || props.maxYear);
			year++
		) {
			if (year >= props.minYear && year <= props.maxYear) {
				yearData.set(year, yearData.get(year)! + 1);
			}
		}
	});

	return Array.from(yearData.entries()).map(([year, population]) => ({
		year,
		population,
	}));
});

onMounted(() => {
	if (!chartRef.value) return;

	const ctx = chartRef.value.getContext('2d');
	if (!ctx) return;

	chart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: chartData.value.map((d) => `${d.year}`),
			datasets: [
				{
					label: 'Population',
					data: chartData.value.map((d) => d.population),
					borderColor: '#8884d8',
					tension: 0.1,
					pointRadius: 0,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				y: {
					title: {
						display: true,
						text: 'Population',
					},
					ticks: {
						callback: (value) => {
							if (typeof value !== 'number') return value;
							if (value >= 1000000)
								return `${(value / 1000000).toFixed(1)}M`;
							if (value >= 1000)
								return `${(value / 1000).toFixed(1)}K`;
							return value;
						},
					},
				},
				x: {
					title: {
						display: true,
						text: 'Years',
					},
				},
			},
			plugins: {
				tooltip: {
					callbacks: {
						label: (context) => {
							const value = context.raw as number;
							return `Population: ${new Intl.NumberFormat().format(
								value,
							)}`;
						},
					},
				},
			},
		},
	});
});

watch(
	() => props.data,
	() => {
		if (!chart) return;

		chart.data.labels = chartData.value.map((d) => `${d.year}`);
		chart.data.datasets[0].data = chartData.value.map((d) => d.population);
		chart.update();
	},
	{ deep: true, immediate: true },
);

onUnmounted(() => {
	if (chart) {
		chart.destroy();
		chart = null;
	}
});
</script>
