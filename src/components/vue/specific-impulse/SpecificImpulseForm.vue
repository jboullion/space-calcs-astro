<template>
	<div class="p-2 rounded border mb-5">
		<div class="calc-form">
			<InputWrapper
				id="selectedEngineId"
				label="Example Rocket Engines"
				description="Select a pre-configured rocket engine"
			>
				<template v-slot:input>
					<select
						class="form-select"
						:value="formData.selectedEngineId"
						@change="selectEngine($event)"
					>
						<option
							v-for="engine in exampleEngines"
							:key="engine.id"
							:value="engine.id"
						>
							{{ engine.name }}
						</option>
					</select>
				</template>
			</InputWrapper>

			<InputWrapper
				id="massFlowRate"
				label="Mass Flow Rate"
				description="Enter the propellant mass flow rate in kg/s"
			>
				<template v-slot:input>
					<NumberInput
						:key="formData.massFlowRate"
						id="massFlowRate"
						type="number"
						class="form-control"
						:model-value="formData.massFlowRate"
						@update:model-value="
							updateField('massFlowRate', $event)
						"
						:min="0.0001"
						:step="0.1"
					/>
				</template>
				<template v-slot:unit>
					<SimpleUnit unit="kg/s" />
				</template>
			</InputWrapper>

			<InputWrapper
				id="exhaustVelocity"
				label="Exhaust Velocity"
				description="Enter the exhaust velocity in m/s"
			>
				<template v-slot:input>
					<NumberInput
						:key="formData.exhaustVelocity"
						id="exhaustVelocity"
						type="number"
						class="form-control"
						:model-value="formData.exhaustVelocity"
						@update:model-value="
							updateField('exhaustVelocity', $event)
						"
						:min="0"
						:step="1"
					/>
				</template>
				<template v-slot:unit>
					<SimpleUnit unit="m/s" />
				</template>
			</InputWrapper>

			<InputWrapper
				id="gravity"
				label="Standard Gravity"
				description="Standard gravity constant (default: 9.81 m/s²)"
			>
				<template v-slot:input>
					<NumberInput
						:key="formData.gravity"
						id="gravity"
						type="number"
						class="form-control"
						:model-value="formData.gravity"
						@update:model-value="updateField('gravity', $event)"
						:min="0"
						:step="0.01"
					/>
				</template>
				<template v-slot:unit>
					<SimpleUnit unit="m/s²" />
				</template>
			</InputWrapper>
		</div>
	</div>
</template>

<script setup lang="ts">
import InputWrapper from '../forms/v2/InputWrapper.vue';
import NumberInput from '../forms/v2/NumberInput.vue';
import SimpleUnit from '../forms/v2/SimpleUnit.vue';
import type { ISpecificImpulseForm } from './types';
import { exampleEngines } from './types';

const props = defineProps<{
	formData: ISpecificImpulseForm;
}>();

const emit = defineEmits<{
	'update:formData': [formData: ISpecificImpulseForm];
}>();

const updateField = (
	field: keyof ISpecificImpulseForm,
	value: number | string,
) => {
	emit('update:formData', { ...props.formData, [field]: value });
};

const selectEngine = (event: Event) => {
	const engineId = (event.target as HTMLSelectElement).value;
	const selectedEngine = exampleEngines.find(
		(engine) => engine.id === engineId,
	);

	if (!selectedEngine) return;

	const tempFormData = { ...props.formData };

	tempFormData.selectedEngineId = engineId;
	tempFormData.massFlowRate = selectedEngine.massFlowRate;
	tempFormData.exhaustVelocity = selectedEngine.exhaustVelocity;

	emit('update:formData', { ...tempFormData });
};
</script>
