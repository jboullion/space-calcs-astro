<template>
    <div class="calc-form">
        <NumberInput
            id="bodyRadius"
            label="Body Radius"
            :key="`one-${formData.bodyRadius}`"
            v-model.number="formData.bodyRadius"
            :step="0.1"
            :min="0.1"
            :max="1000"
            unit=""
            description=""
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
import type { IMassDriverForm } from './types';
import { physicsConstants, formatNumber } from '../utils';

const props = defineProps<{
    formData: IMassDriverForm;
}>();

onMounted(() => {});
</script>
