<template>
    <div class="mb-3">
        <label v-if="label" :for="id" class="form-label" v-html="label"></label>
        <Tooltip v-if="tooltip" :tooltip="tooltip" />
        <div class="input-group">
            <span
                v-if="prefix"
                class="input-group-text bg-dark text-white"
                v-html="prefix"
            ></span>
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
            <span
                v-if="unit"
                class="input-group-text bg-dark text-white"
                v-html="unit"
            ></span>
        </div>
        <input
            v-if="showRange"
            :id="id + '-range'"
            type="range"
            class="form-range"
            :min="min"
            :max="max"
            :step="step"
            :value="internalValue"
            @input="($event) => updateValue($event)"
        />
        <p v-if="description" class="description">
            <small class="text-muted" v-html="description"></small>
        </p>
    </div>
</template>

<script setup lang="ts">
// TODO: Update to use the input wrapper
import { computed, onBeforeMount, ref, watch } from 'vue';
import { clampNumber, formatNumber } from '../utils';
import Tooltip from './Tooltip.vue';

const emit = defineEmits(['update:modelValue', 'updateUnit']);

const props = defineProps<{
    id: string;
    label: string;
    modelValue: number;
    unit?: string;
    prefix?: string;
    tooltip?: string;
    description?: string;
    min?: number;
    max?: number;
    step?: number;
    showRange?: boolean;
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
