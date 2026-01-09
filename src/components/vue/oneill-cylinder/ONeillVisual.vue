<template>
	<div
		id="oneill-canvas"
		class="canvas-wrapper border"
		style="position: relative; height: 500px; width: 100%"
	>
		<i v-if="loading" class="fas fa-cog fa-spin mb-0 h1"></i>
	</div>
</template>

<script setup lang="ts">
import { watch, computed, onMounted, onBeforeUnmount, ref } from 'vue';
import type { ONeillCylinderForm } from './types';
import { useThreeScene } from './composables/useThreeScene';
import { useStationModel } from './composables/useStationModel';
import { throttle } from '../../../utils/utils';
import { useStationCalculations } from './composables/useStationCalculations';
// import { usePhysicsParticleSystem } from './composables/usePhysicsParticleSystem';
import { useStationLighting } from './composables/useStationLighting';

const props = defineProps<{
	formData: ONeillCylinderForm;
}>();

const loading = ref(true);

const { stationWidth, internalRadius, spinRads, G_Accel, rotationSpeed } =
	useStationCalculations(props.formData);

const radius = computed(() => props.formData.structure.radius);

const { three, setupThreeJS, updateRenderSize, updateCameraPosition, animate } =
	useThreeScene('oneill-canvas', stationWidth, rotationSpeed, radius);

const { buildStation, updateStation } = useStationModel(three, internalRadius);

//const { initParticles, updateParticles, removeParticles } =
//	usePhysicsParticleSystem(three, stationWidth, radius);

// const { initLights, updateLights, removeLights } = useStationLighting(
// 	three,
// 	internalRadius,
// );

// Window resize handler
const throttledResize = throttle(updateRenderSize, 32);

// Scene setup and cleanup
onMounted(async () => {
	window.addEventListener('resize', throttledResize, { passive: true });
	await load();
});

// In onBeforeUnmount:
onBeforeUnmount(() => {
	window.removeEventListener('resize', throttledResize);
	//removeParticles(); // Add this line
	//removeLights();
});

// Watch for form data changes that affect the geometry
watch(
	() => [
		props.formData.structure.radius,
		props.formData.structure.cylinderLength,
		props.formData.structure.caps,
		props.formData.internal.levels,
		props.formData.structure.shellWallThickness,
		props.formData.internal.levelHeight,
	],
	() => {
		updateStation(props.formData);
		updateCameraPosition(); // Update camera when dimensions change
	},
);

const load = async () => {
	loading.value = false;
	// Initial scene setup
	setupThreeJS();
	buildStation(props.formData);
	three.group.position.z = -props.formData.structure.cylinderLength / 2;
	animate(0);
	//initParticles(props.formData);
	//initLights(props.formData);
};
</script>
