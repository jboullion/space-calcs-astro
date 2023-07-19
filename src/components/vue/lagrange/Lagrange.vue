<template>
    <div id="lagrange__app" class="row justify-content-center calculator">
        <div id="lagrange__form" class="col-lg-4">
            <div class="p-2 rounded border mb-5">
                <LagrangeForm :formData="formData" />
            </div>
        </div>
        <div id="lagrange__results" class="col-lg-8">
            <LagrangeVisual :formData="formData" />

            <div class="p-2 rounded border mb-5">
                <LagrangeResults :formData="formData" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref, watch } from 'vue';

import LagrangeForm from './LagrangeForm.vue';
import LagrangeResults from './LagrangeResults.vue';
import LagrangeVisual from './LagrangeVisual.vue';

import type { ILagrangeForm } from './types';

// TODO: Do we want to move the default value to "constants.ts"?
const formData = ref<ILagrangeForm>({
    relationship: 'star',
    massOne: 1,
    massTwo: 1,
    distance: 1,
});

onMounted(() => {});

// watch(
//     () => formData.value,
//     (newValue) => {
//         //console.log('formData changed', newValue);
//     },
//     { deep: true },
// );
</script>
<style></style>
