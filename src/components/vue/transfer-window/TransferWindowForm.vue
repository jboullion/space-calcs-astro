<template>
	<div class="calc-form">
		<div class="p-2 rounded border mb-5">
			<SelectInput
				id="origin-location"
				label="Origin Planet"
				v-model="formData.origin"
				:options="planets"
			/>

			<SelectInput
				id="destination-location"
				label="Destination Planet"
				v-model="formData.destination"
				:options="planets"
			/>

			<InputWrapper id="originOrbit" label="Origin Orbit" description="">
				<template v-slot:input>
					<NumberInput
						id="departure"
						:key="`departure-${formData.originOrbit}`"
						type="number"
						class="form-control"
						v-model.number="formData.originOrbit"
						:min="1"
						:max="100000"
						:step="1"
					/>
				</template>
				<template v-slot:unit>
					<SimpleUnit unit="km" />
				</template>
			</InputWrapper>

			<InputWrapper
				id="destinationOrbit"
				label="Ship Mass"
				description=""
			>
				<template v-slot:input>
					<NumberInput
						id="departure"
						:key="`departure-${formData.destinationOrbit}`"
						type="number"
						class="form-control"
						v-model.number="formData.destinationOrbit"
						:min="1"
						:max="100000"
						:step="1"
					/>
				</template>
				<template v-slot:unit>
					<SimpleUnit unit="km" />
				</template>
			</InputWrapper>

			<CheckboxInput
				id="aerobrake"
				label="Aerobrake?"
				v-model="formData.aerobrake"
				:value="false"
			/>
			<!-- 
			<CheckboxInput
				id="porkchop"
				label="Porkchp Plot"
				v-model="formData.porkchop"
				:value="true"
			/> -->

			<CheckboxInput
				id="depart-today"
				label="Depart Today?"
				v-model="formData.departureToday"
				:value="false"
			/>

			<DateInput
				id="departure-date-min"
				label="Departure Date Min"
				v-model="formData.departureDateMin"
			/>

			<DateInput
				id="departure-date-max"
				label="Departure Date Max"
				v-model="formData.departureDateMax"
				:value="formData.departureDateMax"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// 1. Add in souces of friction and drag? (air resistance, etc.)
// 2. Add "Car" mass and drag coefficient?

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from 'vue';
import InputWrapper from '../forms/v2/InputWrapper.vue';
import NumberInput from '../forms/v2/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import SimpleUnit from '../forms/v2/SimpleUnit.vue';
import CheckboxInput from '../forms/CheckboxInput.vue';
import DateInput from '../forms/v2/DateInput.vue';
import type { ITransferWindowForm } from './types';
import { planets } from './constants';

const props = defineProps<{
	formData: ITransferWindowForm;
}>();

const emit = defineEmits([]);

onMounted(() => {});
</script>
