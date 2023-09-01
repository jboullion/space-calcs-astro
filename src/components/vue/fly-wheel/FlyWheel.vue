<template>
    <div id="fly-wheel__app" class="row justify-content-center calculator">
        <div id="fly-wheel__form" class="col-lg-4">
            <FlyWheelForm :formData="formData" />
            <button v-if="$user" @click="onSave" class="btn btn-primary">
                Save
            </button>
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

import { nextTick, onMounted, reactive, watch } from 'vue';

import FlyWheelForm from './FlyWheelForm.vue';
import FlyWheelResults from './FlyWheelResults.vue';

import type { IFlyWheelForm } from './types';
import {
    accelerationUnits,
    convertUnitValue,
    massUnits,
    lengthUnits,
    highSpeedUnits,
    energyUnits,
} from '../utils';
import { NumberUnits } from '../forms/types';
import { flyWheelGeometry, materials } from './constants';
import { supabase } from '../../../lib/supabaseClient.js';
import { useStore } from '@nanostores/vue';
import { storeUser } from '../store';
import type { User } from '@supabase/supabase-js';

// read the store value with the `useStore` hook
const $user = useStore(storeUser);

const formData = reactive<IFlyWheelForm>({
    geometry: flyWheelGeometry[0],
    mass: 1000,
    radius: 3,
    rpm: 1000,
    material: materials[0],
    roundTripEfficiency: 0.9,
    powerDraw: 1,
});

onMounted(() => {});

async function onSave() {
    if (!$user) return;

    const { error } = await supabase.from('calculators').insert({
        name: 'Fly Wheel',
        data: formData,
        user_id: $user.value?.id,
    });
    if (error) {
        console.log(error);
    }
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
