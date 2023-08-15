<template>
    <div class="calc-form">
        <div class="p-2 rounded border mb-5">
            <SelectInput
                id="example-location"
                label="Example Location"
                v-model="formData.exampleLocation"
                :options="travelLocations"
                @update:modelValue="$emit('updateTravelDistance', $event)"
            />

            <InputWrapper
                id="distance"
                label="Distance Between Stars"
                description=""
            >
                <template v-slot:input>
                    <NumberInput
                        id="acceleration"
                        :key="`distance-${formData.distance}`"
                        type="number"
                        class="form-control"
                        v-model.number="formData.distance"
                        :min="1"
                        :max="1000000000000"
                        :step="1"
                    />
                </template>
                <template v-slot:unit>
                    <SimpleUnit unit="ly" />
                </template>
            </InputWrapper>

            <SelectInput
                id="example-engine"
                label="Example Engines"
                v-model="formData.exampleEngine"
                :options="exampleEngines"
                @update:modelValue="$emit('updateEngine', $event)"
            />

            <InputWrapper
                id="acceleration"
                label="Acceleration"
                :descClass="accelerationComfort"
                :description="accelerationGs"
            >
                <template v-slot:input>
                    <NumberInput
                        id="acceleration"
                        :key="`acceleration-${formData.acceleration}`"
                        type="number"
                        class="form-control"
                        v-model.number="formData.acceleration"
                        :min="1"
                        :max="10000 / formData.accelerationUnit.value"
                        :step="1"
                    />
                </template>
                <template v-slot:unit>
                    <UnitSelect
                        id="accelerationUnit"
                        v-model="formData.accelerationUnit"
                        :units="accelerationUnits"
                    />
                </template>
            </InputWrapper>

            <InputWrapper
                id="maxVelocity"
                label="Max Velocity"
                :description="`Time Dilation: ${timeDilation}%`"
            >
                <template v-slot:input>
                    <NumberInput
                        id="maxVelocity"
                        :key="`maxVelocity-${formData.maxVelocity}`"
                        type="number"
                        class="form-control"
                        v-model.number="formData.maxVelocity"
                        :min="0.1"
                        :max="
                            (physicsConstants.c * 1000) /
                            formData.maxVelocityUnit.value
                        "
                        :step="0.1"
                    />
                </template>
                <template v-slot:unit>
                    <UnitSelect
                        id="accelerationUnit"
                        v-model="formData.maxVelocityUnit"
                        :units="highSpeedUnits"
                    />
                </template>
            </InputWrapper>

            <InputWrapper
                id="deceleration"
                label="Deceleration"
                :descClass="decelerationComfort"
                :description="decelerationGs"
            >
                <template v-slot:input>
                    <NumberInput
                        id="deceleration"
                        :key="`deceleration-${formData.deceleration}`"
                        type="number"
                        class="form-control"
                        v-model.number="formData.deceleration"
                        :min="1"
                        :max="10000 / formData.decelerationUnit.value"
                        :step="1"
                    />
                </template>
                <template v-slot:unit>
                    <UnitSelect
                        id="accelerationUnit"
                        v-model="formData.decelerationUnit"
                        :units="accelerationUnits"
                    />
                </template>
            </InputWrapper>

            <InputWrapper id="shipMass" label="Ship Mass" description="">
                <template v-slot:input>
                    <NumberInput
                        id="shipMass"
                        :key="`shipMass-${formData.shipMass}`"
                        type="number"
                        class="form-control"
                        v-model.number="formData.shipMass"
                        :min="1"
                        :max="10000000000 / formData.shipMassUnit.value"
                        :step="1"
                    />
                </template>
                <template v-slot:unit>
                    <UnitSelect
                        id="accelerationUnit"
                        v-model="formData.shipMassUnit"
                        :units="massUnits"
                    />
                </template>
            </InputWrapper>

            <InputWrapper
                id="fuelEfficiency"
                label="Fuel Conversion Rate"
                tooltip="The fuel conversion rate is the the efficiency of converting fuel mass into energy."
            >
                <template v-slot:input>
                    <NumberInput
                        id="fuelEfficiency"
                        :key="`fuelEfficiency-${formData.fuelEfficiency}`"
                        type="number"
                        class="form-control"
                        v-model.number="formData.fuelEfficiency"
                        :min="0.0001"
                        :max="1"
                        :step="0.0001"
                    />
                </template>
                <template v-slot:unit>
                    <SimpleUnit unit="km x m x m" />
                </template>
            </InputWrapper>
        </div>
    </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// 1. Add in souces of friction and drag? (air resistance, etc.)
// 2. Add "Car" mass and drag coefficient?

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from 'vue';
import InputWrapper from '../forms/v2/InputWrapper.vue';
import NumberInput from '../forms/v2/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import SimpleUnit from '../forms/v2/SimpleUnit.vue';
import UnitSelect from '../forms/v2/UnitSelect.vue';
import type { IStarTravelForm } from './types';
import { travelLocations, exampleEngines } from './constants';
import {
    accelerationUnits,
    highSpeedUnits,
    massUnits,
    physicsConstants,
    formatNumber,
    m2sTog,
} from '../utils';

const props = defineProps<{
    formData: IStarTravelForm;
}>();

const emit = defineEmits(['updateTravelDistance', 'updateEngine']);

onMounted(() => {});

const accelGravityMpSec = computed(() => {
    const convertedAcceleration =
        props.formData.accelerationUnit.value * props.formData.acceleration;

    return convertedAcceleration;
});

const accelGravityG = computed(() => {
    return m2sTog(accelGravityMpSec.value);
});

const accelerationGs = computed(() => {
    return `G-Force: ${formatNumber(accelGravityG.value)}g`;
});

const accelerationComfort = computed(() => {
    return 'text-muted';

    // TODO: Set up some check for comfort levels based on the time it takes to travel the track and the acceleration felt.

    // if (accelGravityG.value < 0.1) return 'text-danger';
    // else if (accelGravityG.value < 0.3) return 'text-warning';
    // else if (accelGravityG.value < 1.1) return 'text-success';
    // else if (accelGravityG.value < 1.5) return 'text-warning';
    // else return 'text-danger';
});

const decelGravityMpSec = computed(() => {
    const convertedDeceleration =
        props.formData.decelerationUnit.value * props.formData.deceleration;

    return convertedDeceleration;
});

const decelGravityG = computed(() => {
    return m2sTog(decelGravityMpSec.value);
});

const decelerationGs = computed(() => {
    return `G-Force: ${formatNumber(decelGravityG.value)}g`;
});

const decelerationComfort = computed(() => {
    return 'text-muted';

    // TODO: Set up some check for comfort levels based on the time it takes to travel the track and the acceleration felt.

    // if (accelGravityG.value < 0.1) return 'text-danger';
    // else if (accelGravityG.value < 0.3) return 'text-warning';
    // else if (accelGravityG.value < 1.1) return 'text-success';
    // else if (accelGravityG.value < 1.5) return 'text-warning';
    // else return 'text-danger';
});

const timeDilation = computed(() => {
    const convertedVelocity =
        props.formData.maxVelocityUnit.value * props.formData.maxVelocity;

    if (convertedVelocity > physicsConstants.c) return '∞';

    const timeDilation =
        1 /
        Math.sqrt(
            1 -
                (convertedVelocity / physicsConstants.c) *
                    (convertedVelocity / physicsConstants.c),
        );

    const dilationPercent = (timeDilation - 1) * 100;

    return formatNumber(dilationPercent, 3);
});
</script>
