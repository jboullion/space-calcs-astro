<template>
    <select
        class="form-select bg-dark text-white"
        :value="props.modelValue.label"
        @change="($event) => updateValue($event)"
    >
        <option
            v-for="unitOption in units"
            :value="unitOption.label"
            :selected="unitOption.label === props.modelValue.label"
            v-html="unitOption.label"
        ></option>
    </select>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { NumberUnits } from '../types';

const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
    id: string;
    modelValue: NumberUnits;
    units: NumberUnits[];
}>();

const updateValue = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = target.value as string;

    const newUnit =
        props.units.find((unit) => unit.label === value) ?? props.units[0];

    console.log('UnitSelect: updateValue', newUnit);

    emit('update:modelValue', newUnit);
};
</script>
