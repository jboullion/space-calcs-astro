<template>
	<div class="p-2 rounded border mb-5">
		<div class="tabs">
			<div class="d-flex mb-4 gap-2">
				<button
					v-for="tab in tabs"
					:key="tab.value"
					class="btn flex-grow-1"
					:class="[
						{
							'btn-primary': activeTab === tab.value,
							'btn-secondary': activeTab !== tab.value,
						},
					]"
					@click="activeTab = tab.value"
				>
					{{ tab.label }}
				</button>
			</div>

			<!-- Basic Tab -->
			<div v-show="activeTab === 'basic'" class="calc-form">
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
					description="The rate at which propellant is consumed by the rocket engine"
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
					id="baseExhaustVelocity"
					label="Exhaust Velocity"
					description="The velocity of the propellant exiting the rocket engine"
				>
					<template v-slot:input>
						<NumberInput
							:key="formData.baseExhaustVelocity"
							id="baseExhaustVelocity"
							type="number"
							class="form-control"
							:model-value="formData.baseExhaustVelocity"
							@update:model-value="
								updateField('baseExhaustVelocity', $event)
							"
							:min="0"
							:step="1"
						/>
					</template>
					<template v-slot:unit>
						<SimpleUnit unit="m/s" />
					</template>
				</InputWrapper>
			</div>

			<!-- Advanced Tab -->
			<div v-show="activeTab === 'advanced'" class="calc-form">
				<InputWrapper
					id="ambientPressure"
					label="Ambient Pressure"
					description="Sea level standard pressure: 101.325 kPa"
				>
					<template v-slot:input>
						<NumberInput
							:key="formData.ambientPressure"
							id="ambientPressure"
							type="number"
							class="form-control"
							:model-value="formData.ambientPressure"
							@update:model-value="
								updateField('ambientPressure', $event)
							"
							:min="0"
							:step="100"
						/>
					</template>
					<template v-slot:unit>
						<SimpleUnit unit="kPa" />
					</template>
				</InputWrapper>

				<InputWrapper
					id="expansionRatio"
					label="Nozzle Expansion Ratio"
					:description="`Standard expansion ratio: ${standardExpansionRatio}%`"
				>
					<template v-slot:input>
						<NumberInput
							:key="formData.expansionRatio"
							id="expansionRatio"
							type="number"
							class="form-control"
							:model-value="formData.expansionRatio"
							@update:model-value="
								updateField('expansionRatio', $event)
							"
							:min="1"
							:step="0.1"
						/>
					</template>
				</InputWrapper>

				<InputWrapper
					id="chamberPressure"
					label="Chamber Pressure"
					:description="`Standard chamber pressure: ${standardChamberPressure}`"
				>
					<template v-slot:input>
						<NumberInput
							:key="formData.chamberPressure"
							id="chamberPressure"
							type="number"
							class="form-control"
							:model-value="formData.chamberPressure"
							@update:model-value="
								updateField('chamberPressure', $event)
							"
							:min="0"
							:step="0.1"
						/>
					</template>
					<template v-slot:unit>
						<SimpleUnit unit="MPa" />
					</template>
				</InputWrapper>

				<InputWrapper
					id="mixtureRatio"
					label="Mixture Ratio (O/F)"
					:description="`Optimal mixture ratio: ${optimalMixtureRatio}`"
				>
					<template v-slot:input>
						<NumberInput
							:key="formData.mixtureRatio"
							id="mixtureRatio"
							type="number"
							class="form-control"
							:model-value="formData.mixtureRatio"
							@update:model-value="
								updateField('mixtureRatio', $event)
							"
							:min="0"
							:step="0.1"
						/>
					</template>
				</InputWrapper>

				<InputWrapper
					id="combustionEfficiency"
					label="Combustion Efficiency"
					:description="`Standard combustion efficiency: ${standardCombustionEfficiency}`"
				>
					<template v-slot:input>
						<NumberInput
							:key="formData.combustionEfficiency"
							id="combustionEfficiency"
							type="number"
							class="form-control"
							:model-value="formData.combustionEfficiency"
							@update:model-value="
								updateField('combustionEfficiency', $event)
							"
							:min="0"
							:max="100"
							:step="0.1"
						/>
					</template>
					<template v-slot:unit>
						<SimpleUnit unit="%" />
					</template>
				</InputWrapper>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import InputWrapper from '../forms/v2/InputWrapper.vue';
import NumberInput from '../forms/v2/NumberInput.vue';
import SimpleUnit from '../forms/v2/SimpleUnit.vue';
import type { IRocketPerformanceForm } from './types';
import { exampleEngines } from './types';

const props = defineProps<{
	formData: IRocketPerformanceForm;
}>();

const emit = defineEmits<{
	'update:formData': [formData: IRocketPerformanceForm];
}>();

const activeTab = ref('basic');

const tabs = [
	{ value: 'basic', label: 'Basic' },
	{ value: 'advanced', label: 'Advanced' },
];

const updateField = (
	field: keyof IRocketPerformanceForm,
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
	tempFormData.baseExhaustVelocity = selectedEngine.baseExhaustVelocity;
	//tempFormData.ambientPressure = selectedEngine.ambientPressure;
	tempFormData.expansionRatio = selectedEngine.expansionRatio;
	tempFormData.chamberPressure = selectedEngine.chamberPressure;
	tempFormData.mixtureRatio = selectedEngine.mixtureRatio;
	tempFormData.combustionEfficiency = selectedEngine.combustionEfficiency;

	emit('update:formData', { ...tempFormData });
};

const optimalMixtureRatio = computed(() => {
	const selectedEngine = exampleEngines.find(
		(engine) => engine.id === props.formData.selectedEngineId,
	);
	return selectedEngine?.mixtureRatio;
});

const standardChamberPressure = computed(() => {
	const selectedEngine = exampleEngines.find(
		(engine) => engine.id === props.formData.selectedEngineId,
	);
	return selectedEngine?.chamberPressure;
});

const standardExpansionRatio = computed(() => {
	const selectedEngine = exampleEngines.find(
		(engine) => engine.id === props.formData.selectedEngineId,
	);
	return selectedEngine?.expansionRatio;
});

const standardCombustionEfficiency = computed(() => {
	const selectedEngine = exampleEngines.find(
		(engine) => engine.id === props.formData.selectedEngineId,
	);
	return selectedEngine?.combustionEfficiency;
});
</script>

<style scoped></style>
