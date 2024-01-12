<template>
	<div
		id="transfer-window__app"
		class="row justify-content-center calculator"
	>
		<div id="transfer-window__form" class="col-lg-4">
			<TransferWindowForm
				v-model="formData"
				@update:model-value="formData = $event"
			/>
		</div>
		<div id="transfer-window__results" class="col-lg-8">
			<!-- <TransferWindowResults :formData="formData" /> -->
			<TransferWindowVisuals :formData="formData" />
		</div>
	</div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { onBeforeMount, onMounted, reactive, ref } from 'vue';
import TransferWindowForm from './TransferWindowForm.vue';
import TransferWindowVisuals from './TransferWindowVisuals.vue';
import type { ITransferWindowForm } from './types';
import { planets } from './planets';
import { MS_YEAR } from './constants';

const formData = ref<ITransferWindowForm>({
	origin: planets[2],
	destination: planets[3],
	originOrbit: 600,
	destinationOrbit: 600,
	aerobrake: false,
	// porkchop: true, // TODO: Properly implement porkchop
	departureToday: false, // TODO: Probably remove this
	departureDateMin: new Date(),
	departureDateMax: new Date(new Date().getTime() + MS_YEAR),
});

onBeforeMount(() => {});

onMounted(() => {});

// watch our formdata departureDateMin and departureDateMax values
</script>
<style></style>
