<template>
	<div class="population-pyramid">
		<div class="controls mb-4">
			<button @click="toggleSimulation" class="btn btn-primary">
				{{ isPlaying ? 'Pause' : 'Play' }}
			</button>
			<span class="ml-4">Year: {{ currentYear }}</span>
		</div>

		<svg :viewBox="`0 0 ${width} ${height}`" class="w-full">
			<!-- Center line -->
			<line
				:x1="width / 2"
				:y1="0"
				:x2="width / 2"
				:y2="height"
				stroke="#ccc"
				stroke-width="1"
			/>

			<!-- Male bars (left side) -->
			<rect
				v-for="(group, i) in reversedPopulationData"
				:key="`male-${i}`"
				:x="width / 2 - group.male * scale"
				:y="i * barHeight + labelPadding / 2"
				:width="group.male * scale"
				:height="barHeight - 1 - labelPadding"
				fill="#2563eb"
				opacity="0.7"
			>
				<title>
					Males: {{ Math.round(group.male).toLocaleString() }}
				</title>
			</rect>

			<!-- Female bars (right side) -->
			<rect
				v-for="(group, i) in reversedPopulationData"
				:key="`female-${i}`"
				:x="width / 2"
				:y="i * barHeight + labelPadding / 2"
				:width="group.female * scale"
				:height="barHeight - 1 - labelPadding"
				fill="#db2777"
				opacity="0.7"
			>
				<title>
					Females: {{ Math.round(group.female).toLocaleString() }}
				</title>
			</rect>

			<!-- Axis labels in dedicated space -->
			<text
				:x="width * 0.25"
				:y="height"
				text-anchor="middle"
				class="text-sm fill-gray-600"
				fill="white"
			>
				Males
			</text>
			<text
				:x="width * 0.75"
				:y="height"
				text-anchor="middle"
				class="text-sm fill-gray-600"
				fill="white"
			>
				Females
			</text>

			<!-- Age group labels -->
			<text
				v-for="(group, i) in reversedPopulationData"
				:key="`label-${i}`"
				:x="width / 2"
				:y="i * barHeight + barHeight / 2"
				text-anchor="middle"
				alignment-baseline="middle"
				class="text-xs"
				fill="white"
			>
				{{ group.ageGroup }}
			</text>
		</svg>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue';

const props = defineProps<{
	ageDistribution: number[];
	totalPopulation: number;
	maxAge?: number;
	ageGroupSize?: number;
	simulatedData?: Array<{
		year: number;
		distribution: number[];
		total: number;
	}>;
}>();

// Constants
const width = 800;
const barHeight = 60;
const labelHeight = 40;
const labelPadding = 10;

// Simulation state
const currentYear = ref(0);
const isPlaying = ref(false);
let animationInterval: number | null = null;

// Computed values
const numGroups = computed(() => {
	return Math.ceil((props.maxAge || 80) / (props.ageGroupSize || 10));
});

// Get current distribution based on simulation year
const currentDistribution = computed(() => {
	if (!props.simulatedData || props.simulatedData.length === 0) {
		return {
			distribution: props.ageDistribution,
			total: props.totalPopulation,
		};
	}
	const currentData =
		props.simulatedData[currentYear.value] || props.simulatedData[0];
	return {
		distribution: currentData.distribution,
		total: currentData.total,
	};
});

// Transform input data into population pyramid data
const populationData = computed(() => {
	return currentDistribution.value.distribution.map((percentage, i) => {
		const totalInGroup =
			(percentage / 100) * currentDistribution.value.total;
		return {
			ageGroup: `${i * (props.ageGroupSize || 10)}-${
				(i + 1) * (props.ageGroupSize || 10) - 1
			}`,
			male: totalInGroup * 0.49,
			female: totalInGroup * 0.51,
		};
	});
});

// Reverse the data for display (oldest at top)
const reversedPopulationData = computed(() => {
	return [...populationData.value].reverse();
});

// Calculate scale based on maximum value
const scale = computed(() => {
	const maxValue = Math.max(
		...populationData.value.flatMap((d) => [d.male, d.female]),
	);
	return width / 2 / maxValue;
});

const height = computed((): number => {
	// add another numgroup to account for labels
	const calcHeight = (numGroups.value + 1) * (barHeight + labelPadding);
	return calcHeight;
});

// Simulation controls
const toggleSimulation = () => {
	if (isPlaying.value) {
		pauseSimulation();
	} else {
		startSimulation();
	}
};

const startSimulation = () => {
	if (!props.simulatedData) return;

	isPlaying.value = true;
	animationInterval = window.setInterval(() => {
		if (currentYear.value >= (props.simulatedData?.length || 0) - 1) {
			currentYear.value = 0;
		} else {
			currentYear.value++;
		}
	}, 1000); // Update every second
};

const pauseSimulation = () => {
	isPlaying.value = false;
	if (animationInterval) {
		clearInterval(animationInterval);
		animationInterval = null;
	}
};

// Clean up on component unmount
onUnmounted(() => {
	if (animationInterval) {
		clearInterval(animationInterval);
	}
});
</script>

<style scoped>
.population-pyramid {
	width: 100%;
	max-width: 800px;
	margin: 0 auto;
}

/* Smooth transitions for updates */
rect {
	transition: all 0.3s ease;
}
</style>
