<template>
	<div class="p-2 rounded border mb-3">
		<TextInput
			id="calcSave"
			label="Save"
			placeholder="Save Name"
			maxlength="50"
			v-model="saveName"
		>
			<template #append>
				<button
					class="btn btn-secondary"
					type="button"
					id="calcSave"
					:disabled="saveName.length < 3 || loading"
					@click="onSave"
				>
					Save
				</button>
			</template>
		</TextInput>

		<SelectInput
			v-if="savedCalculators && savedCalculators.length > 0"
			:key="'calcLoad' + loadKey"
			id="calcLoad"
			label="Load"
			:options="saveCalcOptions"
			v-model="selectedSave"
		>
			<template #append>
				<button
					class="btn btn-secondary"
					type="button"
					id="calcLoad"
					@click="loadCalc"
				>
					Load
				</button>
			</template>
		</SelectInput>
	</div>
</template>

<script setup lang="ts">
import SelectInput from '../forms/SelectInput.vue';
import TextInput from '../forms/TextInput.vue';
import {
	getCalculatorSaves,
	supabase,
	updateSavedCalculators,
} from '../../../lib/supabaseClient.js';
import { useStore } from '@nanostores/vue';
import { storeUser } from '../../../utils/store';
import { ref, onMounted } from 'vue';
import type { CalculatorRow } from '../../../services/database.types';

const props = defineProps<{
	data: any;
}>();

const emit = defineEmits(['loadCalc']);

// read the store value with the `useStore` hook
const $user = useStore(storeUser);
const calculatorId = 'flywheel';

const loading = ref<boolean>(false);
const loadKey = ref<number>(0);
const saveName = ref<string>('');
const saveCalcOptions = ref<{ name: string; value: number }[]>([]);
const savedCalculators = ref<CalculatorRow[] | null>([]);
const selectedSave = ref<{ name: string; value: number }>({
	name: 'Select a save',
	value: 0,
});

onMounted(async () => {
	savedCalculators.value = await getCalculatorSaves(calculatorId);

	updateCalcOptions();
});

function updateCalcOptions() {
	if (!savedCalculators.value) return;

	saveCalcOptions.value = savedCalculators.value.map((calc) => {
		return {
			name: calc.name ?? 'Unnamed',
			value: calc.id,
		};
	});
}

async function onSave() {
	if (!$user) return;

	loading.value = true;

	// TODO: We could just save to local storage for now? We will definitely want to save to the DB in the future
	// TODO: Do we leave the saves pointing to the DB for now? Or do we save to local storage for now?
	// TODO: Perhaps if not logged in it saves to local storage? Then when logged in it saves to DB?
	// Perhaps PRO members save to DB and regular members save local?

	await updateSavedCalculators(props.data, calculatorId, saveName.value);
	savedCalculators.value = await getCalculatorSaves(calculatorId);

	updateCalcOptions();

	loadKey.value++;
	loading.value = false;
	saveName.value = '';

	// if (error) {
	//     console.log(error);
	// }
}

async function loadCalc() {
	if (!selectedSave.value) return;

	const loadCalc = savedCalculators.value?.find((calc) => {
		return calc.id == selectedSave.value?.value;
	});

	if (!loadCalc) return;

	emit('loadCalc', JSON.parse(JSON.stringify(loadCalc.data)));
}
</script>
