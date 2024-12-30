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

			<Population
				v-show="currentTab == ONEILL_TABS.population"
				v-model="model.population"
				:structure="model.structure"
				:internal="model.internal"
			/>

			<LandUse
				v-show="currentTab == ONEILL_TABS.land"
				:landUse="model.landUse"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { IONeillTabs, ONeillCylinderForm } from './types';
import StructureTab from './StructureTab.vue';
import InternalFloors from './InternalFloors.vue';
import LandUse from './LandUse.vue';
import MovementOptions from './MovementOptions.vue';
import { ONEILL_TABS } from './constants';

const model = defineModel<ONeillCylinderForm>({ required: true });

const props = defineProps<{
	currentTab: IONeillTabs;
}>();
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
