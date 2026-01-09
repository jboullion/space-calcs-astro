<template>
	<div>
		<ResultTable>
			<template #title>
				<h2 class="text-center p-2">Results</h2>
			</template>

			<tr>
				<th>Effective Exhaust Velocity</th>
				<td class="text-end">
					{{ effectiveExhaustVelocity.toFixed(2) }} m/s
				</td>
			</tr>
			<tr>
				<th>Specific Impulse (Isp)</th>
				<td class="text-end">
					{{ specificImpulse.toFixed(2) }} seconds
				</td>
			</tr>
			<tr>
				<th>Thrust</th>
				<td class="text-end">{{ (thrust / 1000).toFixed(2) }} kN</td>
			</tr>
		</ResultTable>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ResultTable from '../forms/v2/ResultTable.vue';
import { exampleEngines, type IRocketPerformanceForm } from './types';
import { physicsConstants } from '../utils';

const props = defineProps<{
	formData: IRocketPerformanceForm;
}>();

const chamberPressureMPa = computed(() => {
	return props.formData.chamberPressure || 0;
});

const getMixtureRatioEfficiency = (
	actualRatio: number,
	optimalRatio: number,
	propellantType: string,
) => {
	const deviation = Math.abs(actualRatio - optimalRatio) / optimalRatio;
	const penaltyFactors = {
		kerolox: 0.4,
		hydrolox: 0.6,
		methalox: 0.5,
	};
	const penalty =
		penaltyFactors[propellantType as keyof typeof penaltyFactors] || 0.5;
	return Math.max(0.85, 1 - deviation * penalty);
};

const effectiveExhaustVelocity = computed(() => {
	let velocity = props.formData.baseExhaustVelocity;
	const selectedEngine = exampleEngines.find(
		(e) => e.id === props.formData.selectedEngineId,
	);

	if (!selectedEngine) return velocity;

	// Mixture ratio efficiency
	if (props.formData.mixtureRatio) {
		const mixEfficiency = getMixtureRatioEfficiency(
			props.formData.mixtureRatio,
			selectedEngine.mixtureRatio,
			selectedEngine.propellantType,
		);
		velocity *= mixEfficiency;
	}

	// Pressure correction
	if (
		props.formData.chamberPressure &&
		props.formData.ambientPressure &&
		props.formData.expansionRatio
	) {
		const pc = props.formData.chamberPressure * 1000;
		const pa = props.formData.ambientPressure;
		const er = props.formData.expansionRatio;
		const pressureRatio = pa / pc;
		const velocityCorrection = Math.sqrt(1 - pressureRatio * er);
		velocity *= velocityCorrection;
	}

	// Combustion efficiency
	if (props.formData.combustionEfficiency) {
		velocity *= props.formData.combustionEfficiency / 100;
	}

	return velocity;
});

const specificImpulse = computed(() => {
	return effectiveExhaustVelocity.value / physicsConstants.g;
});

const thrust = computed(() => {
	return props.formData.massFlowRate * effectiveExhaustVelocity.value;
});
</script>
