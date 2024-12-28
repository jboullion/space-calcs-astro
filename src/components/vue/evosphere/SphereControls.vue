<template>
	<div class="p-2 rounded border mb-5">
		<div class="calc-form">
			<InputWrapper
				id="rotationSpeed"
				label="Rotation Speed"
				description="Speed of automatic rotation"
			>
				<template v-slot:input>
					<NumberInput
						id="rotationSpeed"
						v-model.number="localControls.rotationSpeed"
						:min="0"
						:max="5"
						:step="0.1"
					/>
				</template>
			</InputWrapper>

			<InputWrapper
				id="radius"
				label="Sphere Radius"
				description="Size of the sphere"
			>
				<template v-slot:input>
					<NumberInput
						id="radius"
						v-model.number="localControls.radius"
						:min="100"
						:max="300"
						:step="10"
					/>
				</template>
			</InputWrapper>

			<div class="d-flex gap-2 mt-3">
				<button
					class="btn btn-primary"
					@click="$emit('toggle-rotation')"
				>
					{{
						controls.isRotating ? 'Stop Rotation' : 'Start Rotation'
					}}
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import InputWrapper from '../forms/v2/InputWrapper.vue';
import NumberInput from '../forms/v2/NumberInput.vue';
import type { ISphereControls } from './types';

const props = defineProps<{
	controls: ISphereControls;
}>();

const emit = defineEmits<{
	(e: 'update:controls', controls: ISphereControls): void;
	(e: 'toggle-rotation'): void;
}>();

const localControls = ref<ISphereControls>({ ...props.controls });

watch(
	localControls,
	(newValue) => {
		emit('update:controls', newValue);
	},
	{ deep: true },
);
</script>
