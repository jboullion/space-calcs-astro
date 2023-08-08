<template>
    <div class="calc-form">
        <SelectInput
            id="relationship"
            label="Mass Relationship"
            v-model="formData.relationship"
            :options="relationships"
            @update:modelValue=""
        />

        <NumberInput
            id="massOne"
            label="Mass One"
            :key="`one-${formData.massOne}`"
            v-model.number="formData.massOne"
            :step="0.1"
            :min="0.1"
            :max="1000"
            :unit="getMassOneUnit"
            :description="getMassOneDescription"
        />

        <NumberInput
            id="massTwo"
            label="Mass Two"
            :key="`two-${formData.massTwo}`"
            v-model.number="formData.massTwo"
            :step="0.01"
            :min="0.001"
            :max="1000"
            :unit="getMassTwoUnit"
            :description="getMassTwoDescription"
        />

        <NumberInput
            id="distance"
            label="Distance"
            :key="`distance-${formData.distance}`"
            v-model.number="formData.distance"
            :step="0.1"
            :min="0.1"
            :max="100"
            :unit="getDistanceUnit"
            :description="getDistanceDescription"
        />
    </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from 'vue';
import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import type { BodyRelation, ILagrangeForm } from './types';
import { physicsConstants, formatNumber } from '../utils';

const props = defineProps<{
    formData: ILagrangeForm;
}>();

const relationships: BodyRelation[] = [
    {
        name: 'Star and Planet',
        value: 'star',
    },
    {
        name: 'Planet and Moon',
        value: 'moon',
    },
];

onMounted(() => {});

const getMassOneUnit = computed(() => {
    return props.formData.relationship.value === 'star' ? 'M☉' : 'M⊕';
});

const getMassTwoUnit = computed(() => {
    return props.formData.relationship.value === 'star' ? 'M⊕' : 'M⊕';
});

const getDistanceUnit = computed(() => {
    return props.formData.relationship.value === 'star' ? 'AU' : 'R⊕';
});

const getMassOneDescription = computed(() => {
    return `${
        props.formData.relationship.value === 'star'
            ? (physicsConstants.sunMass * props.formData.massOne).toFixed(2)
            : (physicsConstants.earthMass * props.formData.massOne).toFixed(2)
    }kg <br />${getMassOneUnit.value}: Is the mass of the ${
        props.formData.relationship.value === 'star'
            ? `Sun or ${physicsConstants.sunMass}kg`
            : `Earth or ${physicsConstants.earthMass}kg`
    }`;
});

const getMassTwoDescription = computed(() => {
    return `${
        physicsConstants.earthMass * props.formData.massTwo
    }kg <br />M⊕: Is the mass of the Earth or ${physicsConstants.earthMass}kg`;
});

const getDistanceDescription = computed(() => {
    return `${
        props.formData.relationship.value === 'star'
            ? formatNumber(physicsConstants.AU * props.formData.distance)
            : formatNumber(
                  physicsConstants.earthRadius * props.formData.distance,
              )
    }km <br />${getDistanceUnit.value}: ${
        props.formData.relationship.value === 'star'
            ? `Is the distance between the Sun and the Earth or ${formatNumber(
                  physicsConstants.AU,
              )}km`
            : `Is equal to the radius of the Earth or ${formatNumber(
                  physicsConstants.earthRadius,
              )}km`
    }.`;
});
</script>
