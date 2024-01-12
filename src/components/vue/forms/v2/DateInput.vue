<template>
	<InputWrapper id="destinationOrbit" label="Ship Mass" description="">
		<template v-slot:input>
			<input
				ref="dateInput"
				:min="internalMin"
				:max="internalMax"
				type="date"
				class="form-control"
				:value="internalValue"
				@change="($event) => updateValue($event)"
			/>
		</template>
	</InputWrapper>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, onMounted, ref, watch } from 'vue';
import { createDateFromDate, createDateFromInput } from '../../utils';
import InputWrapper from './InputWrapper.vue';
import { useAttrs } from 'vue';

//const attrs = useAttrs();

const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
	modelValue: Date;
	min?: Date;
	max?: Date;
}>();

const internalValue = ref<string>();
const dateInput = ref(null);
const internalMin = computed(() => {
	if (!props.min) return '';
	return createDateFromDate(props.min).toISOString().slice(0, 10);
});
const internalMax = computed(() => {
	if (!props.max) return '';
	return createDateFromDate(props.max).toISOString().slice(0, 10);
});

onMounted(() => {
	internalValue.value = createDateFromDate(props.modelValue)
		.toISOString()
		.slice(0, 10);
});
const updateValue = (event: Event) => {
	const target = event.target as HTMLInputElement;
	const newDate = target.value;

	// // Clamp our value between our min and max
	// const clampedDate = clampNumber(
	// 	new Date(value).getTime(),
	// 	new Date(internalMin.value).getTime(),
	// 	new Date(internalMax.value).getTime()
	// );

	const date = createDateFromInput(newDate);

	emit('update:modelValue', date);
};
</script>
