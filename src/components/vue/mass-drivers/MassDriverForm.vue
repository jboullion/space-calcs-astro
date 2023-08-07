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
import { meterUnits } from '../utils';

const emit = defineEmits(['update:radiusUnit']);

const props = defineProps<{
    formData: IMassDriverForm;
}>();

onMounted(() => {});
</script>
