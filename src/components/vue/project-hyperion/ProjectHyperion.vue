<template>
	<div class="project-hyperion row justify-content-center">
		<div class="col-lg-5">
			<div class="p-2 rounded border">
				<ProjectHyperionForm v-model="formData" />
			</div>
		</div>
		<div class="col-lg-7">
			<ProjectHyperionVisuals :formData="formData" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProjectHyperionForm from './ProjectHyperionForm.vue';
import ProjectHyperionVisuals from './ProjectHyperionVisuals.vue';
import type { IHyperionFormData } from './types';

const formData = ref<IHyperionFormData>({
	structure: {
		radius: 1, // km
		length: 5, // km
	},
});
</script>

<style scoped>
.project-hyperion {
	margin-top: 2rem;
}
</style>
