<template>
	<div id="syrtis__app" class="row justify-content-center calculator">
		<div id="syrtis__form" class="col-lg-4">
			<div class="p-2 rounded border mb-5">
				<SyrtisForm :formData="formData" />
			</div>
		</div>
		<div id="syrtis__results" class="col-lg-8">
			<SyrtisResults :formData="formData" />
		</div>
	</div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { onMounted, reactive, watch } from 'vue';

import SyrtisForm from './SyrtisForm.vue';
import SyrtisResults from './SyrtisResults.vue';

import type { ISyrtisForm } from './types';

const formData = reactive<ISyrtisForm>({
	massOne: 1,
	massTwo: 1,
	distance: 1,
});

onMounted(() => {});
</script>
<style></style>
