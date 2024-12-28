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
			:structure="formData.structure"
			:internal="formData.internal"
			@update:model-value="updateStructure"
		/>

		<InternalFloors
			v-show="currentTab == 'internalFloors'"
			:internal="formData.internal"
			:structure="formData.structure"
			@update:model-value="updateInternalFloors"
		/>

		<MovementOptions
			v-show="currentTab == 'movementOptions'"
			v-model="formData.movementOptions"
		/>

		<LandUse v-show="currentTab == 'landUse'" :landUse="formData.landUse" />
	</div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from 'vue';

import type {
	ONeillCylinderForm,
	IInternalFloors,
	IMovementOptions,
	IStructure,
} from './types';

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

const props = defineProps<{
	formData: ONeillCylinderForm;
}>();

function updateStructure(value: IStructure) {
	emit('update:modelValue', {
		...props.formData,
		structure: value,
	});
}

function updateInternalFloors(value: IInternalFloors) {
	emit('update:modelValue', {
		...props.formData,
		internal: value,
	});
}

function updateMovementOptions(value: IMovementOptions) {
	emit('update:modelValue', {
		...props.formData,
		movementOptions: value,
	});
}
</script>
