<template>
    <div>
        <h2>Results</h2>
        <div>
            <table class="table">
                <tbody>
                    <!-- <tr>
                        <td>Total Radius in Meters</td>
                        <td class="text-end">
                            {{ formatNumber(convertedRadius) }} m
                        </td>
                    </tr> -->

                    <tr>
                        <th>Body Gravity</th>
                        <td class="text-end">
                            {{ formatNumber(gravity) }} m/s²
                        </td>
                    </tr>
                    <!-- <tr>
                        <th>Planet Rotation Speed</th>
                        <td>
                            {{ addCommas(formData.location.rotationSpeed) }}
                            m/s
                        </td>
                    </tr>
                    <tr>
                        <th>Orbit Height</th>
                        <td>{{ addCommas(displayOrbitHeight) }} km</td>
                    </tr>
                    <tr>
                        <th>Orbit Velocity</th>
                        <td>{{ addCommas(displayOrbitVelocity) }} m/s</td>
                    </tr>
                    <tr>
                        <th>Orbtal Period</th>
                        <td>{{ displayOrbitPeriod }} hours</td>
                    </tr>
                    <tr
                        :class="
                            formData.location.hillSphere <
                            formData.location.stationaryOrbit
                                ? 'table-warning'
                                : ''
                        "
                    >
                        <th>Stationary Orbit</th>
                        <td>
                            {{ addCommas(formData.location.stationaryOrbit) }}
                            km
                        </td>
                    </tr> -->
                </tbody>
            </table>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { IMassDriverForm } from './types';

import { formatNumber, physicsConstants, roundToDecimal } from '../utils';

const props = defineProps<{
    formData: IMassDriverForm;
}>();

const convertedRadius = computed(() => {
    const conversionValue =
        props.formData.bodyRadiusUnit.value * props.formData.bodyRadius;
    return conversionValue;
});

const convertedAcceleration = computed(() => {
    const conversionValue =
        props.formData.accelerationUnit.value * props.formData.acceleration;
    return conversionValue;
});

const gravity = computed(() => {
    return calculateGravity(convertedRadius.value, props.formData.bodyDensity);
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

    console.log('gravity', gravity);
    return gravity;
}

// energy = (mass x velocity²)/2
</script>
