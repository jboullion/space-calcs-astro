<template>
	<div
		class="btn-group w-100 mb-2"
		role="group"
		aria-label="Vertical radio toggle button group"
	>
		<template v-for="(tab, index) in tabs">
			<input
				type="radio"
				class="btn-check"
				name="vbtn-radio"
				:value="tab.id"
				v-model="currentTab"
				:id="tab.id"
				autocomplete="off"
				:checked="index == 0"
			/>
			<label class="btn btn-outline-primary" :for="tab.id">{{
				tab.label
			}}</label>
		</template>
	</div>
	<div class="calc-form">
		<StructureTab
			v-show="currentTab == 'structureTab'"
			v-model="model.structure"
			:internal="model.internal"
		/>

		<InternalFloors
			v-show="currentTab == 'internalFloors'"
			v-model="model.internal"
			:structure="model.structure"
		/>

		<MovementOptions
			v-show="currentTab == 'movementOptions'"
			v-model="model.movementOptions"
		/>

		<LandUse v-show="currentTab == 'landUse'" :landUse="model.landUse" />
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import type { ONeillCylinderForm } from './types';

import StructureTab from './StructureTab.vue';
import InternalFloors from './InternalFloors.vue';
import LandUse from './LandUse.vue';
import MovementOptions from './MovementOptions.vue';

const currentTab = ref<
	'structureTab' | 'internalFloors' | 'movementOptions' | 'landUse'
>('structureTab');

const tabs = [
	{
		id: 'structureTab',
		label: 'Structure',
	},
	{
		id: 'internalFloors',
		label: 'Floors',
	},
	{
		id: 'movementOptions',
		label: 'Movement',
	},
	// {
	//   id: "landUse",
	//   label: "Land Use",
	// },
];

const emit = defineEmits(['update:modelValue']);

const model = defineModel<ONeillCylinderForm>({ required: true });
</script>
