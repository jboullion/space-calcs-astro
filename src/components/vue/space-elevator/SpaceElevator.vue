<template>
    <div id="space-elevator__app" class="row" v-cloak>
        <div id="space-elevator__form" class="col-lg-4">
            <div class="calc-form col-12 mb-5 px-2 rounded border">
                <SEForm
                    :formData="formData"
                    :planetGravity="planetGravity"
                    :planetMass="planetMass"
                    :crossSectionalArea="crossSectionalArea"
                    :geostationaryOrbit="geostationaryOrbit"
                />
            </div>
        </div>
        <div id="space-elevator__results" class="col-lg-8 calc-form">
            <SEVisual
                :formData="formData"
                :crossSectionalArea="crossSectionalArea"
                :geostationaryOrbit="geostationaryOrbit"
            />
        </div>
    </div>
</template>
<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, ref } from 'vue';

import type { SpaceElevatorForm, SEMaterial } from './types';

import SEForm from './SEForm.vue';
import SEVisual from './SEVisual.vue';
import { materials } from './constants';
import {
    calculateGravitationalForce,
    calculateMaxTensileStress,
    physicsConstants,
} from '../utils';

const formData = ref<SpaceElevatorForm>({
    planetRadius: 6378.14,
    planetDensity: 5.514,
    planetGravity: 9.807,
    // planetMass: 5.972 * Math.pow(10, 24),
    // planetGravity: 9.807,
    planetRotation: 24,
    carSpeed: 200, //km/h
    payloadMass: 1000, //kg
    material: materials[4],
    safetyFactor: 1.3,
    counterweightMass: 10000,
});

const planetRadiusMeters = computed(() => {
    return formData.value.planetRadius * 1000;
});

const planetDensityKgPerM3 = computed(() => {
    return formData.value.planetDensity * 1000;
});

// const planetCircumference = computed(() => {
//     // C = 2πr
//     const result = 2 * Math.PI * formData.value.planetRadius;

//     return result;
// });

const planetMass = computed(() => {
    // M = (4/3) * π * r^3 * ρ
    const result =
        (4 / 3) *
        Math.PI *
        Math.pow(planetRadiusMeters.value, 3) *
        planetDensityKgPerM3.value;

    return result;
});

const planetGravity = computed(() => {
    // g = (G * M) / r^2
    const result =
        (physicsConstants.gravityConstant * planetMass.value) /
        Math.pow(planetRadiusMeters.value, 2);

    return result;
});

const rotationInSeconds = computed(() => {
    const result = formData.value.planetRotation * 60 * 60;

    return result;
});

const geostationaryOrbit = computed(() => {
    // h = (G * M * T^2 / 4π^2)^(1/3) - R

    const result =
        Math.pow(
            (physicsConstants.gravityConstant *
                planetMass.value *
                Math.pow(rotationInSeconds.value, 2)) /
                (4 * Math.pow(Math.PI, 2)),
            1 / 3,
        ) - planetRadiusMeters.value;

    // measured in kilometers
    return result / 1000;
});

const gravitationalForce = computed(() => {
    const result = calculateGravitationalForce(
        planetMass.value,
        formData.value.counterweightMass,
        geostationaryOrbit.value,
    );

    return result;
});

const crossSectionalArea = computed(() => {
    const requiredCrossSectionalArea =
        gravitationalForce.value / formData.value.material.tensileStrength;
    return requiredCrossSectionalArea * formData.value.safetyFactor;
});
</script>

<style></style>
