<template>
	<div id="fly-wheel__app" class="row justify-content-center calculator">
		<div id="fly-wheel__form" class="col-lg-4">
			<FlyWheelForm :formData="formData" />
			<!-- <SaveLoad :data="formData" @loadCalc="loadCalc" /> -->
		</div>
		<div id="fly-wheel__results" class="col-lg-8">
			<!-- <FlyWheelResults :formData="formData" /> -->
		</div>
	</div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { onMounted, reactive, ref } from 'vue';

import FlyWheelForm from './FlyWheelForm.vue';
import FlyWheelResults from './FlyWheelResults.vue';

import type { IFlyWheelForm } from './types';

import { flyWheelGeometry, materials } from './constants';

import SaveLoad from '../auth/SaveLoad.vue';

const formData = ref<IFlyWheelForm>({
	geometry: flyWheelGeometry[0],
	mass: 1000,
	radius: 3,
	rpm: 1000,
	material: materials[0],
	roundTripEfficiency: 0.9,
	powerDraw: 1,
});

async function loadCalc(loadCalc: IFlyWheelForm) {
	formData.value = { ...loadCalc };

	const flyWheelType = flyWheelGeometry.find(
		(geometry) => geometry.value === loadCalc.geometry.value,
	);
	formData.value.geometry = flyWheelType ?? flyWheelGeometry[0];

	const flyWheelMaterial = materials.find(
		(material) => material.value === loadCalc.material.value,
	);
	formData.value.material = flyWheelMaterial ?? materials[0];
}

// watch(
//     () => formData.energyUnit,
//     (newUnit, oldUnit) => {
//         formData.storedEnergy = convertUnitValue(
//             formData.storedEnergy,
//             newUnit,
//             oldUnit,
//         );
//     },
// );
</script>
<style></style>
