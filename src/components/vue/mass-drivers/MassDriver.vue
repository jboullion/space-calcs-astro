<template>
    <div id="mass-driver__app" class="row justify-content-center calculator">
        <div id="mass-driver__form" class="col-lg-4">
            <div class="p-2 rounded border mb-5">
                <MassDriverForm :formData="formData" />
            </div>
        </div>
        <div id="mass-driver__results" class="col-lg-8">
            <MassDriverResults :formData="formData" />
            <MassDriverVisual :formData="formData" />
        </div>
    </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { onMounted, reactive, watch } from 'vue';

import MassDriverForm from './MassDriverForm.vue';
import MassDriverVisual from './MassDriverVisual.vue';
import MassDriverResults from './MassDriverResults.vue';

import type { IMassDriverForm } from './types';
import { convertUnitValue, meterUnits } from '../utils';
import { NumberUnits } from '../forms/types';

const formData = reactive<IMassDriverForm>({
    bodyRadius: 6378, //km
    bodyRadiusUnit: meterUnits[1], // km
    bodyDensity: 5.51, // g/cm³
    acceleration: 9.81, // m/s²  Optional gravity (g)
});

onMounted(() => {});

watch(
    () => formData.bodyRadiusUnit,
    (newUnit, oldUnit) => {
        formData.bodyRadius = convertUnitValue(
            formData.bodyRadius,
            newUnit,
            oldUnit,
        );
    },
);
</script>
<style></style>
