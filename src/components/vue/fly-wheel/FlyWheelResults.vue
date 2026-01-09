<template>
	<div>
		<ResultTable>
			<tr>
				<th>Stored Energy</th>
				<td class="text-end">
					{{ formatNumber(convertedStoredEnergy, 3) }}
				</td>
				<td style="width: 25%">
					<UnitSelect v-model="energyUnit" :units="energyUnits" />
				</td>
			</tr>
			<tr>
				<th>Moment of Inertia</th>
				<td class="text-end">
					{{ formatNumber(momentOfInertia, 3) }}
				</td>
				<td>
					<SimpleUnit unit="kg·m²" />
				</td>
			</tr>
			<tr>
				<th>Specific Energy</th>
				<td class="text-end">
					{{ formatNumber(specificEnergy, 3) }}
				</td>
				<td>
					<SimpleUnit unit="J/kg" />
				</td>
			</tr>
			<tr>
				<th>Angular Velocity</th>
				<td class="text-end">
					{{ formatNumber(angularVelocity, 3) }}
				</td>
				<td>
					<SimpleUnit unit="rad/s" />
				</td>
			</tr>
			<tr>
				<th>Required Tensile Strength</th>
				<td class="text-end">
					{{ formatNumber(requiredTensileStrength, 3) }}
				</td>
				<td>
					<SimpleUnit unit="MPa" />
				</td>
			</tr>
			<tr>
				<th>Material Safety</th>
				<td class="text-end" :class="safetyClass">
					{{ safetyStatus }}
				</td>
				<td>
					<span>{{ safetyFactor }}x</span>
				</td>
			</tr>
			<tr>
				<th>Material Density</th>
				<td class="text-end">
					{{ formData.material.density }}
				</td>
				<td>
					<SimpleUnit unit="g/cm³" />
				</td>
			</tr>
			<tr>
				<th>Total Volume</th>
				<td class="text-end">
					{{ formatNumber(volume, 3) }}
				</td>
				<td>
					<SimpleUnit unit="m³" />
				</td>
			</tr>
		</ResultTable>
	</div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import SimpleUnit from '../forms/v2/SimpleUnit.vue';
import UnitSelect from '../forms/v2/UnitSelect.vue';
import ResultTable from '../forms/v2/ResultTable.vue';
import type { IFlyWheelForm } from './types';
import {
	energyUnits,
	physicsConstants,
	formatNumber,
	convertUnitValue,
} from '../utils';

const props = defineProps<{
	formData: IFlyWheelForm;
}>();

const energyUnit = ref(energyUnits[5]); // Default to kWh

// Calculate the moment of inertia
const momentOfInertia = computed(() => {
	return (
		props.formData.geometry.k *
		props.formData.mass *
		Math.pow(props.formData.radius, 2)
	);
});

// Calculate angular velocity in radians per second
const angularVelocity = computed(() => {
	return (2 * Math.PI * props.formData.rpm) / 60;
});

// Calculate stored energy in joules
const storedEnergy = computed(() => {
	return 0.5 * momentOfInertia.value * Math.pow(angularVelocity.value, 2);
});

// Convert to selected energy unit
const convertedStoredEnergy = computed(() => {
	return convertUnitValue(
		storedEnergy.value,
		energyUnit.value,
		energyUnits[0], // Joules
		3,
	);
});

// Calculate specific energy (J/kg)
const specificEnergy = computed(() => {
	return storedEnergy.value / props.formData.mass;
});

// Calculate required tensile strength
const requiredTensileStrength = computed(() => {
	const tensileStrength =
		((storedEnergy.value / props.formData.mass) *
			props.formData.material.density) /
		props.formData.geometry.k;
	return tensileStrength / 100 / 1000; // Convert to MPa
});

// Calculate safety factor compared to material tensile strength
const safetyFactor = computed(() => {
	const factor =
		props.formData.material.tensileStrength / requiredTensileStrength.value;
	return factor.toFixed(2);
});

// Determine if the material is safe for this application
const safetyStatus = computed(() => {
	const factor = parseFloat(safetyFactor.value);
	if (factor < 1) {
		return 'UNSAFE';
	} else if (factor < 1.5) {
		return 'MARGINAL';
	} else {
		return 'SAFE';
	}
});

// CSS class for safety status
const safetyClass = computed(() => {
	const factor = parseFloat(safetyFactor.value);
	if (factor < 1) {
		return 'text-danger fw-bold';
	} else if (factor < 1.5) {
		return 'text-warning fw-bold';
	} else {
		return 'text-success fw-bold';
	}
});

// Calculate approximate volume of the flywheel
const volume = computed(() => {
	let baseVolume;

	switch (props.formData.geometry.value) {
		case 'sphere':
			// V = (4/3)πr³
			baseVolume = (4 / 3) * Math.PI * Math.pow(props.formData.radius, 3);
			break;
		case 'tire':
			// Approximate as a hollow cylinder with 85% inner radius
			const innerRadius = props.formData.radius * 0.85;
			const thickness = props.formData.radius / 4;
			baseVolume =
				Math.PI *
				(Math.pow(props.formData.radius, 2) -
					Math.pow(innerRadius, 2)) *
				thickness;
			break;
		case 'donut':
			// Approximate as a torus with tube radius of 20% of main radius
			const tubeRadius = props.formData.radius * 0.2;
			const centerLineRadius = props.formData.radius - tubeRadius;
			baseVolume =
				2 *
				Math.pow(Math.PI, 2) *
				centerLineRadius *
				Math.pow(tubeRadius, 2);
			break;
		case 'disk':
		default:
			// V = πr²h
			const height = props.formData.radius / 4; // Assuming height is 1/4 of radius
			baseVolume = Math.PI * Math.pow(props.formData.radius, 2) * height;
			break;
	}

	// Calculate mass from density and adjust volume to match
	// Convert material density from g/cm³ to kg/m³
	const densityKgM3 = props.formData.material.density * 1000;

	// V = m/ρ
	return props.formData.mass / densityKgM3;
});
</script>
