<template>
    <div>
        <h2>Results</h2>
        <div>
            <table class="table">
                <tbody class="align-middle">
                    <tr>
                        <th>Length of Track</th>
                        <td class="text-end">
                            {{ formatNumber(lengthOfTrack / 1000) }}
                        </td>
                        <td style="width: 25%">
                            <UnitSelect
                                id="trackUnits"
                                v-model="lengthUnit"
                                :units="lengthUnits"
                            />
                        </td>
                    </tr>
                    <tr>
                        <th>Time of Travel</th>
                        <td class="text-end">
                            {{ formatNumber(travelTime) }}
                        </td>
                        <td style="width: 25%">
                            <UnitSelect
                                id="trackUnits"
                                v-model="timeUnit"
                                :units="hourUnits"
                            />
                        </td>
                    </tr>
                    <tr>
                        <th>Energy Required</th>
                        <td class="text-end">
                            {{ formatNumber(energyRequired) }}
                        </td>
                        <td>
                            <UnitSelect
                                id="energyUnits"
                                v-model="energyUnit"
                                :units="energyUnits"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import UnitSelect from '../forms/v2/UnitSelect.vue';
import type { IMassDriverForm } from './types';
import {
    accelerationUnits,
    lengthUnits,
    massUnits,
    energyUnits,
    hourUnits,
    roundToDecimal,
    physicsConstants,
    formatNumber,
    m2sTog,
} from '../utils';

const props = defineProps<{
    formData: IMassDriverForm;
}>();

const lengthUnit = ref(lengthUnits[1]);
const energyUnit = ref(energyUnits[9]);
const timeUnit = ref(hourUnits[2]);

const lengthOfTrack = computed(() => {
    const initialSpeed = 0; // Starting from rest
    const distance =
        (convertedVelocity.value ** 2 - initialSpeed ** 2) /
        (2 * convertedAcceleration.value);
    return distance / lengthUnit.value.value;
});

const convertedAcceleration = computed(() => {
    const conversionValue =
        props.formData.accelerationUnit.value * props.formData.acceleration;
    return conversionValue;
});

const convertedVelocity = computed(() => {
    const conversionValue =
        props.formData.exitVelocityUnit.value * props.formData.exitVelocity;
    return conversionValue;
});

const convertedMass = computed(() => {
    const conversionValue =
        props.formData.payloadMassUnit.value * props.formData.payloadMass;
    return conversionValue;
});

const travelTime = computed(() => {
    const initialSpeed = 0; // Starting from rest
    const time =
        (convertedVelocity.value - initialSpeed) / convertedAcceleration.value;
    return time * timeUnit.value.value;
});

const energyRequired = computed(() => {
    const mass = convertedMass.value;
    const velocity = convertedVelocity.value;
    const energy = (mass * velocity ** 2) / 2;

    return energy * energyUnit.value.value;
});
</script>
