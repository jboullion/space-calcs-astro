<template>
	<div id="se-form" class="py-2">
		<NumberInput
			id="planet-radius"
			label="Planet Radius"
			v-model.number="formData.planetRadius"
			:step="1"
			:min="100"
			:max="10000000"
			unit="km"
			:description="`Surface Gravity: ${formatNumber(
				planetGravity,
				2,
			)} m/s²`"
		/>

		<NumberInput
			id="planet-density"
			label="Planet Density"
			v-model.number="formData.planetDensity"
			:step="0.1"
			:min="0.1"
			:max="1000000"
			unit="g/cm³"
			:description="`Planet Mass: ${planetMass.toExponential(2)} kg`"
		/>

		<NumberInput
			id="planet-rotation"
			label="Planet Rotation"
			v-model.number="formData.planetRotation"
			:step="1"
			:min="1"
			:max="1000"
			unit="hours"
			:description="`Geostationary Orbit: ${formatNumber(
				geostationaryOrbit,
				2,
			)} km`"
		/>

		<NumberInput
			id="car-speed"
			label="Car Speed"
			v-model.number="formData.carSpeed"
			:step="1"
			:min="1"
			:max="1000"
			unit="km/h"
			:description="`Travel Time: ${formatNumber(
				carTravelTimeTotalHours,
				2,
			)} hours`"
		/>

		<NumberInput
			id="payloadMass"
			label="Payload + Car Mass"
			v-model.number="formData.payloadMass"
			:step="1"
			:min="1"
			:max="10000"
			unit="tonne"
			:description="`Required Energy: ${formatNumber(
				energyRequired,
			)} MWh`"
		/>

		<SelectInput
			id="material"
			label="Material"
			v-model="formData.material"
			:options="materials"
			tooltip=""
			:description="`Max Tensile Strength: ${formatNumber(
				formData.material.tensileStrength,
			)} Mpa<br />Minimum Mass: ${estimatedTotalMass.toExponential(
				2,
			)} kg`"
			@update:modelValue=""
		/>

		<NumberInput
			id="safety-factor"
			label="Safety Factor"
			v-model.number="formData.safetyFactor"
			:step="0.1"
			:min="1"
			:max="10"
			:description="`Cross Sectional Area: ${formatNumber(
				crossSectionalArea,
			)} m<sup>2</sup><br />Cylinder Radius: ${formatNumber(
				estimatedTetherRadius,
			)} m`"
		/>
	</div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { SpaceElevatorForm } from './types';
import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import { materials } from './constants';
import { energyUnits, formatNumber, physicsConstants } from '../utils';

const props = defineProps<{
	formData: SpaceElevatorForm;
	planetGravity: number;
	planetMass: number;
	crossSectionalArea: number;
	geostationaryOrbit: number;
}>();

const elevatorTopHeight = computed(() => {
	return props.geostationaryOrbit + props.formData.planetRadius;
});

const carTravelTimeTotalHours = computed(() => {
	return (
		(elevatorTopHeight.value - props.formData.planetRadius) /
		props.formData.carSpeed
	);
});

const estimatedTetherRadius = computed(() => {
	const radius = Math.sqrt(props.crossSectionalArea / Math.PI);
	return radius;
});

const estimatedTotalMass = computed(() => {
	// Calculate tether volume using its cross-sectional area
	const tetherVolume = props.crossSectionalArea * elevatorTopHeight.value;

	// Calculate tether mass based on its volume and density
	const tetherMass = props.formData.material.density * tetherVolume;

	// Calculate total mass by summing up tether, payload, and counterweight masses
	const totalMass =
		tetherMass +
		(props.formData.payloadMass * 1000 ?? 10000) +
		props.formData.counterweightMass;

	return totalMass;
});

const energyRequired = computed(() => {
	// Calculate the change in potential energy
	const potentialEnergyChange =
		props.formData.payloadMass *
		1000 *
		physicsConstants.g *
		props.geostationaryOrbit;

	// Convert speed to meters per second
	const speedMetersPerSecond = (props.formData.carSpeed * 1000) / 3600; // Convert from km/h to m/s

	// Calculate the kinetic energy gained due to speed
	const kineticEnergyChange =
		0.5 * props.formData.payloadMass * speedMetersPerSecond ** 2;

	// Total energy required is the sum of potential and kinetic energy changes
	const requiredEnergy = potentialEnergyChange + kineticEnergyChange;
	return requiredEnergy / energyUnits[8].value;
});
</script>
