<template>
    <div id="star-travel__app" class="row justify-content-center calculator">
        <div id="star-travel__form" class="col-lg-4">
            <StarTravelForm :formData="formData" />
        </div>
        <div id="star-travel__results" class="col-lg-8">
            <StarTravelResults :formData="formData" />
        </div>
    </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { onMounted, reactive, watch } from 'vue';

import StarTravelForm from './StarTravelForm.vue';
import StarTravelResults from './StarTravelResults.vue';

import type { IStarTravelForm } from './types';
import {
    accelerationUnits,
    convertUnitValue,
    massUnits,
    lengthUnits,
    highSpeedUnits,
} from '../utils';
import { NumberUnits } from '../forms/types';

const formData = reactive<IStarTravelForm>({
    distance: 4.22, // light years
    acceleration: 9.81, // m/s²
    accelerationUnit: accelerationUnits[0], // m/s²
    maxVelocity: 0.1, // c
    maxVelocityUnit: highSpeedUnits[4], // c
    deceleration: 9.81, // m/s²
    decelerationUnit: accelerationUnits[0], // m/s²
    shipMass: 1000, // ton
    shipMassUnit: massUnits[2], // ton
});

onMounted(() => {});

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
    () => formData.maxVelocityUnit,
    (newUnit, oldUnit) => {
        formData.maxVelocity = convertUnitValue(
            formData.maxVelocity,
            newUnit,
            oldUnit,
        );
    },
);

watch(
    () => formData.decelerationUnit,
    (newUnit, oldUnit) => {
        formData.deceleration = convertUnitValue(
            formData.deceleration,
            newUnit,
            oldUnit,
        );
    },
);

watch(
    () => formData.shipMassUnit,
    (newUnit, oldUnit) => {
        formData.shipMass = convertUnitValue(
            formData.shipMass,
            newUnit,
            oldUnit,
        );
    },
);
</script>
<style></style>
