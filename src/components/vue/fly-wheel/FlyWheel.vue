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

import { nextTick, onMounted, reactive, ref, watch } from 'vue';

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
import { getCalculatorSaves, supabase } from '../../../lib/supabaseClient.js';
import { useStore } from '@nanostores/vue';
import { storeUser } from '../store';
import type { User } from '@supabase/supabase-js';

// read the store value with the `useStore` hook
const $user = useStore(storeUser);
const calculatorId = 'flywheel';

// TODO Need to create a type for the calculators table
type FlyWheelRow = {
    calculator_id: string | null;
    created_at: string;
    data: any; // IFlyWheelForm JSON field
    id: number;
    name: string | null;
    user_id: string | null;
};

const savedCalculators = ref<FlyWheelRow[] | null>([]);

const formData = reactive<IFlyWheelForm>({
    geometry: flyWheelGeometry[0],
    mass: 1000,
    radius: 3,
    rpm: 1000,
    material: materials[0],
    roundTripEfficiency: 0.9,
    powerDraw: 1,
});

onMounted(async () => {
    savedCalculators.value = await getCalculatorSaves(calculatorId);
});

async function onSave() {
    if (!$user) return;

    // TODO: For now only save one row per user. In future / pro users might save more
    const { error } = await supabase.from('calculators').upsert({
        id: savedCalculators.value?.[0]?.id,
        name: 'Fly Wheel',
        data: formData,
        user_id: $user.value?.id,
        calculator_id: calculatorId,
    });

    // if (error) {
    //     console.log(error);
    // }
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
