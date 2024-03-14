<template>
	<div>
		<h3>Results</h3>
		<!-- <div class="alert alert-danger mt-3" role="alert" v-if="error">
			{{ error }}
		</div> -->
		<div class="result-chart">
			<div id="results-chart" style="width: 100%; height: 400px"></div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ISyrtisForm } from './types';

import { formatNumber, physicsConstants, roundToDecimal } from '../utils';

const props = defineProps<{
	formData: ISyrtisForm;
}>();
</script>
