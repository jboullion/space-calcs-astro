<template>
    <div id="se-form" class="py-2">
        <NumberInput
            id="planet-radius"
            label="Planet Radius"
            v-model.number="formData.planetRadius"
            :step="1"
            :min="100"
            :max="10000000"
            unit="km"
            :description="`Surface Gravity: ${formatNumber(
                planetGravity,
                2,
            )} m/s²`"
        />

        <NumberInput
            id="planet-density"
            label="Planet Density"
            v-model.number="formData.planetDensity"
            :step="0.1"
            :min="0.1"
            :max="1000000"
            unit="g/cm³"
            :description="`Planet Mass: ${planetMass.toExponential(2)} kg`"
        />

        <NumberInput
            id="planet-rotation"
            label="Planet Rotation"
            v-model.number="formData.planetRotation"
            :step="1"
            :min="1"
            :max="1000"
            unit="hours"
            :description="`Geostationary Orbit: ${formatNumber(
                geostationaryOrbit,
                2,
            )} km`"
        />

        <NumberInput
            id="car-speed"
            label="Car Speed"
            v-model.number="formData.carSpeed"
            :step="1"
            :min="1"
            :max="1000"
            unit="km/h"
            :description="`Travel Time: ${formatNumber(
                carTravelTimeTotalHours,
                2,
            )} hours`"
        />

        <SelectInput
            id="material"
            label="Material"
            v-model="formData.material"
            :options="materials"
            tooltip=""
            :description="`Max Tensile Strength: ${formatNumber(
                formData.material.tensileStrength,
            )} Mpa<br />Total Mass: ${estimatedTotalMass.toExponential(2)} kg`"
            @update:modelValue=""
        />

        <NumberInput
            id="safety-factor"
            label="Safety Factor"
            v-model.number="formData.safetyFactor"
            :step="0.1"
            :min="1"
            :max="10"
            :description="`Cross Sectional Area: ${formatNumber(
                crossSectionalArea,
            )} m<sup>2</sup><br />Circular Radius: ${formatNumber(
                estimatedTetherRadius,
            )} m`"
        />
    </div>
</template>
<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { SpaceElevatorForm } from './types';
import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import { materials } from './constants';
import {
    physicsConstants,
    formatNumber,
    calculateGravitationalForce,
    calculateMaxTensileStress,
} from '../utils';

const props = defineProps<{
    formData: SpaceElevatorForm;
    planetGravity: number;
    planetMass: number;
    geostationaryOrbit: number;
}>();

// TODO: do we want to make this an editable value?
const massCounterweight = 10000; // kg (example value)

const gravitationalForce = computed(() => {
    const result = calculateGravitationalForce(
        props.planetMass,
        massCounterweight,
        props.geostationaryOrbit,
    );

    return result;
});

// const crossSectionalArea = computed(() => {
//     const crossSectionalArea = maxTension / allowableTensileStress.value;
//     return crossSectionalArea;
// });

// const tensileStress = computed(() => {
//     //const crossSectionalArea = 0.001; // square meters (example value)

//     const result = calculateMaxTensileStress(
//         gravitationalForce.value,
//         crossSectionalArea.value,
//     );

//     return result;
// });

const elevatorTopHeight = computed(() => {
    return props.geostationaryOrbit + props.formData.planetRadius;
});

const carTravelTimeTotalHours = computed(() => {
    return (
        (elevatorTopHeight.value - props.formData.planetRadius) /
        props.formData.carSpeed
    );
});

// TODO: In order to use this we might need to set up a material selector in the form and a safety factor field
// const allowableTensileStress = computed(() => {
//     const allowableTensileStress =
//         requiredTensileStrength.value * props.formData.safetyFactor;
//     return allowableTensileStress;
// });

// const centerOfMass = computed(() => {
//     const distance =
//         elevatorTopHeight.value +
//         (massCounterweight / (props.planetMass + massCounterweight)) *
//             elevatorTopHeight.value;

//     return distance;
// });

// const allowedTensileStrength = computed(() => {
//     // Calculate allowable tensile stress
//     const allowableTensileStress =
//         props.formData.material.tensileStrength / props.formData.safetyFactor;

//     return allowableTensileStress;
// });

const crossSectionalArea = computed(() => {
    const requiredCrossSectionalArea =
        gravitationalForce.value / props.formData.material.tensileStrength;
    return requiredCrossSectionalArea * props.formData.safetyFactor;
});

const estimatedTetherRadius = computed(() => {
    const radius = Math.sqrt(crossSectionalArea.value / Math.PI);
    return radius;
});

const estimatedTotalMass = computed(() => {
    // Calculate tether volume using its cross-sectional area
    const tetherVolume = crossSectionalArea.value * elevatorTopHeight.value;

    // Calculate tether mass based on its volume and density
    const tetherMass = props.formData.material.density * tetherVolume;

    // Calculate total mass by summing up tether, payload, and counterweight masses
    const totalMass =
        tetherMass + (props.formData.payloadMass ?? 1000) + massCounterweight;

    return totalMass;
});

// const requiredTensileStrength = computed(() => {
//     const requiredCrossSectionalArea =
//         gravitationalForce.value / props.formData.material.tensileStrength;
//     return requiredCrossSectionalArea;
// });
</script>
