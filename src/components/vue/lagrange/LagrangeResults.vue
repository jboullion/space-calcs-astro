<template>
    <div>
        <h2>Results</h2>
        <div>
            <!-- <table class="table">
        <thead class="cursor-pointer">
          <tr @click="showArea = !showArea">
            <th class="bg-dark text-white" colspan="2">Area</th>
          </tr>
        </thead>
        <tbody v-show="showArea">
          <tr>
            <td>Shell Floor Area</td>
            <td class="text-end">
              {{ formatNumber(shellFloorArea) }} km<sup>2</sup>
            </td>
          </tr>
        </tbody>
      </table> -->
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ILagrangeForm } from './types';

import { formatNumber, physicsConstants, roundToDecimal } from '../utils';

const props = defineProps<{
    formData: ILagrangeForm;
}>();
</script>
