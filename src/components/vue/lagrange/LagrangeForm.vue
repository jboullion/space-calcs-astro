<template>
    <div class="calc-form">
        <SelectInput
            id="relationship"
            label="Mass Relationship"
            v-model="formData.relationship"
            :options="relationships"
            @update:modelValue=""
        />

        <NumberInput
            id="massOne"
            label="Mass One"
            v-model.number="formData.massOne"
            :step="1"
            :min="1"
            :max="1000"
            unit="M<sub>⊙</sub>"
        />

        <NumberInput
            id="massTwo"
            label="Mass Two"
            v-model.number="formData.massTwo"
            :step="1"
            :min="1"
            :max="1000"
            unit="M<sub>⊕</sub>"
        />

        <NumberInput
            id="distance"
            label="Distance"
            v-model.number="formData.distance"
            :step="0.1"
            :min="0.1"
            :max="100"
            unit="au"
        />
    </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from 'vue';
import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import type { ILagrangeForm } from './types';

const props = defineProps<{
    formData: ILagrangeForm;
}>();

const relationships = [
    {
        name: 'Star and Planet',
        value: 'star',
    },
    {
        name: 'Planet and Moon',
        value: 'moon',
    },
];

onMounted(() => {});
</script>
