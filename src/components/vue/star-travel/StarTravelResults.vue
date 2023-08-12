<template>
    <div>
        <!-- <StarTravelVisual
            :formData="formData"
            :trackLengthM="trackLengthM"
            :travelTime="travelTime"
            :timeUnit="timeUnit"
        /> -->

        <ResultTable>
            <tr>
                <td>Total Travel Distance</td>
                <td class="text-end">
                    {{ formatNumber(convertedTravelDistanceM) }}
                </td>
                <td style="width: 25%">M</td>
            </tr>
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
                <th>Apparent Travel Time</th>
                <td class="text-end"></td>
                <td style="width: 25%"></td>
            </tr>
            <tr>
                <th>Time to Accelerate</th>
                <td class="text-end">
                    {{ formatNumber(convertedTimeToAccelerate) }}
                </td>
                <td style="width: 25%">
                    <UnitSelect
                        v-model="accelTimeUnit"
                        :units="longTimeUnits"
                    />
                </td>
            </tr>
            <tr>
                <td>Distance Traveled during acceleration</td>
                <td class="text-end">
                    {{ formatNumber(convertedAccelerationDistanceM) }}
                </td>
                <td style="width: 25%">M</td>
            </tr>
            <tr>
                <th>Acceleration Energy</th>
                <td class="text-end">{{}}</td>
                <td style="width: 25%">{{}}</td>
            </tr>
            <tr>
                <th>Time at Max Velocity</th>
                <td class="text-end">
                    {{ formatNumber(convertedTimeAtMaxVelocity) }}
                </td>
                <td style="width: 25%">
                    <UnitSelect
                        v-model="maxVelocityUnit"
                        :units="longTimeUnits"
                    />
                </td>
            </tr>
            <tr>
                <th>Time to Decelerate</th>
                <td class="text-end">
                    {{ formatNumber(convertedTimeToDecelerate) }}
                </td>
                <td style="width: 25%">
                    <UnitSelect
                        v-model="decelTimeUnit"
                        :units="longTimeUnits"
                    />
                </td>
            </tr>
            <tr>
                <td>Distance Traveled during Deceleration</td>
                <td class="text-end">
                    {{ formatNumber(convertedDecelerationDistanceM) }}
                </td>
                <td style="width: 25%">M</td>
            </tr>
            <tr>
                <th class="border-0">Deceleration Energy</th>
                <td class="text-end border-0">{{}}</td>
                <td class="border-0" style="width: 25%">{{}}</td>
            </tr>
            <!--                    
                    <tr>
                        <th class="border-0">Energy Required</th>
                        <td class="text-end border-0">
                            {{ formatNumber(energyRequired) }}
                        </td>
                        <td class="border-0">
                            <UnitSelect
                                id="energyUnits"
                                v-model="energyUnit"
                                :units="energyUnits"
                            />
                        </td>
                    </tr> -->
        </ResultTable>
    </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import UnitSelect from '../forms/v2/UnitSelect.vue';
import ResultTable from '../forms/v2/ResultTable.vue';
//import StarTravelVisual from './StarTravelVisual.vue';
import type { IStarTravelForm } from './types';
import {
    accelerationUnits,
    lengthUnits,
    massUnits,
    energyUnits,
    hourUnits,
    longTimeUnits,
    roundToDecimal,
    physicsConstants,
    formatNumber,
    m2sTog,
    convertUnitValue,
    velocityUnits,
} from '../utils';

const props = defineProps<{
    formData: IStarTravelForm;
}>();

const accelTimeUnit = ref(longTimeUnits[0]);
const decelTimeUnit = ref(longTimeUnits[0]);
const maxVelocityUnit = ref(longTimeUnits[2]);
const totalTimeUnit = ref(longTimeUnits[2]);

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
        0,
    );
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
        0,
    );
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
        0,
    );
});

const totalTravelTime = computed(() => {
    return 0; //timeToAccelerate.value * 2;
});

function calculateTimeToReachSpeed(
    finalVelocity: number,
    acceleration: number,
) {
    const initialVelocity = 0; // Starting from rest
    const time = (finalVelocity - initialVelocity) / acceleration;
    return time;
}

const convertedTravelTime = computed(() => {
    // Calculate total travel time
    const totalTravelTime =
        timeToAccelerateSec.value +
        timeAtMaxVelocityS.value +
        timeToDecelerateSec.value;

    return convertUnitValue(
        totalTravelTime,
        totalTimeUnit.value,
        hourUnits[0], // seconds
        0,
    );
});
</script>
