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
                v-if="unit && !Array.isArray(units)"
                class="input-group-text bg-dark text-white"
                v-html="unit"
            ></span>
            <select
                v-if="Array.isArray(units)"
                class="form-select bg-dark text-white"
                v-model="internalUnit"
                @change="$emit('updateUnit', internalUnit)"
            >
                <option
                    v-for="unitOption in units"
                    :value="unitOption"
                    v-html="unitOption.label"
                ></option>
            </select>
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
import { computed, onBeforeMount, ref, watch } from 'vue';
import { clampNumber } from '../utils';
import Tooltip from './Tooltip.vue';
import type { NumberUnits } from './types';

const emit = defineEmits(['update:modelValue', 'updateUnit']);

const props = defineProps<{
    id: string;
    label: string;
    modelValue: number;
    unit?: string;
    units?: NumberUnits[];
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
const internalUnit = ref<NumberUnits>();
const numberInput = ref(null);
const currentUnit = ref<NumberUnits>();

onBeforeMount(() => {
    if (props.units) {
        internalUnit.value = props.units[0];
        currentUnit.value = internalUnit.value;
    }
});

const updateValue = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = Number(target.value);

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

// const updateUnit = () => {
//     emit('updateUnit', internalUnit);
// };

// // Watch prop value change and assign to value 'selected' Ref
// watch(
//   () => props.modelValue,
//   (newValue: number) => {
//     internalValue.value = newValue.toString();
//   }
// );
</script>
