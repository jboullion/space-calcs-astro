<template>
	<div class="agent-simulation">
		<div class="controls mb-4">
			<button @click="toggleSimulation" class="btn btn-primary">
				{{ isPlaying ? 'Pause' : 'Play' }}
			</button>
			<span class="ml-4">Year: {{ currentYear }}</span>
			<span class="ml-4">Population: {{ agentCount }}</span>
		</div>

		<svg :viewBox="`0 0 ${width} ${height}`" class="w-full border rounded">
			<!-- Background grid -->
			<pattern
				id="grid"
				width="50"
				height="50"
				patternUnits="userSpaceOnUse"
			>
				<path
					d="M 50 0 L 0 0 0 50"
					fill="none"
					stroke="#f0f0f0"
					stroke-width="1"
				/>
			</pattern>
			<rect width="100%" height="100%" fill="url(#grid)" />

			<!-- Agents -->
			<circle
				v-for="agent in simulationState.agents"
				:key="agent.id"
				:cx="agent.position.x"
				:cy="agent.position.y"
				:r="3"
				:fill="agent.gender === 'male' ? '#2563eb' : '#db2777'"
				:opacity="getAgentOpacity(agent)"
			>
				<title>
					{{ getAgentTooltip(agent) }}
				</title>
			</circle>
		</svg>

		<!-- Recent events log -->
		<div class="mt-4 border rounded p-3 bg-light">
			<h6>Recent Events:</h6>
			<div class="event-log" style="max-height: 150px; overflow-y: auto">
				<div
					v-for="event in recentEvents"
					:key="event.agentId + event.year"
					class="small"
				>
					Year {{ event.year }}: {{ event.details }}
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { AgentSimulation } from './AgentSimulation';

const props = defineProps<{
	initialPopulation: number;
	width?: number;
	height?: number;
}>();

// Constants and refs
const width = props.width || 800;
const height = props.height || 600;
const currentYear = ref(0);
const isPlaying = ref(false);
let animationInterval: number | null = null;

// Initialize simulation
const simulation = new AgentSimulation(
	{
		minReproductiveAge: 15,
		maxReproductiveAge: 45,
		pregnancyProbability: 0.1,
		baseMortalityRate: 0.01,
		agingFactor: 0.04,
		carryingCapacity: 1000,
		resourceAbundance: 1.0,
	},
	// Create initial agents
	Array.from({ length: props.initialPopulation }, () => ({
		id: crypto.randomUUID(),
		age: Math.floor(Math.random() * 50),
		gender: Math.random() < 0.5 ? 'male' : 'female',
		fertility: 0.8 + Math.random() * 0.4,
		longevity: 0.8 + Math.random() * 0.4,
		position: {
			x: Math.random() * width,
			y: Math.random() * height,
		},
	})),
);

// Track simulation state
const simulationState = ref(simulation.simulateYear());

// Computed values
const agentCount = computed(() => simulationState.value.agents.length);
const recentEvents = computed(() =>
	simulationState.value.events.slice(-10).reverse(),
);

// Helper functions
const getAgentOpacity = (agent: Agent) => {
	// Fade out older agents
	return Math.max(0.3, 1 - agent.age / 80);
};

const getAgentTooltip = (agent: Agent) => {
	return `Age: ${agent.age}
Gender: ${agent.gender}
Fertility: ${(agent.fertility * 100).toFixed(1)}%`;
};

// Simulation controls
const toggleSimulation = () => {
	if (isPlaying.value) {
		pauseSimulation();
	} else {
		startSimulation();
	}
};

const startSimulation = () => {
	isPlaying.value = true;
	animationInterval = window.setInterval(() => {
		currentYear.value++;
		simulationState.value = simulation.simulateYear();
	}, 1000); // Update every second
};

const pauseSimulation = () => {
	isPlaying.value = false;
	if (animationInterval) {
		clearInterval(animationInterval);
		animationInterval = null;
	}
};

// Lifecycle hooks
onUnmounted(() => {
	if (animationInterval) {
		clearInterval(animationInterval);
	}
});
</script>

<style scoped>
.agent-simulation {
	width: 100%;
	max-width: 800px;
	margin: 0 auto;
}

/* Smooth transitions for updates */
circle {
	transition: all 0.3s ease;
}

.event-log {
	font-family: monospace;
}
</style>
