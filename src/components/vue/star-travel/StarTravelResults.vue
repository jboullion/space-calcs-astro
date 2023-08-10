<template>
    <div>
        <!-- <StarTravelVisual
            :formData="formData"
            :trackLengthM="trackLengthM"
            :travelTime="travelTime"
            :timeUnit="timeUnit"
        /> -->

        <div class="p-2 rounded border mb-5">
            <table class="table mb-0">
                <tbody class="align-middle">
                    <!-- <tr>
                        <th>Body Circumference</th>
                        <td class="text-end">
                            {{ formatNumber(bodyCircumference) }}
                        </td>
                        <td style="width: 25%">
                            {{ props.formData.bodyRadiusUnit.label }}
                        </td>
                    </tr>
                    
                    <tr>
                        <th class="border-0">Energy Required</th>
                        <td class="text-end border-0">
                            {{ formatNumber(energyRequired) }}
                        </td>
                        <td class="border-0">
                            <UnitSelect
                                id="energyUnits"
                                v-model="energyUnit"
                                :units="energyUnits"
                            />
                        </td>
                    </tr> -->
                </tbody>
            </table>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import UnitSelect from '../forms/v2/UnitSelect.vue';
//import StarTravelVisual from './StarTravelVisual.vue';
import type { IStarTravelForm } from './types';
import {
    accelerationUnits,
    lengthUnits,
    massUnits,
    energyUnits,
    hourUnits,
    roundToDecimal,
    physicsConstants,
    formatNumber,
    m2sTog,
    convertUnitValue,
} from '../utils';

const props = defineProps<{
    formData: IStarTravelForm;
}>();

// const lengthUnit = ref(lengthUnits[1]);
// const circumferenceUnit = ref(lengthUnits[1]);
// const energyUnit = ref(energyUnits[9]);
// const timeUnit = ref(hourUnits[2]);
</script>
