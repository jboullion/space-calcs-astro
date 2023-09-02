<template>
    <div>
        <!-- <StarTravelVisual :formData="formData" :results="results" /> -->

        <ResultTable>
            <tr>
                <th>Total Travel Time</th>
                <td class="text-end">
                    {{ formatNumber(convertedTravelTime) }}
                </td>
                <td style="width: 25%">
                    <UnitSelect
                        v-model="totalTimeUnit"
                        :units="longTimeUnits"
                    />
                </td>
            </tr>
            <tr>
                <th>Time to Accelerate</th>
                <td class="text-end">
                    {{ formatNumber(convertedTimeToAccelerate, 2) }}
                </td>
                <td>
                    <UnitSelect
                        v-model="accelTimeUnit"
                        :units="longTimeUnits"
                    />
                </td>
            </tr>
            <tr>
                <th>Time to Decelerate</th>
                <td class="text-end">
                    {{ formatNumber(convertedTimeToDecelerate, 2) }}
                </td>
                <td>
                    <UnitSelect
                        v-model="decelTimeUnit"
                        :units="longTimeUnits"
                    />
                </td>
            </tr>

            <tr>
                <th>Acceleration Distance</th>
                <td class="text-end">
                    {{ formatNumber(convertedAccelerationDistance, 3) }}
                </td>
                <td>
                    <UnitSelect
                        v-model="accelDistanceUnit"
                        :units="longDistanceUnits"
                    />
                </td>
            </tr>

            <tr>
                <th>Deceleration Distance</th>
                <td class="text-end">
                    {{ formatNumber(convertedDecelerationDistance, 3) }}
                </td>
                <td>
                    <UnitSelect
                        v-model="decelDistanceUnit"
                        :units="longDistanceUnits"
                    />
                </td>
            </tr>

            <tr>
                <th>Time at Max Velocity</th>
                <td class="text-end">
                    {{ formatNumber(convertedTimeAtMaxVelocity, 2) }}
                </td>
                <td>
                    <UnitSelect
                        v-model="maxVelocityUnit"
                        :units="longTimeUnits"
                    />
                </td>
            </tr>

            <tr>
                <th class="">Energy Required</th>
                <td class="text-end">
                    {{ convertedAccelEnergy }}
                </td>
                <td class="">
                    <UnitSelect
                        v-model="energyRequiredUnit"
                        :units="energyUnits"
                    />
                </td>
            </tr>
            <tr>
                <th>Fuel Mass Required</th>
                <td class="text-end">
                    {{ formatNumber(fuelMassRequired / 1000, 4) }}
                </td>
                <td>
                    <SimpleUnit unit="ton" />
                </td>
            </tr>
        </ResultTable>
    </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import SimpleUnit from '../forms/v2/SimpleUnit.vue';
import UnitSelect from '../forms/v2/UnitSelect.vue';
import ResultTable from '../forms/v2/ResultTable.vue';
import StarTravelVisual from './StarTravelVisual.vue';
import type { IStarTravelForm, StarTravelResults } from './types';
import {
    lengthUnits,
    longDistanceUnits,
    energyUnits,
    hourUnits,
    longTimeUnits,
    physicsConstants,
    formatNumber,
    convertUnitValue,
} from '../utils';

const props = defineProps<{
    formData: IStarTravelForm;
}>();

const accelTimeUnit = ref(longTimeUnits[0]);
const decelTimeUnit = ref(longTimeUnits[0]);
const maxVelocityUnit = ref(longTimeUnits[2]);
const totalTimeUnit = ref(longTimeUnits[2]);
const energyRequiredUnit = ref(energyUnits[8]);
const accelDistanceUnit = ref(longDistanceUnits[2]);
const decelDistanceUnit = ref(longDistanceUnits[2]);

const results = computed<StarTravelResults>(() => {
    return {
        travelTime: travelTimeSec.value,
        accelTime: timeToAccelerateSec.value,
        decelTime: timeToDecelerateSec.value,
        totalDistance: convertedTravelDistanceM.value,
        accelDistance: convertedAccelerationDistanceM.value,
        decelDistance: convertedDecelerationDistanceM.value,
    };
});

//const totalDistanceUnit = ref(longDistanceUnits[2]);

// const convertedTravelDistance = computed(() => {
//     const decimals =
//         totalDistanceUnit.value.value > physicsConstants.AU ? 3 : 0;

//     return convertUnitValue(
//         convertedTravelDistanceM.value,
//         totalDistanceUnit.value,
//         lengthUnits[0], // meters
//         decimals,
//     );
// });

const convertedTravelDistanceM = computed(() => {
    const lightYearsToMeters = 9460730472580800; // 9460730472580.8 km
    const conversionValue = lightYearsToMeters * props.formData.distance;
    return conversionValue;
});

const convertedAccelerationMpS = computed(() => {
    const conversionValue =
        props.formData.accelerationUnit.value * props.formData.acceleration;
    return conversionValue;
});

const convertedDecelerationMpS = computed(() => {
    const conversionValue =
        props.formData.decelerationUnit.value * props.formData.deceleration;
    return conversionValue;
});

