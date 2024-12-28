<template>
	<div id="movementOptions" class="py-2">
		<NumberInput
			id="rotationSpeed"
			label="Rotation Speed"
			v-model="model.rotationSpeed"
			:step="0.1"
			:min="0.1"
			:max="100"
			unit="rpm"
		/>
	</div>
</template>

<script setup lang="ts">
import NumberInput from '../forms/NumberInput.vue';
import type { IMovementOptions } from './types';

// Using defineModel instead of props + emit
const model = defineModel<IMovementOptions>({ required: true });
</script>
