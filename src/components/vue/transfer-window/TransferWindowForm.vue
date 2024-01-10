<template>
	<div class="calc-form">
		<div class="p-2 rounded border mb-5">
			<SelectInput
				id="origin-location"
				label="Origin Planet"
				v-model="modelValue.origin"
				:options="planets"
			/>

			<SelectInput
				id="destination-location"
				label="Destination Planet"
				v-model="modelValue.destination"
				:options="planets"
			/>

			<InputWrapper id="originOrbit" label="Origin Orbit" description="">
				<template v-slot:input>
					<NumberInput
						id="departure"
						:key="`departure-${modelValue.originOrbit}`"
						type="number"
						class="form-control"
						v-model.number="modelValue.originOrbit"
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
				label="Destination Orbit"
				description=""
			>
				<template v-slot:input>
					<NumberInput
						id="departure"
						:key="`departure-${modelValue.destinationOrbit}`"
						type="number"
						class="form-control"
						v-model.number="modelValue.destinationOrbit"
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
				v-model="modelValue.aerobrake"
				:value="false"
			/>

			<DateInput
				id="departure-date-min"
				label="Departure Date Min"
				:model-value="localDepartureDateMin"
				:max="localDepartureDateMax"
				@input="handleMinInput"
			/>

			<DateInput
				id="departure-date-max"
				label="Departure Date Max"
				:model-value="localDepartureDateMax"
				:min="localDepartureDateMin"
				@input="handleMaxInput"
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

import { computed, onBeforeMount, ref, watch } from 'vue';
import InputWrapper from '../forms/v2/InputWrapper.vue';
import NumberInput from '../forms/v2/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import SimpleUnit from '../forms/v2/SimpleUnit.vue';
import CheckboxInput from '../forms/CheckboxInput.vue';
import DateInput from '../forms/v2/DateInput.vue';
import type { ITransferWindowForm } from './types';
import { planets } from './planets';

const props = defineProps<{
	modelValue: ITransferWindowForm;
}>();

const emit = defineEmits(['update:modelValue']);

const localDepartureDateMin = ref(props.modelValue.departureDateMin);
const localDepartureDateMax = ref(props.modelValue.departureDateMax);

function handleMinInput(event: InputEvent) {
	if (!event.target || !(event.target instanceof HTMLInputElement)) {
		return;
	}
	localDepartureDateMin.value = new Date(event.target.value);
}

function handleMaxInput(event: Event) {
	if (!event.target || !(event.target instanceof HTMLInputElement)) {
		return;
	}
	localDepartureDateMax.value = new Date(event.target.value);
}

watch(localDepartureDateMin, (newValue) => {
	props.modelValue.departureDateMin = new Date(newValue);
	emit('update:modelValue', props.modelValue);
});

watch(localDepartureDateMax, (newValue) => {
	props.modelValue.departureDateMax = new Date(newValue);
	emit('update:modelValue', props.modelValue);
});
</script>
