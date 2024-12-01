<template>
	<div class="p-4">
		<h2 class="text-xl font-bold mb-4">Atmospheric Entry Calculator</h2>

		<div class="mb-4">
			<label class="block text-sm font-medium"
				>Entry Velocity (m/s)</label
			>
			<input
				type="number"
				v-model="formData.entryVelocity"
				class="mt-1 w-full rounded-md border-gray-300 shadow-sm"
			/>
		</div>

		<div class="mb-4">
			<label class="block text-sm font-medium"
				>Entry Angle (degrees)</label
			>
			<input
				type="number"
				v-model="formData.entryAngle"
				class="mt-1 w-full rounded-md border-gray-300 shadow-sm"
			/>
		</div>

		<div class="mb-4">
			<label class="block text-sm font-medium">Vehicle Mass (kg)</label>
			<input
				type="number"
				v-model="formData.vehicleMass"
				class="mt-1 w-full rounded-md border-gray-300 shadow-sm"
			/>
		</div>

		<div class="mb-4">
			<label class="block text-sm font-medium">Drag Coefficient</label>
			<input
				type="number"
				v-model="formData.dragCoefficient"
				class="mt-1 w-full rounded-md border-gray-300 shadow-sm"
			/>
		</div>

		<div class="mb-4">
			<label class="block text-sm font-medium"
				>Cross-sectional Area (m²)</label
			>
			<input
				type="number"
				v-model="formData.crossSectionalArea"
				class="mt-1 w-full rounded-md border-gray-300 shadow-sm"
			/>
		</div>

		<div class="mb-4">
			<label class="block text-sm font-medium">Nose Radius (m)</label>
			<input
				type="number"
				v-model="formData.noseRadius"
				class="mt-1 w-full rounded-md border-gray-300 shadow-sm"
			/>
		</div>

		<div class="mb-4">
			<label class="block text-sm font-medium"
				>Initial Altitude (km)</label
			>
			<input
				type="number"
				v-model="formData.initialAltitude"
				class="mt-1 w-full rounded-md border-gray-300 shadow-sm"
			/>
		</div>

		<div class="mt-6 p-4 bg-gray-100 rounded-md">
			<h3 class="font-bold mb-2">Results Summary</h3>
			<p>
				Maximum Deceleration: {{ results.maxDeceleration.toFixed(1) }} g
			</p>
			<p>
				Maximum Heating Rate:
				{{ (results.maxHeating / 1e6).toFixed(1) }} MW/m²
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { AtmosphericEntryForm } from './types';

interface Results {
	maxDeceleration: number;
	maxHeating: number;
}

defineProps<{
	formData: AtmosphericEntryForm;
	results: Results;
}>();
</script>
