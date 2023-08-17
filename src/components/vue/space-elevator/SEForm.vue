<template>
    <div id="se-form" class="py-2">
        <NumberInput
            id="planet-radius"
            label="Planet Radius"
            v-model.number="formData.planetRadius"
            :step="1"
            :min="100"
            :max="10000000"
            unit="km"
            description="Surface Gravity: TODO m/s²"
        />

        <NumberInput
            id="planet-density"
            label="Planet Density"
            v-model.number="formData.planetDensity"
            :step="0.1"
            :min="0.1"
            :max="1000000"
            unit="g/cm³"
            description="Planet Mass: TODO kg"
        />

        <NumberInput
            id="planet-rotation"
            label="Planet Rotation"
            v-model.number="formData.planetRotation"
            :step="1"
            :min="1"
            :max="1000"
            unit="hours"
            description="Geostationary Orbit: TODO km"
        />

        <NumberInput
            id="car-speed"
            label="Car Speed"
            v-model.number="formData.carSpeed"
            :step="1"
            :min="1"
            :max="1000"
            unit="km/h"
            description="Travel Time: TODO hours"
        />

        <SelectInput
            id="material"
            label="Material"
            v-model="formData.material"
            :options="materials"
            tooltip=""
            description="Max Tensile Strength: TODO Mpa"
            @update:modelValue=""
        />

        <NumberInput
            id="safety-factor"
            label="Safety Factor"
            v-model.number="formData.safetyFactor"
            :step="0.1"
            :min="1"
            :max="10"
            description="Allowable Tensile Strength: TODO Mpa"
        />
    </div>
</template>
<script setup lang="ts">
import { defineProps } from 'vue';
import type { SpaceElevatorForm } from './types';
import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import { materials } from './types';

defineProps<{
    formData: SpaceElevatorForm;
}>();
</script>
