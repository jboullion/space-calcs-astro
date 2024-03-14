<template>
	<div class="calc-form">
		<!-- <SelectInput
            id="relationship"
            label="Mass Relationship"
            v-model="formData.relationship"
            :options="relationships"
            @update:modelValue=""
        />

        <NumberInput
            id="massOne"
            label="Mass One"
            :key="`one-${formData.massOne}`"
            v-model.number="formData.massOne"
            :step="0.1"
            :min="0.1"
            :max="1000"
            :unit="getMassOneUnit"
            :description="getMassOneDescription"
        /> -->
	</div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from 'vue';
import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import type { ISyrtisForm } from './types';
import { physicsConstants, formatNumber } from '../utils';

const props = defineProps<{
	formData: ISyrtisForm;
}>();
</script>
