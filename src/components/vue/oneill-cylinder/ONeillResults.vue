<template>
	<div>
		<h2>Results</h2>
		<div>
			<table class="table">
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
					<tr>
						<td>Internal Floors Area</td>
						<td class="text-end">
							{{ formatNumber(floorsArea) }} km<sup>2</sup>
						</td>
					</tr>
					<tr>
						<th>Total Floor Area</th>
						<th class="text-end">
							{{ formatNumber(totalFloorArea) }} km<sup>2</sup>
						</th>
					</tr>
				</tbody>
			</table>

			<table class="table">
				<thead class="cursor-pointer">
					<tr @click="showMass = !showMass">
						<th class="bg-dark text-white" colspan="2">Mass</th>
					</tr>
				</thead>
				<tbody v-show="showMass">
					<tr>
						<td>{{ formData.structure.material.name }} Mass</td>
						<td class="text-end">
							{{ formatNumber(materialMass / 1000, 0) }} ton
						</td>
					</tr>
					<!-- <tr>
            <td>Shielding Mass</td>
            <td class="text-end">ton</td>
          </tr> -->
					<tr>
						<td>Internal Structures Mass</td>
						<td class="text-end">
							{{ formatNumber(internalStructureMass / 1000, 0) }}
							ton
						</td>
					</tr>
					<tr>
						<td>Air Mass</td>
						<td class="text-end">
							{{ formatNumber(airMass, 0) }} ton
						</td>
					</tr>
					<tr class="">
						<th>Total Structure Mass</th>
						<th class="text-end">
							{{ formatNumber(totalStructureMass, 0) }} ton
						</th>
					</tr>
					<tr>
						<td>Internal Floors Mass</td>
						<td class="text-end">
							{{ formatNumber(floorsMass, 0) }} ton
						</td>
					</tr>
					<tr class="">
						<th>Total Mass</th>
						<th class="text-end">
							{{ formatNumber(finalTotalMass, 0) }} ton
						</th>
					</tr>
				</tbody>
			</table>

			<table class="table">
				<thead class="cursor-pointer">
					<tr @click="showPopulation = !showPopulation">
						<th class="bg-dark text-white" colspan="2">
							Population
						</th>
					</tr>
				</thead>
				<tbody v-show="showPopulation">
					<tr>
						<td>Urban Population</td>
						<td class="text-end">
							{{ formatNumber(urbanPopulation) }} people
						</td>
					</tr>
					<tr>
						<td>Population Density</td>
						<td class="text-end">
							{{ formatNumber(populationDensity) }} people/km²
						</td>
					</tr>
					<tr>
						<td>Unused Area</td>
						<td class="text-end">
							{{ formatNumber(unusedArea) }} km²
						</td>
					</tr>
				</tbody>
			</table>

			<!-- <table class="table">
        <thead class="cursor-pointer">
          <tr @click="showShielding = !showShielding">
            <th class="bg-dark text-white" colspan="2">
              <i class="fa-solid fa-caret-up" v-if="showShielding"></i>
              <i class="fa-solid fa-caret-down" v-else></i> Shielding
            </th>
          </tr>
        </thead>
        <tbody v-show="showShielding">
          <tr>
            <td>Up Shielding</td>
            <td class="text-end">kg</td>
          </tr>
          <tr>
            <td>Down Shielding</td>
            <td class="text-end">kg</td>
          </tr>
          <tr>
            <td>Center Shielding</td>
            <td class="text-end">kg</td>
          </tr>
        </tbody>
      </table> -->
		</div>
	</div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ONeillCylinderForm } from './types';

import { formatNumber } from '../utils';
import { useStationCalculations } from './composables/useStationCalculations';

const props = defineProps<{
	formData: ONeillCylinderForm;
}>();
const showArea = ref(true);
const showMass = ref(true);
const showPopulation = ref(true);
const showShielding = ref(false);

const {
	shellFloorArea,
	floorsArea,
	floorsMass,
	totalFloorArea,
	materialMass,
	internalStructureMass,
	airMass,
	totalStructureMass,
	finalTotalMass,
	urbanPopulation,
	populationDensity,
	unusedArea,
} = useStationCalculations(props.formData);
</script>
