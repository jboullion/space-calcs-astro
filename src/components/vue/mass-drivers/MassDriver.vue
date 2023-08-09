<template>
    <div id="mass-driver__app" class="row justify-content-center calculator">
        <div id="mass-driver__form" class="col-lg-4">
            <div class="p-2 rounded border mb-5">
                <MassDriverForm :formData="formData" />
            </div>
        </div>
        <div id="mass-driver__results" class="col-lg-8">
            <MassDriverResults :formData="formData" />
        </div>
    </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { onMounted, reactive, watch } from 'vue';

import MassDriverForm from './MassDriverForm.vue';
import MassDriverResults from './MassDriverResults.vue';

import type { IMassDriverForm } from './types';
import {
    accelerationUnits,
    convertUnitValue,
    massUnits,
    lengthUnits,
} from '../utils';
import { NumberUnits } from '../forms/types';

const formData = reactive<IMassDriverForm>({
    bodyRadius: 6378, //km
    bodyRadiusUnit: lengthUnits[1], // km
    bodyDensity: 5.51, // g/cm³
    acceleration: 9.81, // m/s²
    accelerationUnit: accelerationUnits[0], // m/s²
    exitVelocity: 7674, // m/s²
    exitVelocityUnit: accelerationUnits[0], // m/s²
    payloadMass: 1000, // kg
    payloadMassUnit: massUnits[1], // kg
});

onMounted(() => {});

watch(
    () => formData.bodyRadiusUnit,
    (newUnit, oldUnit) => {
        formData.bodyRadius = convertUnitValue(
            formData.bodyRadius,
            newUnit,
            oldUnit,
            0,
        );
    },
);

watch(
    () => formData.accelerationUnit,
    (newUnit, oldUnit) => {
        formData.acceleration = convertUnitValue(
            formData.acceleration,
            newUnit,
            oldUnit,
        );
    },
);

watch(
    () => formData.exitVelocityUnit,
    (newUnit, oldUnit) => {
        formData.exitVelocity = convertUnitValue(
            formData.exitVelocity,
            newUnit,
            oldUnit,
        );
    },
);

watch(
    () => formData.payloadMassUnit,
    (newUnit, oldUnit) => {
        formData.payloadMass = convertUnitValue(
            formData.payloadMass,
            newUnit,
            oldUnit,
        );
    },
);
</script>
<style></style>
