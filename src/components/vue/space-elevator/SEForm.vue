<template>
    <div id="se-form" class="py-2">
        <NumberInput
            id="planet-radius"
            label="Planet Radius"
            v-model.number="formData.planetRadius"
            :step="1"
            :min="100"
            :max="1000000"
            unit="km"
        />

        <NumberInput
            id="planet-density"
            label="Planet Desnity"
            v-model.number="formData.planetDensity"
            :step="1"
            :min="1"
            :max="100"
            unit="kg"
        />

        <NumberInput
            id="planet-rotation"
            label="Planet Rotation"
            v-model.number="formData.planetRotation"
            :step="1"
            :min="1"
            :max="1000"
            unit="hours"
        />

        <NumberInput
            id="car-speed"
            label="Car Speed"
            v-model.number="formData.carSpeed"
            :step="1"
            :min="1"
            :max="1000"
            unit="km/h"
        />
    </div>
</template>
<script setup lang="ts">
import { defineProps } from 'vue'
import type { SpaceElevatorForm } from './types'
import NumberInput from '../forms/NumberInput.vue'

defineProps<{
    formData: SpaceElevatorForm
}>()
</script>
