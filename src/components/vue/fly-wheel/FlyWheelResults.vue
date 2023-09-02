<template>
    <div>
        <!-- <FlyWheelVisual :formData="formData" :results="results" /> -->

        <ResultTable>
            <!-- <tr>
                <th>Total Travel Time</th>
                <td class="text-end">
                    {{ formatNumber(convertedTravelTime) }}
                </td>
                <td style="width: 25%">
                    <UnitSelect
                        v-model="totalTimeUnit"
                        :units="longTimeUnits"
                    />
                </td>
            </tr>
            <tr>
                <th>Time to Accelerate</th>
                <td class="text-end">
                    {{ formatNumber(convertedTimeToAccelerate, 2) }}
                </td>
                <td>
                    <UnitSelect
                        v-model="accelTimeUnit"
                        :units="longTimeUnits"
                    />
                </td>
            </tr>
            <tr>
                <th>Time to Decelerate</th>
                <td class="text-end">
                    {{ formatNumber(convertedTimeToDecelerate, 2) }}
                </td>
                <td>
                    <UnitSelect
                        v-model="decelTimeUnit"
                        :units="longTimeUnits"
                    />
                </td>
            </tr>

            <tr>
                <th>Acceleration Distance</th>
                <td class="text-end">
                    {{ formatNumber(convertedAccelerationDistance, 3) }}
                </td>
                <td>
                    <UnitSelect
                        v-model="accelDistanceUnit"
                        :units="longDistanceUnits"
                    />
                </td>
            </tr>

            <tr>
                <th>Deceleration Distance</th>
                <td class="text-end">
                    {{ formatNumber(convertedDecelerationDistance, 3) }}
                </td>
                <td>
                    <UnitSelect
                        v-model="decelDistanceUnit"
                        :units="longDistanceUnits"
                    />
                </td>
            </tr>

            <tr>
                <th>Time at Max Velocity</th>
                <td class="text-end">
                    {{ formatNumber(convertedTimeAtMaxVelocity, 2) }}
                </td>
                <td>
                    <UnitSelect
                        v-model="maxVelocityUnit"
                        :units="longTimeUnits"
                    />
                </td>
            </tr>

            <tr>
                <th class="">Energy Required</th>
                <td class="text-end">
                    {{ convertedAccelEnergy }}
                </td>
                <td class="">
                    <UnitSelect
                        v-model="energyRequiredUnit"
                        :units="energyUnits"
                    />
                </td>
            </tr>
            <tr>
                <th>Fuel Mass Required</th>
                <td class="text-end">
                    {{ formatNumber(fuelMassRequired / 1000, 4) }}
                </td>
                <td>
                    <SimpleUnit unit="ton" />
                </td>
            </tr> -->
        </ResultTable>
    </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import SimpleUnit from '../forms/v2/SimpleUnit.vue';
import UnitSelect from '../forms/v2/UnitSelect.vue';
import ResultTable from '../forms/v2/ResultTable.vue';
import FlyWheelVisual from './FlyWheelVisual.vue';
import type { IFlyWheelForm } from './types';
import {
    lengthUnits,
    longDistanceUnits,
    energyUnits,
    hourUnits,
    longTimeUnits,
    physicsConstants,
    formatNumber,
    convertUnitValue,
} from '../utils';

const props = defineProps<{
    formData: IFlyWheelForm;
}>();

const accelTimeUnit = ref(longTimeUnits[0]);
</script>
