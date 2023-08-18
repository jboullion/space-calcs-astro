<template>
    <div class="calc-form">
        <div class="p-2 rounded border mb-5">
            <SelectInput
                id="flywheelType"
                label="Flywheel Type"
                v-model="formData.geometry"
                :options="flyWheelGeometry"
                :description="`k: ${formData.geometry.k}`"
            />

            <InputWrapper
                id="mass"
                label="Mass"
                :description="`Stored Energy: ${formatNumber(
                    convertedStoredEnergy,
                    3,
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

            <InputWrapper
                id="radius"
                label="Radius"
                :description="`Moment of Inertia: ${formatNumber(
                    momentOfInertia,
                )} kg.m<sup>2</sup>`"
            >
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

            <SelectInput
                id="material"
                label="Material"
                v-model="formData.material"
                :options="materials"
                :description="`Density: ${
                    formData.material.density
                } g/cm<sup>3</sup><br />Mat. Tensile Strength: ${formatNumber(
                    formData.material.tensileStrength,
                )} MPa<br />Req. Tensile Strength: ${formatNumber(
                    requiredTensileStrength,
                )} MPa`"
            />
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
import { flyWheelGeometry, materials } from './constants';

const props = defineProps<{
    formData: IFlyWheelForm;
}>();

const storedEnergy = computed(() => {
    const omega: number = (2 * Math.PI * props.formData.rpm) / 60;

    // Calculate stored energy (joules)
    return 0.5 * momentOfInertia.value * omega ** 2;
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

const momentOfInertia = computed(() => {
    // k⋅m⋅r2
    return (
        props.formData.geometry.k *
        props.formData.mass *
        props.formData.radius ** 2
    );
});

const requiredTensileStrength = computed(() => {
    // // Convert RPM to radians per second
    // const omega: number = (2 * Math.PI * props.formData.rpm) / 60;

    // // Calculate tensile strength N/m^2
    // const tensileStrength: number =
    //     (props.formData.mass *
    //         Math.pow(omega, 2) *
    //         Math.pow(props.formData.radius, 2)) /
    //     (2 * props.formData.material.density * 1000); // g/c³ to kg/m³

    // Convert tensile strength to kPa
    //  const tensileStrengthKPa: number = tensileStrength / 1000;
    const tensileStrength =
        ((storedEnergy.value / props.formData.mass) *
            props.formData.material.density) /
        props.formData.geometry.k;
    return tensileStrength / 100 / 1000; //MPa
});
</script>
