<template>
    <div class="calc-form">
        <InputWrapper id="bodyRadius" label="Body Radius" description="">
            <template v-slot:input>
                <NumberInput
                    ref="numberInput"
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
                    :units="meterUnits"
                />
            </template>
        </InputWrapper>

        <InputWrapper id="bodyDensity" label="Body Density" description="">
            <template v-slot:input>
                <NumberInput
                    ref="numberInput"
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
                    ref="numberInput"
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
                    ref="numberInput"
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
                    :units="accelerationUnits"
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
import { accelerationUnits, meterUnits } from '../utils';

const emit = defineEmits([]);

const props = defineProps<{
    formData: IMassDriverForm;
}>();

onMounted(() => {});
</script>
