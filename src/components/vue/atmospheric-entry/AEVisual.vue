<template>
	<div class="p-4">
		<div class="mb-8">
			<h3 class="text-lg font-semibold mb-4">Altitude vs Time</h3>
			<LineChart :width="600" :height="300" :data="altitudeChartData">
				<XAxis dataKey="time" name="Time" unit="s" />
				<YAxis name="Altitude" unit="km" />
				<Tooltip />
				<Legend />
				<Line
					type="monotone"
					dataKey="altitude"
					stroke="#8884d8"
					name="Altitude"
				/>
			</LineChart>
		</div>

		<div class="mb-8">
			<h3 class="text-lg font-semibold mb-4">Velocity vs Time</h3>
			<LineChart :width="600" :height="300" :data="velocityChartData">
				<XAxis dataKey="time" name="Time" unit="s" />
				<YAxis name="Velocity" unit="km/s" />
				<Tooltip />
				<Legend />
				<Line
					type="monotone"
					dataKey="velocity"
					stroke="#82ca9d"
					name="Velocity"
				/>
			</LineChart>
		</div>

		<div class="mb-8">
			<h3 class="text-lg font-semibold mb-4">Heating Rate vs Time</h3>
			<LineChart :width="600" :height="300" :data="heatingChartData">
				<XAxis dataKey="time" name="Time" unit="s" />
				<YAxis name="Heating Rate" unit="MW/m²" />
				<Tooltip />
				<Legend />
				<Line
					type="monotone"
					dataKey="heating"
					stroke="#ff7300"
					name="Heating Rate"
				/>
			</LineChart>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts';

interface TrajectoryPoint {
	time: number;
	altitude: number;
	velocity: number;
	deceleration: number;
	heating: number;
}

const props = defineProps<{
	trajectoryData: TrajectoryPoint[];
}>();

// Sample the data to reduce points (optional but can help with performance)
const sampleData = (data: TrajectoryPoint[], sampleSize: number) => {
	const step = Math.max(1, Math.floor(data.length / sampleSize));
	return data.filter((_, index) => index % step === 0);
};

const altitudeChartData = computed(() => {
	return sampleData(props.trajectoryData, 100).map((point) => ({
		time: Number(point.time.toFixed(1)),
		altitude: Number((point.altitude / 1000).toFixed(1)), // Convert to km
	}));
});

const velocityChartData = computed(() => {
	return sampleData(props.trajectoryData, 100).map((point) => ({
		time: Number(point.time.toFixed(1)),
		velocity: Number((point.velocity / 1000).toFixed(1)), // Convert to km/s
	}));
});

const heatingChartData = computed(() => {
	return sampleData(props.trajectoryData, 100).map((point) => ({
		time: Number(point.time.toFixed(1)),
		heating: Number((point.heating / 1e6).toFixed(1)), // Convert to MW/m²
	}));
});
</script>

<style scoped>
.recharts-wrapper {
	margin: 0 auto;
}
</style>
