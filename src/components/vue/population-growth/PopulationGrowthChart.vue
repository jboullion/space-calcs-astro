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
import type { IPopulationGrowthForm } from './types';

const props = defineProps<{
	formData: IPopulationGrowthForm;
}>();

const chartRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const chartData = computed(() => {
	const birthRate =
		(0.5 * props.formData.childrenPerWoman) / props.formData.lifeExpectancy;
	const deathRate = 1 / props.formData.lifeExpectancy;
	const growthRate = birthRate - deathRate;

	return Array.from({ length: props.formData.years + 1 }, (_, year) => ({
		year,
		population: Math.round(
			props.formData.initialPopulation * Math.pow(1 + growthRate, year),
		),
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
	() => props.formData,
	() => {
		if (!chart) return;

		chart.data.labels = chartData.value.map((d) => `${d.year}`);
		chart.data.datasets[0].data = chartData.value.map((d) => d.population);
		chart.update();
	},
	{ deep: true },
);

onUnmounted(() => {
	if (chart) {
		chart.destroy();
		chart = null;
	}
});
</script>
