<template>
	<div class="d-flex">
		<div class="calc-form flex-grow-1">
			<StructureTab
				v-show="currentTab == ONEILL_TABS.structure"
				v-model="model.structure"
				:internal="model.internal"
			/>

			<InternalFloors
				v-show="currentTab == ONEILL_TABS.internal"
				v-model="model.internal"
				:structure="model.structure"
			/>

			<MovementOptions
				v-show="currentTab == ONEILL_TABS.movement"
				v-model="model.movementOptions"
				:structure="model.structure"
				:internal="model.internal"
			/>

			<LandUse
				v-show="currentTab == ONEILL_TABS.land"
				:landUse="model.landUse"
				:totalArea="totalArea"
			/>

			<VisualTab
				v-show="currentTab == ONEILL_TABS.visuals"
				v-model="model.visuals"
				:visuals="model.visuals"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { IONeillTabs, ONeillCylinderForm } from './types';
import StructureTab from './StructureTab.vue';
import InternalFloors from './InternalFloors.vue';
import LandUse from './LandUse.vue';
import MovementOptions from './MovementOptions.vue';
import VisualTab from './VisualTab.vue';
import { ONEILL_TABS } from './constants';

const model = defineModel<ONeillCylinderForm>({ required: true });

const props = defineProps<{
	currentTab: IONeillTabs;
}>();

// Calculate total area for LandUse component
const shellFloorArea = computed(() => {
	return (
		model.value.structure.radius *
		2 *
		Math.PI *
		model.value.structure.cylinderLength
	);
});

const internalRadius = computed(() => {
	return (
		model.value.structure.radius -
		model.value.structure.shellWallThickness / 1000
	);
});

const floorsArea = computed(() => {
	if (model.value.internal.levels === 0) return 0;
	const circumference = 2 * Math.PI * internalRadius.value;
	return (
		circumference *
		model.value.structure.cylinderLength *
		model.value.internal.levels
	);
});

const totalArea = computed(() => shellFloorArea.value + floorsArea.value);
</script>

<style scoped>
.nav-link {
	color: var(--bs-body-color);
	background-color: var(--bs-light);
	border: 1px solid var(--bs-border-color);
}

.nav-link.active {
	background-color: var(--bs-primary);
	color: white;
	border-color: var(--bs-primary);
}

.nav-link:hover:not(.active) {
	background-color: var(--bs-gray-200);
}
</style>
