<template>
	<div
		id="hyperion-canvas"
		class="canvas-wrapper border"
		style="position: relative; height: 500px; width: 100%"
	>
		<div
			v-if="!isLocked"
			class="controls-info position-absolute top-50 start-50 translate-middle text-center p-3 bg-light rounded"
		>
			Click to start<br />
			<small class="text-muted">
				WASD - Move<br />
				Mouse - Look around<br />
				ESC - Exit
			</small>
		</div>
		<i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { useHyperionScene } from './composables/useHyperionScene';
import { useHyperionModel } from './composables/useHyperionModel';
import type { IHyperionFormData } from './types';

const props = defineProps<{
	formData: IHyperionFormData;
}>();

const {
	three,
	loading,
	isLocked,
	setupScene,
	updateRenderSize,
	updateMovement,
	handleKeyDown,
	handleKeyUp,
} = useHyperionScene('hyperion-canvas');

const { createCylinder, updateCylinder } = useHyperionModel(three);

// Animation loop
function animate() {
	requestAnimationFrame(animate);
	if (!three.renderer) return;

	updateMovement(props.formData);
	three.renderer.render(three.scene, three.camera);
}

// Watch for form data changes
watch(
	() => [props.formData.structure.radius, props.formData.structure.length],
	() => {
		updateCylinder(props.formData);
		// Reset camera position when dimensions change
		three.camera.position.set(props.formData.structure.radius * 0.8, 0, 0);
	},
	{ deep: true },
);

// Lifecycle hooks
onMounted(() => {
	loading.value = false;
	setupScene(props.formData);
	createCylinder(props.formData);
	animate();

	window.addEventListener('resize', updateRenderSize);
	window.addEventListener('keydown', handleKeyDown);
	window.addEventListener('keyup', handleKeyUp);
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', updateRenderSize);
	window.removeEventListener('keydown', handleKeyDown);
	window.removeEventListener('keyup', handleKeyUp);
});
</script>

<style scoped>
.controls-info {
	z-index: 100;
}
</style>
