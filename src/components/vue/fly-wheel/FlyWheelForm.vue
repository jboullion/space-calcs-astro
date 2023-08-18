<template>
    <div class="calc-form">
        <div class="p-2 rounded border mb-5">
            <SelectInput
                id="example-location"
                label="Example Location"
                v-model="formData.geometry"
                :options="flyWheelGeometry"
                :description="`k = ${formData.geometry.k}`"
            />

            <InputWrapper
                id="mass"
                label="Mass"
                :description="`Stored Energy: ${formatNumber(
                    convertedStoredEnergy,
                )} kWh`"
            >
                <template v-slot:input>
                    <NumberInput
                        id="mass"
                        :key="`mass-${formData.mass}`"
                        type="number"
                        class="form-control"
                        v-model.number="formData.mass"
                        :min="1"
                        :max="100000"
                        :step="1"
                    />
                </template>
                <template v-slot:unit>
                    <SimpleUnit unit="kg" />
                </template>
            </InputWrapper>

            <InputWrapper id="radius" label="Radius" description="">
                <template v-slot:input>
                    <NumberInput
                        id="radius"
                        :key="`radius-${formData.radius}`"
                        type="number"
                        class="form-control"
                        v-model.number="formData.radius"
                        :min="1"
                        :max="100000"
                        :step="1"
                    />
                </template>
                <template v-slot:unit>
                    <SimpleUnit unit="m" />
                </template>
            </InputWrapper>

            <InputWrapper
                id="rpm"
                label="RPM"
                :description="`Specific Energy: ${formatNumber(
                    specificEnergy,
                )} J/kg`"
            >
                <template v-slot:input>
                    <NumberInput
                        id="rpm"
                        :key="`rpm-${formData.rpm}`"
                        type="number"
                        class="form-control"
                        v-model.number="formData.rpm"
                        :min="1"
                        :max="1000000"
                        :step="1"
                    />
                </template>
                <template v-slot:unit>
                    <SimpleUnit unit="rpm" />
                </template>
            </InputWrapper>
        </div>
    </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from 'vue';
import InputWrapper from '../forms/v2/InputWrapper.vue';
import NumberInput from '../forms/v2/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import SimpleUnit from '../forms/v2/SimpleUnit.vue';
import UnitSelect from '../forms/v2/UnitSelect.vue';
import type { IFlyWheelForm } from './types';

import {
    accelerationUnits,
    highSpeedUnits,
    massUnits,
    physicsConstants,
    formatNumber,
    m2sTog,
    energyUnits,
    convertUnitValue,
} from '../utils';
import { flyWheelGeometry } from './constants';

const props = defineProps<{
    formData: IFlyWheelForm;
}>();

const storedEnergy = computed(() => {
    const omega: number = (2 * Math.PI * props.formData.rpm) / 60;

    // Calculate moment of inertia
    const momentOfInertia: number =
        0.5 * props.formData.mass * Math.pow(props.formData.radius, 2);

    // Calculate stored energy (joules)
    return 0.5 * momentOfInertia * Math.pow(omega, 2);
});

const convertedStoredEnergy = computed(() => {
    return convertUnitValue(
        storedEnergy.value,
        energyUnits[5], // kWh
        energyUnits[0],
        3,
    );
});

const specificEnergy = computed(() => {
    return storedEnergy.value / props.formData.mass; // J/kg
});
</script>
