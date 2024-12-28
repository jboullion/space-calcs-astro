<template>
	<div id="internalFloors" class="py-2">
		<NumberInput
			id="floorHeight"
			label="Floor Height"
			v-model="model.levelHeight"
			:step="1"
			:min="4"
			:max="maxLevelHeight"
			:description="`Min: 10m, Maximum: ${maxLevelHeight}m`"
			unit="m"
		/>

		<NumberInput
			id="floors"
			:key="levelsKey"
			label="# Floors"
			v-model="model.levels"
			:step="1"
			:min="1"
			:max="maxLevels"
			:description="`Max Levels: ${maxLevels}`"
		/>

		<SelectInput
			id="floorMaterial"
			label="Floor Material"
			v-model="model.floorMaterial"
			:options="materials"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import type { IInternalFloors, IStructure } from './types';
import { materials } from './constants';

const props = defineProps<{
	structure: IStructure;
}>();

const model = defineModel<IInternalFloors>({ required: true });

const levelsKey = ref(0);

const maxLevels = computed(() => {
	const defaultMax = 100;

	const result = Math.min(
		Math.ceil(innerRadius.value / model.value.levelHeight),
		defaultMax,
	);

	if (
		result < model.value.levels ||
		(model.value.levels == 0 && result > 0)
	) {
		model.value.levels = result;
	}

	return result;
});

const maxLevelHeight = computed(() => {
	return Math.floor((props.structure.radius * 1000) / 2);
});

const innerRadius = computed(() => {
	updateLevelHeight();
	return props.structure.radius * 1000 - props.structure.shellWallThickness;
});

const updateLevelHeight = () => {
	let newLevels = model.value.levels;
	if (model.value.levels > maxLevels.value) {
		newLevels = maxLevels.value;
	} else if (model.value.levels < 1) {
		newLevels = 1;
	}

	if (newLevels !== model.value.levels) {
		model.value = {
			...model.value,
			levels: newLevels,
		};
	}

	levelsKey.value += 1;
};

watch(props.structure, () => {
	updateLevelHeight();
});
</script>
