<template>
    <div>
        <h2>Results</h2>
        <div>
            <table class="table">
                <tbody>
                    <tr>
                        <td>Total Radius in Meters</td>
                        <td class="text-end">
                            {{ formatNumber(convertedRadius) }} m
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { IMassDriverForm } from './types';

import { formatNumber, physicsConstants, roundToDecimal } from '../utils';

const props = defineProps<{
    formData: IMassDriverForm;
}>();

const convertedRadius = computed(() => {
    const conversionValue =
        props.formData.bodyRadiusUnit.value * props.formData.bodyRadius;
    return conversionValue;
});
</script>
