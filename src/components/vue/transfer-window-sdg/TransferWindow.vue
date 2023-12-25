<template>
	<div
		id="transfer-window__app"
		class="row justify-content-center calculator"
	>
		<div id="transfer-window__form" class="col-lg-4">
			<TransferWindowForm :formData="formData" />
		</div>
		<div id="transfer-window__results" class="col-lg-8">
			<TransferWindowResults :formData="formData" />
		</div>
	</div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { onBeforeMount, onMounted, reactive, ref } from 'vue';
import TransferWindowForm from './TransferWindowForm.vue';
import TransferWindowResults from './TransferWindowResults.vue';
import type { ITransferWindowForm } from './types';
import { planets } from './constants';

const formData = ref<ITransferWindowForm>({
	origin: planets[2],
	destination: planets[4],
	originOrbit: 600,
	destinationOrbit: 600,
	aerobrake: false,
	// porkchop: true,
	departureToday: true,
	departureDateMin: new Date(),
	departureDateMax: new Date(
		new Date().getTime() + 1000 * 60 * 60 * 24 * 365,
	),
});

onBeforeMount(() => {});

onMounted(() => {});
</script>
<style></style>
