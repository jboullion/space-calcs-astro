<template>
	<div id="star-travel__app" class="row justify-content-center calculator">
		<div id="star-travel__form" class="col-lg-4">
			<StarTravelForm
				:formData="formData"
				@update-travel-distance="updateTravelDistance"
				@update-engine="updateEngine"
			/>
		</div>
		<div id="star-travel__results" class="col-lg-8">
			<StarTravelResults :formData="formData" />
		</div>
	</div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { onMounted, reactive, watch } from 'vue';

import StarTravelForm from './StarTravelForm.vue';
import StarTravelResults from './StarTravelResults.vue';

import type { IStarTravelForm } from './types';
import {
	accelerationUnits,
	convertUnitValue,
	massUnits,
	lengthUnits,
	highSpeedUnits,
} from '../utils';

import { travelLocations, exampleEngines } from './constants';

const formData = reactive<IStarTravelForm>({
	exampleLocation: travelLocations[0],
	distance: 4.22, // light years
	acceleration: 9.81, // m/s²
	accelerationUnit: accelerationUnits[0], // m/s²
	maxVelocity: 50000, // c
	maxVelocityUnit: highSpeedUnits[0], // c
	deceleration: 9.81, // m/s²
	decelerationUnit: accelerationUnits[0], // m/s²
	shipMass: 1000, // ton
	shipMassUnit: massUnits[2], // ton
	exampleEngine: exampleEngines[0],
	fuelEfficiency: exampleEngines[0].fuelEfficiency, // km x m x m
});

onMounted(() => {});

watch(
	() => formData.accelerationUnit,
	(newUnit, oldUnit) => {
		formData.acceleration = convertUnitValue(
			formData.acceleration,
			newUnit,
			oldUnit,
		);
	},
);

watch(
	() => formData.maxVelocityUnit,
	(newUnit, oldUnit) => {
		formData.maxVelocity = convertUnitValue(
			formData.maxVelocity,
			newUnit,
			oldUnit,
		);
	},
);

watch(
	() => formData.decelerationUnit,
	(newUnit, oldUnit) => {
		formData.deceleration = convertUnitValue(
			formData.deceleration,
			newUnit,
			oldUnit,
		);
	},
);

watch(
	() => formData.shipMassUnit,
	(newUnit, oldUnit) => {
		formData.shipMass = convertUnitValue(
			formData.shipMass,
			newUnit,
			oldUnit,
		);
	},
);

function updateTravelDistance() {
	const location = travelLocations.find(
		(loc) => loc.value === formData.exampleLocation.value,
	);

	if (location) formData.distance = location.distance;
}

function updateEngine() {
	const engine = exampleEngines.find(
		(eng) => eng.value === formData.exampleEngine.value,
	);

	if (engine) {
		const convertedAccel = convertUnitValue(
			engine.acceleration,
			accelerationUnits[0],
			formData.accelerationUnit,
			5,
		);

		formData.acceleration = convertedAccel;

		const convertedMaxVelocity = convertUnitValue(
			engine.maxVelocity,
			formData.maxVelocityUnit,
			highSpeedUnits[0],
			5,
		);

		formData.maxVelocity = convertedMaxVelocity;

		const convertedDecel = convertUnitValue(
			engine.deceleration,
			accelerationUnits[0],
			formData.decelerationUnit,
			5,
		);

		formData.deceleration = convertedDecel;

		formData.fuelEfficiency = engine.fuelEfficiency;
	}
}
</script>
<style></style>