const convertedVelocityMpS = computed(() => {
    const conversionValue =
        props.formData.maxVelocityUnit.value * props.formData.maxVelocity;
    return conversionValue;
});

const convertedMassKg = computed(() => {
    const conversionValue =
        props.formData.shipMassUnit.value * props.formData.shipMass;
    return conversionValue;
});

const timeToAccelerateSec = computed(() => {
    return calculateTimeToReachSpeed(
        convertedVelocityMpS.value,
        convertedAccelerationMpS.value,
    );
});

const convertedTimeToAccelerate = computed(() => {
    return convertUnitValue(
        timeToAccelerateSec.value,
        accelTimeUnit.value,
        hourUnits[0], // seconds
        2,
    );
});

const convertedAccelerationDistance = computed(() => {
    const decimals =
        accelDistanceUnit.value.value > physicsConstants.AU ? 3 : 0;

    let result = convertUnitValue(
        convertedAccelerationDistanceM.value,
        accelDistanceUnit.value,
        lengthUnits[0], // meters
        decimals,
    );

    if (result === 0) {
        result = convertUnitValue(
            convertedAccelerationDistanceM.value,
            accelDistanceUnit.value,
            lengthUnits[0], // meters
            3,
        );
    }

    return result;
});

const convertedAccelerationDistanceM = computed(() => {
    const initialVelocity = 0; // Starting from rest
    const distance =
        (convertedVelocityMpS.value ** 2 - initialVelocity ** 2) /
        (2 * convertedAccelerationMpS.value);

    return distance;
});

const timeToDecelerateSec = computed(() => {
    return calculateTimeToReachSpeed(
        convertedVelocityMpS.value,
        convertedDecelerationMpS.value,
    );
});

const convertedTimeToDecelerate = computed(() => {
    return convertUnitValue(
        timeToDecelerateSec.value,
        decelTimeUnit.value,
        hourUnits[0], // seconds
        2,
    );
});

const convertedDecelerationDistance = computed(() => {
    const decimals =
        decelDistanceUnit.value.value > physicsConstants.AU ? 3 : 0;

    let result = convertUnitValue(
        convertedDecelerationDistanceM.value,
        decelDistanceUnit.value,
        lengthUnits[0], // meters
        decimals,
    );

    if (result === 0) {
        result = convertUnitValue(
            convertedDecelerationDistanceM.value,
            decelDistanceUnit.value,
            lengthUnits[0], // meters
            3,
        );
    }

    return result;
});

const convertedDecelerationDistanceM = computed(() => {
    const initialVelocity = 0; // Starting from rest
    const distance =
        (convertedVelocityMpS.value ** 2 - initialVelocity ** 2) /
        (2 * convertedDecelerationMpS.value);
    return distance;
});

const timeAtMaxVelocityS = computed(() => {
    // Calculate distance traveled at maximum velocity
    const maxVelocityDistance =
        convertedTravelDistanceM.value -
        convertedAccelerationDistanceM.value -
        convertedDecelerationDistanceM.value;

    // Calculate time traveled at maximum velocity
    return maxVelocityDistance / convertedVelocityMpS.value;
});

const convertedTimeAtMaxVelocity = computed(() => {
    return convertUnitValue(
        timeAtMaxVelocityS.value,
        maxVelocityUnit.value,
        hourUnits[0], // seconds
        2,
    );
});

const travelTimeSec = computed(() => {
    return (
        timeToAccelerateSec.value +
        timeAtMaxVelocityS.value +
        timeToDecelerateSec.value
    );
});

const convertedTravelTime = computed(() => {
    const decimals = totalTimeUnit.value.value > 604800 ? 2 : 0;

    return convertUnitValue(
        travelTimeSec.value,
        totalTimeUnit.value,
        hourUnits[0], // seconds
        decimals,
    );
});

// The same energy is required for deceleration unless the deceleration has a different ending velocity. In this case we are assuming 0
const convertedAccelEnergy = computed(() => {
    // This energy us returned in Joules
    const energy = calculateEnergyRequired(
        convertedMassKg.value,
        convertedVelocityMpS.value,
    );

    if (convertedVelocityMpS.value >= physicsConstants.c) return '∞';

    // Assume same energy for accel and decel ( * 2)
    return formatNumber(
        convertUnitValue(
            energy,
            energyRequiredUnit.value,
            energyUnits[0], // Joules
            2,
        ) * 2,
        2,
    );
});

const totalTravelTime = computed(() => {
    return 0; //timeToAccelerate.value * 2;
});

const fuelMassRequired = computed(() => {
    const convertedToC = convertedVelocityMpS.value / physicsConstants.c;
    const perKgPercent = (2 * convertedToC) / (1 - convertedToC);
    return (
        (perKgPercent * convertedMassKg.value) / props.formData.fuelEfficiency
    );
});

function calculateTimeToReachSpeed(
    finalVelocity: number,
    acceleration: number,
) {
    const initialVelocity = 0; // Starting from rest
    const time = (finalVelocity - initialVelocity) / acceleration;
    return time;
}

function calculateEnergyRequired(mass: number, velocity: number): number {
    const kineticEnergy = 0.5 * mass * velocity ** 2;
    return kineticEnergy;
}
</script>
