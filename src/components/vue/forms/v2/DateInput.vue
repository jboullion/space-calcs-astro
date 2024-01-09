<template>
	<InputWrapper id="destinationOrbit" label="Ship Mass" description="">
		<template v-slot:input>
			<input
				ref="dateInput"
				v-bind="attrs"
				type="date"
				class="form-control"
				:value="internalValue"
				@change="($event) => updateValue($event)"
			/>
		</template>
	</InputWrapper>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue';
import { clampNumber } from '../../utils';
import InputWrapper from './InputWrapper.vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
	modelValue: Date;
	attrs?: Record<string, unknown>;
}>();

const internalValue = ref<string>(props.modelValue.toISOString().slice(0, 10));
const dateInput = ref(null);

onBeforeMount(() => {});

const updateValue = (event: Event) => {
	const target = event.target as HTMLInputElement;
	const value = target.value;

	// let clampedValue = clampNumber(
	//     value,
	//     props.min ?? -Infinity,
	//     props.max ?? Infinity,
	// );
	// internalValue.value = clampedValue.toString();
	// if (
	//     numberInput.value &&
	//     internalValue.value === props.modelValue.toString()
	// ) {
	//     // @ts-ignore
	//     numberInput.value.value = String(clampedValue);
	// }
	emit('update:modelValue', value);
};
</script>
