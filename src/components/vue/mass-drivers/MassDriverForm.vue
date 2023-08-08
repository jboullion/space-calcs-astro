<template>
    <div class="calc-form">
        <InputWrapper
            id="bodyRadius"
            label="Body Radius"
            :description="`Gravity: ${formatNumber(
                gravityG,
            )}g or ${formatNumber(gravityMpSec)} m/s²`"
        >
            <template v-slot:input>
                <NumberInput
                    id="bodyRadius"
                    :key="`radius-${formData.bodyRadius}`"
                    type="number"
                    class="form-control"
                    v-model.number="formData.bodyRadius"
                    :min="1"
                    :max="100000000 / formData.bodyRadiusUnit.value"
                    :step="1"
                />
            </template>
            <template v-slot:unit>
                <UnitSelect
                    id="bodyRadiusUnit"
                    v-model="formData.bodyRadiusUnit"
                    :units="lengthUnits"
                />
            </template>
        </InputWrapper>

        <InputWrapper id="bodyDensity" label="Body Density" description="">
            <template v-slot:input>
                <NumberInput
                    id="bodyDensity"
                    :key="`density-${formData.bodyDensity}`"
                    type="number"
                    class="form-control"
                    v-model.number="formData.bodyDensity"
                    :min="1"
                    :max="1000"
                    :step="1"
                />
            </template>
            <template v-slot:unit>
                <SimpleUnit unit="g/cm³" />
            </template>
        </InputWrapper>

        <InputWrapper id="acceleration" label="Acceleration" description="">
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

        <InputWrapper id="exitVelocity" label="Final Velocity" description="">
            <template v-slot:input>
                <NumberInput
                    id="exitVelocity"
                    :key="`exitVelocity-${formData.exitVelocity}`"
                    type="number"
                    class="form-control"
                    v-model.number="formData.exitVelocity"
                    :min="1"
                    :max="100000 / formData.exitVelocityUnit.value"
                    :step="1"
                />
            </template>
            <template v-slot:unit>
                <UnitSelect
                    id="exitVelocityUnit"
                    v-model="formData.exitVelocityUnit"
                    :units="velocityUnits"
                />
            </template>
        </InputWrapper>

        <InputWrapper id="payloadMass" label="Payload Mass" description="">
            <template v-slot:input>
                <NumberInput
                    id="payloadMass"
                    :key="`payloadMass-${formData.payloadMass}`"
                    type="number"
                    class="form-control"
                    v-model.number="formData.payloadMass"
                    :min="1"
                    :max="100000 / formData.payloadMassUnit.value"
                    :step="1"
                />
            </template>
            <template v-slot:unit>
                <UnitSelect
                    id="exitVelocityUnit"
                    v-model="formData.payloadMassUnit"
                    :units="massUnits"
                />
            </template>
        </InputWrapper>
    </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from 'vue';
import InputWrapper from '../forms/v2/InputWrapper.vue';
import NumberInput from '../forms/v2/NumberInput.vue';
import SimpleUnit from '../forms/v2/SimpleUnit.vue';
import UnitSelect from '../forms/v2/UnitSelect.vue';
import type { IMassDriverForm } from './types';
import {
    accelerationUnits,
    lengthUnits,
    massUnits,
    velocityUnits,
    physicsConstants,
    formatNumber,
    m2sTog,
} from '../utils';

const emit = defineEmits([]);

const props = defineProps<{
    formData: IMassDriverForm;
}>();

onMounted(() => {});

const gravityMpSec = computed(() => {
    const convertedRadius =
        props.formData.bodyRadiusUnit.value * props.formData.bodyRadius;
    return calculateGravity(convertedRadius * 1000, props.formData.bodyDensity);
});

const gravityG = computed(() => {
    return m2sTog(gravityMpSec.value);
});

function calculateGravity(radiusMeters: number, density: number) {
    // Gravitational constant (m^3 kg^-1 s^-2)
    // const G = 6.6743e-11;

    // Calculate volume (V = 4/3 * π * r^3)
    const volume = (4 / 3) * Math.PI * Math.pow(radiusMeters, 3);

    // Calculate mass (M = density * volume)
    const mass = density * 1000 * volume;

    // Calculate gravity (g = G * M / r^2)
    const gravity =
        (physicsConstants.gravityConstant * mass) / Math.pow(radiusMeters, 2);

    return gravity;
}
</script>
