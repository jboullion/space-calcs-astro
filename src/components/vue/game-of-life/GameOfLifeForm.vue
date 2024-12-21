<template>
	<div class="p-2 rounded border mb-5">
		<div class="calc-form">
			<InputWrapper
				id="gridSize"
				label="Grid Size"
				description="Size of the game grid (N x N)"
			>
				<template v-slot:input>
					<NumberInput
						id="gridSize"
						v-model.number="formData.gridSize"
						:min="5"
						:max="50"
						:step="1"
					/>
				</template>
			</InputWrapper>

			<InputWrapper
				id="speed"
				label="Speed"
				description="Updates per second"
			>
				<template v-slot:input>
					<NumberInput
						id="speed"
						v-model.number="formData.speed"
						:min="1"
						:max="60"
						:step="1"
					/>
				</template>
			</InputWrapper>

			<div class="d-flex gap-2 mt-3">
				<button class="btn btn-primary" @click="$emit('toggle-game')">
					{{ formData.isRunning ? 'Stop' : 'Start' }}
				</button>
				<button class="btn btn-secondary" @click="$emit('clear-grid')">
					Clear
				</button>
				<button
					class="btn btn-secondary"
					@click="$emit('randomize-grid')"
				>
					Randomize
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import InputWrapper from '../forms/v2/InputWrapper.vue';
import NumberInput from '../forms/v2/NumberInput.vue';
import type { IGameOfLifeForm } from './types';

defineProps<{
	formData: IGameOfLifeForm;
}>();

defineEmits<{
	(e: 'toggle-game'): void;
	(e: 'clear-grid'): void;
	(e: 'randomize-grid'): void;
}>();
</script>
