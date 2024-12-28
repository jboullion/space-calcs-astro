<template>
	<div id="internalFloors" class="py-2">
		<NumberInput
			id="floorHeight"
			label="Floor Height"
			:model-value.number="internal.levelHeight"
			@update:model-value="updateLevelHeight"
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
			:model-value.number="internal.levels"
			@update:model-value="updateLevels"
			:step="1"
			:min="1"
			:max="maxLevels"
			:description="`Max Levels: ${maxLevels}`"
		/>

		<SelectInput
			id="floorMaterial"
			label="Floor Material"
			:model-value="internal.floorMaterial"
			@update:model-value="updateFloorMaterial"
			:options="materials"
		/>

		<!-- <div class="table-wrapper">
      <table class="table">
        <tbody>
          <tr>
            <td>Floors Mass:<br />{{ formatNumber(floorsMass) }} ton</td>
          </tr>
          <tr>
            <td>Floors Area:<br />{{ formatNumber(floorsArea) }} m2</td>
          </tr>
          <tr>
            <td>
              Upper Level Gravity:<br />{{ formatNumber(upperLevelGravity) }} G
            </td>
          </tr>
        </tbody>
      </table>
    </div> -->
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';

import type { IInternalFloors, IStationMaterial, IStructure } from './types';
import { materials } from './constants';

const props = defineProps<{
	internal: IInternalFloors;
	structure: IStructure;
}>();

const emit = defineEmits(['update:modelValue']);

const levelsKey = ref(0);

const maxLevels = computed(() => {
	const defaultMax = 100;

	const result = Math.min(
		Math.ceil(innerRadius.value / props.internal.levelHeight),
		defaultMax,
	);

	if (
		result < props.internal.levels ||
		(props.internal.levels == 0 && result > 0)
	) {
		props.internal.levels = result;
	}

	return result;
});

const maxLevelHeight = computed(() => {
	//const defaultMax = props.structure.radius * 1000 / 2;

	return Math.floor((props.structure.radius * 1000) / 2);
});

const innerRadius = computed(() => {
	updateLevelHeight();
	return props.structure.radius * 1000 - props.structure.shellWallThickness;
});

const updateLevelHeight = () => {
	let newLevels = props.internal.levels;
	if (props.internal.levels > maxLevels.value) {
		newLevels = maxLevels.value;
	} else if (props.internal.levels < 1) {
		newLevels = 1;
	}

	if (newLevels !== props.internal.levels) {
		emit('update:modelValue', {
			...props.internal,
			levels: newLevels,
		});
	}

	levelsKey.value += 1;
};

function updateLevels(value: number) {
	emit('update:modelValue', {
		...props.internal,
		levels: value,
	});
}

function updateFloorMaterial(value: IStationMaterial) {
	emit('update:modelValue', {
		...props.internal,
		floorMaterial: value,
	});
}

watch(props.structure, () => {
	updateLevelHeight();
});
</script>
