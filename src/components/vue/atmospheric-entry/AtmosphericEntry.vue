<template>
	<div id="atmospheric-entry__app" class="row" v-cloak>
		<div id="atmospheric-entry__form" class="col-lg-4">
			<div class="calc-form col-12 mb-5 px-2 rounded border">
				<AEForm :formData="formData" :results="results" />
			</div>
		</div>
		<div id="atmospheric-entry__results" class="col-lg-8 calc-form">
			<AEVisual :trajectoryData="trajectoryData" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { AtmosphericEntryForm } from './types';
import AEForm from './AEForm.vue';
import AEVisual from './AEVisual.vue';

// Constants
const EARTH_RADIUS = 6371000; // meters
const GRAVITY = 9.81; // m/s^2
const AIR_DENSITY_SEA_LEVEL = 1.225; // kg/m^3
const SCALE_HEIGHT = 7400; // meters

interface TrajectoryPoint {
	time: number;
	altitude: number;
	velocity: number;
	deceleration: number;
	heating: number;
}

interface Results {
	maxDeceleration: number;
	maxHeating: number;
}

const formData = ref<AtmosphericEntryForm>({
	entryVelocity: 7800, // m/s (typical LEO reentry)
	entryAngle: -2.5, // degrees
	vehicleMass: 1000, // kg
	dragCoefficient: 1.4, // typical for capsule
	crossSectionalArea: 4.0, // m^2
	noseRadius: 1, // meters
	initialAltitude: 120, // km
});

const results = ref<Results>({
	maxDeceleration: 0,
	maxHeating: 0,
});

const trajectoryData = ref<TrajectoryPoint[]>([]);

// Calculation function
function calculateTrajectoryPoint(
	altitude: number,
	velocity: number,
	angle: number,
): TrajectoryPoint {
	const airDensity =
		AIR_DENSITY_SEA_LEVEL * Math.exp(-altitude / SCALE_HEIGHT);

	const dragForce =
		0.5 *
		airDensity *
		Math.pow(velocity, 2) *
		formData.value.dragCoefficient *
		formData.value.crossSectionalArea;

	const deceleration = dragForce / (formData.value.vehicleMass * GRAVITY);

	const heatingRate =
		1.83e-4 *
		Math.sqrt(airDensity / formData.value.noseRadius) *
		Math.pow(velocity, 3);

	return {
		time: 0,
		altitude,
		velocity,
		deceleration,
		heating: heatingRate,
	};
}

// Watch for form changes and recalculate
watch(
	formData,
	() => {
		const trajectory: TrajectoryPoint[] = [];
		let currentAltitude = formData.value.initialAltitude * 1000; // convert to meters
		let currentVelocity = formData.value.entryVelocity;
		let currentAngle = formData.value.entryAngle * (Math.PI / 180); // convert to radians
		let currentTime = 0;
		const timeStep = 0.5; // seconds
		const MAX_POINTS = 1000;

		while (
			currentAltitude > 0 &&
			currentVelocity > 0 &&
			trajectory.length < MAX_POINTS
		) {
			const point = calculateTrajectoryPoint(
				currentAltitude,
				currentVelocity,
				currentAngle,
			);

			point.time = currentTime;
			trajectory.push(point);

			// Update state for next iteration
			const airDensity =
				AIR_DENSITY_SEA_LEVEL *
				Math.exp(-currentAltitude / SCALE_HEIGHT);

			const dragForce =
				0.5 *
				airDensity *
				Math.pow(currentVelocity, 2) *
				formData.value.dragCoefficient *
				formData.value.crossSectionalArea;

			const acceleration =
				-dragForce / formData.value.vehicleMass -
				GRAVITY * Math.sin(currentAngle);

			currentVelocity += acceleration * timeStep;
			currentAltitude +=
				currentVelocity * Math.sin(currentAngle) * timeStep;
			currentTime += timeStep;
		}

		trajectoryData.value = trajectory;

		// Update results
		// Find max values using reduce instead of spread operator
		const maxValues = trajectory.reduce(
			(max, point) => ({
				maxDeceleration: Math.max(
					max.maxDeceleration,
					point.deceleration,
				),
				maxHeating: Math.max(max.maxHeating, point.heating),
			}),
			{
				maxDeceleration: -Infinity,
				maxHeating: -Infinity,
			},
		);

		results.value = maxValues;
	},
	{ immediate: true },
);

// Computed properties for the visual component
const altitudeData = computed(() => {
	return trajectoryData.value.map((point) => ({
		time: point.time.toFixed(1),
		altitude: (point.altitude / 1000).toFixed(1), // Convert to km
	}));
});

const velocityData = computed(() => {
	return trajectoryData.value.map((point) => ({
		time: point.time.toFixed(1),
		velocity: (point.velocity / 1000).toFixed(1), // Convert to km/s
	}));
});

const heatingData = computed(() => {
	return trajectoryData.value.map((point) => ({
		time: point.time.toFixed(1),
		heating: (point.heating / 1e6).toFixed(1), // Convert to MW/m²
	}));
});
</script>

<style></style>
