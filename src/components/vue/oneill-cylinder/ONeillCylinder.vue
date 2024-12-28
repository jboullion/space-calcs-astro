<template>
	<div id="oneill__app" class="row justify-content-center calculator">
		<div id="oneill__form" class="col-lg-4">
			<div class="p-2 rounded border mb-5">
				<ONeillForm v-model="formData" />
			</div>
		</div>
		<div id="oneill__results" class="col-lg-8">
			<ONeillVisual :formData="formData" />

			<div class="p-2 rounded border mb-5">
				<ONeillResults :formData="formData" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import ONeillForm from './ONeillForm.vue';
import ONeillResults from './ONeillResults.vue';
import ONeillVisual from './ONeillVisual.vue';

import type { ONeillCylinderForm } from './types';
import {
	atmosphereCompositions,
	materials,
	populationDensityExamples,
} from './constants';

// TODO: Do we want to move the default value to "constants.ts"?
const formData = ref<ONeillCylinderForm>({
	structure: {
		radius: 10, // km
		cylinderLength: 100, // km
		surfaceGravity: 0.3, // g
		internalPressure: 101, // kPa
		internalTemperature: 0, // C
		airMix: atmosphereCompositions[1],
		material: materials[1],
		safetyFactor: 1.3,
		shellWallThickness: 20.0, // m
		minShieldingShellMass: 0.0, // kg/m2
		internalStructureMass: 200.0, // kg/m2
		caps: {
			name: 'Flat',
			value: 'flat',
		},
	},
	internal: {
		levelHeight: 50, // m
		levels: 20,
		floorMaterial: materials[1],
	},
	landUse: {
		urbanDensity: 10,
		agriculturalDensity: 60,
		industrialDensity: 10,
		// unusedDensity: number; // % calculated
		urbanDensityExample: populationDensityExamples[5],
	},
	movementOptions: {
		movementType: 'rotating',
		rotationSpeed: 1, // rpm
		rotationDirection: 'clockwise',
	},
	diet: {},
});
</script>
