<template>
    <div class="split-details">
        <div class="alert py-2 mb-2" :class="angularComfort" role="alert">
            <i class="fas fa-undo"></i> Angular Velocity (radians/s):
            {{ formatNumber(radsPerSec) }}
        </div>

        <div class="alert py-2 mb-2" :class="velocityComfort" role="alert">
            <i class="fas fa-flip-horizontal fa-sync-alt"></i>
            Tangential Velocity (m/s):
            {{ formatNumber(pointTangentialVelocity) }}<br />
        </div>

        <div class="alert py-2 mb-2" :class="gravityComfort" role="alert">
            <i class="fas fa-download"></i> Centripetal Acceleration (m/s²):
            {{ formatNumber(pointCentripetalAcceleration) }}
        </div>

        <div class="alert py-2 mb-3" :class="gravityComfort" role="alert">
            <i class="fas fa-cloud-download-alt"></i> Apparent Gravity (g):
            {{ formatNumber(pointGravity) }}
        </div>

        <!-- <Legend /> -->
    </div>
</template>

<script setup lang="ts">
defineProps<{
    angularComfort: 'alert-success' | 'alert-warning' | 'alert-danger';
    formatNumber: (value: number, decimals?: number) => string;
    radsPerSec: number;
    velocityComfort: 'alert-success' | 'alert-warning' | 'alert-danger';
    pointTangentialVelocity: number;
    gravityComfort: 'alert-success' | 'alert-warning' | 'alert-danger';
    pointCentripetalAcceleration: number;
    pointGravity: number;
}>();
</script>
