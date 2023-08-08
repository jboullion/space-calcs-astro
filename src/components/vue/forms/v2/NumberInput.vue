<template>
    <input
        ref="numberInput"
        :id="id"
        v-bind="attrs"
        type="number"
        class="form-control"
        :value="internalValue"
        :min="min"
        :max="max"
        :step="step"
        @change="($event) => updateValue($event)"
    />
</template>

<script setup lang="ts">
// TODO: Update to use the input wrapper
import { computed, onBeforeMount, ref, watch } from 'vue';
import { clampNumber } from '../../utils';

const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
    id: string;
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
    attrs?: Record<string, unknown>;
}>();

const internalValue = ref<string>(props.modelValue.toString());
const numberInput = ref(null);

onBeforeMount(() => {});

const updateValue = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);

    let clampedValue = clampNumber(
        value,
        props.min ?? -Infinity,
        props.max ?? Infinity,
    );

    internalValue.value = clampedValue.toString();

    if (
        numberInput.value &&
        internalValue.value === props.modelValue.toString()
    ) {
        // @ts-ignore
        numberInput.value.value = String(clampedValue);
    }

    emit('update:modelValue', clampedValue);
};
</script>
