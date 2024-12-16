<template>
	<div id="internalFloors" class="py-2">
		<NumberInput
			id="floorHeight"
			label="Floor Height"
			v-model.number="internal.levelHeight"
			:step="1"
			:min="4"
			:max="maxLevelHeight"
			:description="`Min: 10m, Maximum: ${maxLevelHeight}m`"
			unit="m"
			@change="updateLevelHeight"
		/>

		<NumberInput
			id="floors"
			:key="levelsKey"
			label="# Floors"
			v-model.number="internal.levels"
			:step="1"
			:min="1"
			:max="maxLevels"
			:description="`Max Levels: ${maxLevels}`"
		/>

		<SelectInput
			id="floorMaterial"
			label="Floor Material"
			v-model="internal.floorMaterial"
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

import type { InternalFloors, Structure } from './types';
import { materials } from './constants';

const props = defineProps<{
	internal: InternalFloors;
	structure: Structure;
}>();

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

const updateLevelHeight = () => {
	if (props.internal.levels > maxLevels.value) {
		props.internal.levels = maxLevels.value;
	} else if (props.internal.levels < 1) {
		props.internal.levels = 1;
	}

	levelsKey.value += 1;
};

const innerRadius = computed(() => {
	updateLevelHeight();
	return props.structure.radius * 1000 - props.structure.shellWallThickness;
});

watch(props.structure, () => {
	updateLevelHeight();
});
</script>
