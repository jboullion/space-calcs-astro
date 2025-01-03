<template>
	<div class="hyperion-form">
		<NumberInput
			id="radius"
			label="Radius"
			v-model="model.structure.radius"
			:step="0.1"
			:min="0.1"
			:max="100"
			unit="km"
		/>

		<NumberInput
			id="length"
			label="Length"
			v-model="model.structure.length"
			:step="0.1"
			:min="0.1"
			:max="100"
			unit="km"
		/>
	</div>
</template>

<script setup lang="ts">
import NumberInput from '../forms/NumberInput.vue';
import type { IHyperionFormData } from './types';

const model = defineModel<IHyperionFormData>({ required: true });
</script>

<style scoped></style>
