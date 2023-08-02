<template>
    <div id="lagrange__app" class="row justify-content-center calculator">
        <div id="lagrange__form" class="col-lg-4">
            <div class="p-2 rounded border mb-5">
                <LagrangeForm :formData="formData" />
            </div>
        </div>
        <div id="lagrange__results" class="col-lg-8">
            <LagrangeVisual :formData="formData" />
        </div>
    </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, reactive, ref, watch } from 'vue';

import LagrangeForm from './LagrangeForm.vue';
import LagrangeResults from './LagrangeResults.vue';
import LagrangeVisual from './LagrangeVisual.vue';

import type { ILagrangeForm } from './types';

// TODO: Do we want to move the default value to "constants.ts"?
const formData = reactive<ILagrangeForm>({
    relationship: {
        name: 'Star and Planet',
        value: 'star',
    },
    massOne: 1,
    massTwo: 1,
    distance: 1,
});

onMounted(() => {});

watch(
    () => formData.relationship,
    (newValue) => {
        if (newValue.value === 'star') {
            formData.massOne = 1;
            formData.massTwo = 1;
            formData.distance = 1;
        } else {
            formData.massOne = 1;
            formData.massTwo = 0.012;
            formData.distance = 60.33;
        }
    },
);

// watch(formData.value.relationship, () => {
//     console.log('relationship changed');
//     if (formData.value.relationship.value === 'star') {
//         formData.value.massOne = 1;
//         formData.value.massTwo = 1;
//     } else {
//         formData.value.massOne = 1;
//         formData.value.massTwo = 0.012;
//     }
// });
</script>
<style></style>
