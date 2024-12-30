<template>
	<div id="oneill__app" class="row justify-content-center calculator">
		<div id="oneill__form" class="col-lg-5">
			<div class="d-flex mb-3">
				<div class="nav flex-column nav-pills me-2" role="tablist">
					<button
						v-for="tab in tabs"
						:key="tab.id"
						class="nav-link mb-2 text-start rounded border"
						:class="{
							'active border-primary': currentTab === tab.id,
						}"
						:aria-current="currentTab === tab.id"
						@click="currentTab = tab.id"
						:id="tab.id"
						type="button"
					>
						{{ tab.label }}
					</button>
				</div>

				<div class="p-2 rounded border flex-grow-1">
					<ONeillForm v-model="formData" :currentTab="currentTab" />
				</div>
			</div>
		</div>
		<div id="oneill__results" class="col-lg-7">
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

import type { IONeillTabs, ONeillCylinderForm } from './types';
import {
	atmosphereCompositions,
	materials,
	ONEILL_TABS,
	populationDensityExamples,
} from './constants';

const currentTab = ref<IONeillTabs>(ONEILL_TABS.structure);

const tabs = [
	{ id: ONEILL_TABS.structure, label: 'Structure' },
	{ id: ONEILL_TABS.internal, label: 'Floors' },
	{ id: ONEILL_TABS.movement, label: 'Movement' },
	{ id: ONEILL_TABS.population, label: 'Population' },
	{ id: ONEILL_TABS.land, label: 'Land Use' },
];

// TODO: Do we want to move the default value to "constants.ts"?
const formData = ref<ONeillCylinderForm>({
	structure: {
		radius: 1, // km
		cylinderLength: 1, // km
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
		levels: 10,
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
