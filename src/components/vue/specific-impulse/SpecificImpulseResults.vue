<template>
	<div>
		<ResultTable>
			<template #title>
				<h2>Specific Impulse Results</h2>
			</template>
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
import type { ISpecificImpulseForm } from './types';

const props = defineProps<{
	formData: ISpecificImpulseForm;
}>();

const effectiveExhaustVelocity = computed(() => {
	return props.formData.exhaustVelocity;
});

const specificImpulse = computed(() => {
	if (props.formData.gravity === 0) return 0;
	return effectiveExhaustVelocity.value / props.formData.gravity;
});

const thrust = computed(() => {
	return props.formData.massFlowRate * props.formData.exhaustVelocity;
});
</script>
