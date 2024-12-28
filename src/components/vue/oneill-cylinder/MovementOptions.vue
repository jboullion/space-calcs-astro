<template>
	<div id="movementOptions" class="py-2">
		<NumberInput
			id="rotationSpeed"
			label="Rotation Speed"
			v-model="model.rotationSpeed"
			:step="0.01"
			:min="0.01"
			:max="100"
			:description="`Inner force: ${formatNumber(innerGForce, 2)} g<br />
Outer force: ${formatNumber(outerGForce, 2)} g`"
			unit="rpm"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import NumberInput from '../forms/NumberInput.vue';
import type { IMovementOptions, IStructure, IInternalFloors } from './types';
import { calcGForceFromRPM } from './functions';
import { formatNumber } from '../utils';

const props = defineProps<{
	structure: IStructure;
	internal: IInternalFloors;
}>();

// Using defineModel instead of props + emit
const model = defineModel<IMovementOptions>({ required: true });

// Calculate outer G-force (at cylinder wall)
const outerGForce = computed(() => {
	return calcGForceFromRPM(model.value.rotationSpeed, props.structure.radius);
});

// Calculate inner G-force (at innermost floor)
const innerGForce = computed(() => {
	const innerRadius =
		props.structure.radius -
		props.structure.shellWallThickness / 1000 -
		(props.internal.levelHeight * props.internal.levels) / 1000;
	return calcGForceFromRPM(model.value.rotationSpeed, innerRadius);
});
</script>
