<template>
	<div id="movementOptions" class="py-2">
		<CheckboxInput
			id="showVisuals"
			label="Show Visuals"
			v-model="model.showVisuals"
		/>
	</div>
</template>

<script setup lang="ts">
import CheckboxInput from '../forms/CheckboxInput.vue';
import type { IVisuals } from './types';

const props = defineProps<{
	visuals: IVisuals;
}>();

const model = defineModel<IVisuals>({ required: true });
</script>
