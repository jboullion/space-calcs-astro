<template>
	<div id="delta-v__app" class="row" v-if="formData" v-cloak>
		<div id="delta-v__form" class="col-lg-4">
			<div class="p-2 rounded mb-5 border">
				<div class="calc-form">
					<NumberInput
						id="payload-mass"
						label="Payload Mass"
						v-model="formData.payloadMass"
						unit="mt"
					/>

					<CheckboxInput
						id="reusable"
						label="Is the rocket reusable?"
						v-model="formData.reusable"
						:value="true"
						tooltip="Save 8% of fuel for landing. Very rough estimate for the boostback burn, reentry burn, landing burn, and remaining fuel combined"
					/>

					<CheckboxInput
						id="two-stage"
						label="Is This a Two Stage Rocket?"
						v-model="formData.twoStage"
						:value="true"
						tooltip="Will this rocket have two stages?"
						@change="updateTwoStage"
					/>

					<div v-show="formData.twoStage">
						<CheckboxInput
							id="refill"
							label="Refill second stage in orbit?"
							v-model="formData.refill"
							:value="true"
							tooltip="Add a full tank of fuel to a 2nd stage in orbit. Greatly extends ΔV."
						/>

						<NumberInput
							id="first-stage"
							label="First Stage Dry Mass"
							v-model="formData.firstStageMass"
							unit="mt"
							tooltip="How massive is the first stage?"
						/>

						<NumberInput
							id="first-stage-fuel"
							label="First Stage Fuel Mass"
							v-model="formData.firstStageFuel"
							unit="mt"
							tooltip="How much fuel is in the first stage?"
						/>

						<NumberInput
							id="specific-impulse-sea"
							label="Sea Level Specific Impulse"
							:key="formData.seaLevelSpecificImpulse"
							v-model="formData.seaLevelSpecificImpulse"
							unit="s"
							@update:modelValue="calcExhaustVelocity"
							tooltip="Sea Level Specific Impulse."
							:description="
								addCommas(formData.seaLevelVelocity) +
								' m/s Exhaust Velocity (V<sub>e</sub>)'
							"
						/>
					</div>

					<NumberInput
						id="rocket-mass"
						:label="
							(formData.twoStage ? 'Second Stage ' : '') +
							'Rocket Mass'
						"
						v-model="formData.rocketMass"
						unit="mt"
						tooltip="Rocket mass is the mass of the rocket without fuel or payload."
					/>

					<NumberInput
						id="fuel-mass"
						:label="
							(formData.twoStage ? 'Second Stage ' : '') +
							'Fuel Mass'
						"
						v-model="formData.fuelMass"
						unit="mt"
					/>

					<NumberInput
						id="specific-impulse"
						:key="formData.specificImpulse"
						:label="
							(formData.twoStage ? 'Second Stage ' : '') +
							'Specific Impulse (I<sub>sp</sub>)'
						"
						v-model="formData.specificImpulse"
						unit="s"
						@update:modelValue="calcExhaustVelocity"
						tooltip="How efficiently an engine creates thrust. Directly related to exhaust velocity."
						:description="
							addCommas(formData.exhaustVelocity) +
							' m/s Exhaust Velocity (V<sub>e</sub>)'
						"
					/>

					<SelectInput
						id="engine"
						label="Example Rocket Engine"
						v-model="formData.engine"
						:options="defaultEngines"
						tooltip="Select a Common Rocket Engine to set example Specific Impulse"
						description="Specific Impulse values are estimates"
						@update:modelValue="updateEngine"
					/>
				</div>
			</div>
		</div>
		<div id="delta-v__results" class="col-lg-8 calc-form">
			<div class="border rounded overflow-hidden mb-3">
				<table class="table table-striped mb-0">
					<tbody>
						<tr v-if="formData.twoStage" class="">
							<th>First Stage ΔV</th>
							<td class="text-end">
								{{ addCommas(firstStageDeltaV) }} m/s
							</td>
						</tr>
						<tr v-if="formData.twoStage" class="">
							<th>Second Stage ΔV</th>
							<td class="text-end">
								{{ addCommas(secondStageDeltaV) }} m/s
							</td>
						</tr>
						<tr class="table-success">
							<th>Total ΔV</th>
							<td class="text-end">
								{{ addCommas(totalDeltaV) }} m/s
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div
				class="btn-group w-100"
				role="group"
				aria-label="Basic example"
			>
				<button
					class="btn"
					:class="{
						'btn-primary': showResult == 'payload',
						'btn-outline-primary': showResult != 'payload',
					}"
					@click="showResultChart('payload')"
				>
					Payload &amp; Delta V
				</button>
				<button
					class="btn"
					:class="{
						'btn-primary': showResult == 'fuel',
						'btn-outline-primary': showResult != 'fuel',
					}"
					@click="showResultChart('fuel')"
				>
					Fuel &amp; Delta V
				</button>
				<button
					class="btn"
					:class="{
						'btn-primary': showResult == 'c3',
						'btn-outline-primary': showResult != 'c3',
					}"
					@click="showResultChart('c3')"
				>
					Payload &amp; C3
				</button>
				<button
					class="btn"
					:class="{
						'btn-primary': showResult == 'map',
						'btn-outline-primary': showResult != 'map',
					}"
					@click="showResultChart('map')"
				>
					Map
				</button>
			</div>

			<div class="result-chart rounded overflow-hidden my-4">
				<div
					id="delta-v-chart"
					v-show="showResult == 'payload'"
					style="width: 100%; height: 400px"
				></div>
				<div
					id="fuel-chart"
					v-show="showResult == 'fuel'"
					style="width: 100%; height: 400px"
				></div>
				<div
					id="c3-chart"
					v-show="showResult == 'c3'"
					style="width: 100%; height: 400px"
				></div>
				<div id="map" v-show="showResult == 'map'">
					<p class="description">
						<small class="text-muted"
							>Map Source:
							<a
								href="https://en.wikipedia.org/wiki/Delta-v_budget#Budget"
								target="_blank"
								>Wikipedia</a
							></small
						>
					</p>
					<img
						src="/images/Solar_system_delta_v_map.svg"
						alt="Delta V Map"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? Optional Improvements!
// 1. Should we move first stage to top of form? When two stage is active then second stage is on bottom?
// 2. Should we add a third stage?
// 3. Do we need payload mass? We already calculate a range? Perhaps we could always do range 100-150?
// 4. Checkbox select number of destinations to display in graph? Can make the data more readable for specific destinations.

import {
	ref,
	computed,
	onMounted,
	onBeforeMount,
	onBeforeUnmount,
	nextTick,
} from 'vue';
import {
	constants,
	rockets,
	destinations,
	defaultEngines,
	formResults,
} from './constants';
import { addCommas } from '../utils';
import type { DeltaVForm } from './types';
import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import CheckboxInput from '../forms/CheckboxInput.vue';

// @ts-ignore
import { GoogleCharts } from 'google-charts';

const updating = ref(false);

const formData = ref<DeltaVForm>({
	//location: null,
	pause: false,
	payloadMass: 10,
	rocketMass: 85,
	fuelMass: 1200,
	fuelType: null,
	engine: {
		name: '-',
		value: '-',
		ispVacuum: 0,
		ispSeaLevel: 0,
	},
	exhaustVelocity: 0,
	seaLevelVelocity: 0,
	specificImpulse: 350,
	seaLevelSpecificImpulse: 330,
	firstStageFuel: 3400,
	firstStageMass: 200,
	//startLocation: null,
	showMap: false,
	showC3: false,
	twoStage: false,
	reusable: false,
	aerobrake: true,
	refill: false,
});

type ResultTabs = 'payload' | 'fuel' | 'c3' | 'map';

const showResult = ref<ResultTabs>('payload');

let deltaVChartHTML: GoogleCharts.api.visualization.LineChart;
let fuelChartHTML: GoogleCharts.api.visualization.LineChart;
let c3ChartHTML: GoogleCharts.api.visualization.LineChart;

/**
 *
 *
 *
 *
 *
 * SETUP
 *
 *
 *
 *
 *
 */
onBeforeMount(() => {
	// Default selected options
	formData.value.engine = defaultEngines[1];

	GoogleCharts.load('52', {
		packages: ['line', 'corechart'],
	}).then(setupCharts);
});

onMounted(() => {
	calcExhaustVelocity();

	window.addEventListener('resize', drawCharts, { passive: true });
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', drawCharts);
});

function showResultChart(chart: ResultTabs) {
	showResult.value = chart;

	if (GoogleCharts.api?.visualization) {
		nextTick(drawCharts);
	}
}

// Only refillvot two stage rockets
function updateTwoStage() {
	if (!formData.value.twoStage) formData.value.refill = false;
}

/**
 *
 *
 *
 *
 * COMPUTED
 *
 *
 *
 *
 * */

const totalDeltaV = computed(() => {
	let deltaV = secondStageDeltaV.value;

	if (formData.value.twoStage) {
		deltaV += firstStageDeltaV.value;
	}

	// When updating our deltaV also update our destination references
	destinations.value.forEach((destination) => {
		destination.percent = Number(
			((deltaV / destination.deltaV) * 100).toFixed(1),
		);
	});

	//const deltaVKM = deltaV / 1000;
	//if (deltaVKM > constants.escVe / 2) {
	formResults.value.C3 = calcC3(deltaV);
	//}

	if (GoogleCharts.api?.visualization) {
		nextTick(drawCharts);
	}

	return round(deltaV, 2);
});

const firstStageDeltaV = computed(() => {
	const deltaV = calcDeltaV(
		secondStageMass.value + formData.value.firstStageMass,
		formData.value.firstStageFuel,
		formData.value.seaLevelVelocity,
		false,
	);

	return round(deltaV, 2);
});

const secondStageMass = computed(() => {
	return (
		formData.value.rocketMass +
		formData.value.payloadMass +
		formData.value.fuelMass
	);
});

const totalRocketMass = computed(() => {
	return (
		formData.value.rocketMass +
		(formData.value.twoStage ? formData.value.firstStageMass : 0)
	);
});

const totalFuelMass = computed(() => {
	return (
		formData.value.fuelMass +
		(formData.value.twoStage ? formData.value.firstStageFuel : 0)
	);
});

const secondStageDeltaV = computed(() => {
	const deltaV = calcDeltaV(
		formData.value.payloadMass + formData.value.rocketMass,
		formData.value.fuelMass,
		formData.value.exhaustVelocity,
		true,
	);

	return round(deltaV, 2);
});

/**
 *
 *
 *
 *
 *
 *
 *  CALC FUNCTIONS
 *
 *
 *
 *
 *
 * */

// NOTE: Saved in case we want to calculate Isp instead of velocity
// function calcIsp(seaLevel = false) {
//   if (seaLevel) {
//     formData.value.seaLevelSpecificImpulse = round(
//       formData.value.seaLevelVelocity / constants.g,
//       3
//     );
//   } else {
//     formData.value.specificImpulse = round(
//       formData.value.exhaustVelocity / constants.g,
//       3
//     );
//   }
// }

function calcExhaustVelocity() {
	formData.value.exhaustVelocity = convertIspToVe(
		formData.value.specificImpulse,
	);
	formData.value.seaLevelVelocity = convertIspToVe(
		formData.value.seaLevelSpecificImpulse,
	);
}

function updateEngine() {
	formData.value.specificImpulse = formData.value.engine.ispVacuum;
	formData.value.seaLevelSpecificImpulse = formData.value.engine.ispSeaLevel;

	formData.value.exhaustVelocity = convertIspToVe(
		formData.value.specificImpulse,
	);
	formData.value.seaLevelVelocity = convertIspToVe(
		formData.value.seaLevelSpecificImpulse,
	);
}

function calcC3(deltaV: number) {
	const deltaVKM = deltaV / 1000;
	return round(
		Math.pow(deltaVKM - constants.c3Deceleration, 2) -
			Math.pow(constants.escVe, 2),
		1,
	);
}

function calcDeltaV(
	drymass: number,
	fuel: number,
	velocity: number,
	isSecondStage: boolean,
) {
	const initialMass = drymass + fuel;
	let finalMass = drymass;

	if (formData.value.reusable) {
		finalMass += fuel * 0.08;
	}

	if (!finalMass) return 0;

	let deltaV = velocity * Math.log(initialMass / finalMass);

	// TODO: This is a super rough estimate. Is there an actual calculation for this?
	if (isSecondStage && formData.value.refill) {
		deltaV *= 1.8;
	}

	return deltaV;
}

function convertIspToVe(isp: number) {
	return round(isp * constants.g, 0);
}

function round(num: number, digit: number) {
	const multiple = Math.pow(10, digit);
	return Math.round(num * multiple) / multiple;
}

/*
 *
 *
 *
 *
 *  DRAWING FUNCTIONS
 *
 *
 *
 *
 *
 * */
function setupCharts() {
	if (!GoogleCharts.api.visualization) return;

	deltaVChartHTML = new GoogleCharts.api.visualization.LineChart(
		document.getElementById('delta-v-chart'),
	);

	fuelChartHTML = new GoogleCharts.api.visualization.LineChart(
		document.getElementById('fuel-chart'),
	);

	c3ChartHTML = new GoogleCharts.api.visualization.LineChart(
		document.getElementById('c3-chart'),
	);

	drawCharts();
}

// @ts-ignore
let resizeTimeout: Timer = null;
function drawCharts() {
	if (resizeTimeout) clearTimeout(resizeTimeout);

	resizeTimeout = setTimeout(() => {
		switch (showResult.value) {
			case 'payload':
				drawPayloadChart();
				break;
			case 'fuel':
				drawFuelChart();
				break;
			case 'c3':
				drawC3Chart();
				break;
		}
	}, 500);
}

function drawPayloadChart() {
	if (!GoogleCharts.api.visualization) return;

	const dataTable = deltaVDataTable();

	const rows = getDeltaVRows();

	dataTable.addRows(rows);

	var options = getDeltaVChartOptions();

	deltaVChartHTML.draw(dataTable, options);
}

function drawFuelChart() {
	if (!GoogleCharts.api.visualization) return;

	const fuelRange = [
		formData.value.fuelMass - 500,
		formData.value.fuelMass - 400,
		formData.value.fuelMass - 300,
		formData.value.fuelMass - 200,
		formData.value.fuelMass - 100,
		formData.value.fuelMass,
		formData.value.fuelMass + 100,
		formData.value.fuelMass + 200,
		formData.value.fuelMass + 300,
		formData.value.fuelMass + 400,
		formData.value.fuelMass + 500,
	];

	const dataTable = deltaVDataTable();

	const rows = getFuelRows(fuelRange);

	dataTable.addRows(rows);

	const options = getFuelOptions(fuelRange);

	fuelChartHTML.draw(dataTable, options);
}

function drawC3Chart() {
	if (!GoogleCharts.api.visualization) return;

	const dataTable = c3DataTable();

	const rows = getC3Rows();

	dataTable.addRows(rows);

	const options = getC3Options();

	c3ChartHTML.draw(dataTable, options);
}

function buildC3Tooltip(
	title: string,
	payload: number | string,
	C3: number | null,
) {
	return (
		'<div style="padding:10px; white-space: nowrap;">' +
		'<strong style="font-size: 120%;">' +
		title +
		'</strong><br />' +
		'Payload: <strong>' +
		payload +
		' (mt)</strong><br />' +
		'C3: <strong>' +
		C3 +
		' (km²/s²)</strong></div>'
	);
}

function buildDeltaVTooltip(
	title: string,
	deltaV: number,
	type?: string,
	value?: number,
) {
	let tooltipString =
		'<div style="padding:10px; white-space: nowrap;">' +
		'<strong style="font-size: 120%;">' +
		title +
		'</strong><br />';

	if (type) {
		tooltipString += type + ': <strong>' + value + ' (mt)</strong><br />';
	}

	tooltipString += 'Delta V: <strong>' + deltaV + ' (m/s)</strong></div>';

	return tooltipString;
}

function calcPayloadRowC3(payload: number) {
	let deltaV = calcDeltaV(
		payload + formData.value.rocketMass,
		formData.value.fuelMass,
		formData.value.exhaustVelocity,
		true,
	);

	if (formData.value.twoStage) {
		const secondStageMass =
			formData.value.rocketMass + payload + formData.value.fuelMass; // c3Payload
		deltaV += calcDeltaV(
			secondStageMass + formData.value.firstStageMass,
			formData.value.firstStageFuel,
			formData.value.seaLevelVelocity,
			false,
		);
	}

	return calcC3(deltaV);
}

/*
 *
 *
 *
 *
 *  DATA FUNCTIONS
 *
 *
 *
 *
 * */
function getDeltaVRows() {
	let rows = [];

	const destinationRows = getDestinationRows();

	for (let i = 0; i < rockets.payloads.length; i++) {
		let payloadRowDeltaV = Math.floor(
			calcDeltaV(
				rockets.payloads[i] + formData.value.rocketMass,
				formData.value.fuelMass,
				formData.value.exhaustVelocity,
				true,
			),
		);

		if (formData.value.twoStage) {
			const secondStageMass =
				rockets.payloads[i] +
				formData.value.rocketMass +
				formData.value.fuelMass;
			payloadRowDeltaV += Math.floor(
				calcDeltaV(
					secondStageMass + formData.value.firstStageMass,
					formData.value.firstStageFuel,
					formData.value.seaLevelVelocity,
					false,
				),
			);
		}

		// TODO: Should we build a loop or a separate function to build these rows?
		let newRow = [
			rockets.payloads[i],
			payloadRowDeltaV,
			buildDeltaVTooltip(
				'Your Rocket',
				payloadRowDeltaV,
				'Payload',
				rockets.payloads[i],
			),
			...destinationRows,
		];

		rows.push(newRow);
	}

	// If you have more payload than 50 we need to extend the chart beyond what the sample rockets show
	if (formData.value.payloadMass > 50) {
		let payloadSteps = Math.ceil(formData.value.payloadMass / 10);
		if (payloadSteps > 20) payloadSteps = 20;

		let currentPayload = 60;
		for (let i = 0; i < payloadSteps; i++) {
			let payloadRowDeltaV = Math.floor(
				calcDeltaV(
					currentPayload + formData.value.rocketMass,
					formData.value.fuelMass,
					formData.value.exhaustVelocity,
					true,
				),
			);

			if (formData.value.twoStage) {
				const secondStageMass =
					currentPayload +
					formData.value.rocketMass +
					formData.value.fuelMass;
				payloadRowDeltaV += Math.floor(
					calcDeltaV(
						secondStageMass + formData.value.firstStageMass,
						formData.value.firstStageFuel,
						formData.value.seaLevelVelocity,
						false,
					),
				);
			}

			let newRow = [
				currentPayload,
				payloadRowDeltaV,
				buildDeltaVTooltip(
					'Your Rocket Payload',
					payloadRowDeltaV,
					'Payload',
					currentPayload,
				),
				...destinationRows,
			];

			rows.push(newRow);

			currentPayload += 10;
		}
	}

	return rows;
}

function getDeltaVChartOptions() {
	return {
		chartArea: {
			// leave room for y-axis labels
			width: '80%',
		},
		title: 'Payload and Delta V (ΔV)',
		curveType: 'function',
		//theme: "maximized",
		hAxis: {
			title: 'ΔV (m/s)',
		},
		vAxis: {
			title: 'Payload Mass (mt)',
			minValue: 0,
			maxValue: Math.max(30, formData.value.payloadMass + 10),
		},
		orientation: 'vertical', // show C3 at bottom and payload on right
		legend: { position: 'top', maxLines: 3 },
		tooltip: {
			isHtml: true,
		},
		series: {
			0: { color: '#c6582a' },
			1: { color: 'black', lineDashStyle: [10, 10] },
			2: { color: '#d1d1d1', lineDashStyle: [10, 10] },
			3: { color: '#bb4444', lineDashStyle: [10, 10] },
			4: { color: 'brown', lineDashStyle: [10, 10] },
			5: { color: 'GoldenRod', lineDashStyle: [10, 10] },
			6: { color: '#333333', lineDashStyle: [10, 10] },
			7: { color: '#A79C86', lineDashStyle: [10, 10] },
			8: { color: '#7B7869', lineDashStyle: [10, 10] },
			9: { color: 'gold', lineDashStyle: [10, 10] },
		},
	};
}

function deltaVDataTable() {
	if (!GoogleCharts.api.visualization) return;

	const dataTable = new GoogleCharts.api.visualization.DataTable();

	dataTable.addColumn('number', 'Delta V');
	dataTable.addColumn('number', 'Your Rocket');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'LEO');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Moon');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Mars (Aerobrake)');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Ceres');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Venus Orbit');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Mercury');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Jupiter');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Saturn');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Sun Escape');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});

	return dataTable;
}

function getFuelRows(fuelRange: number[]) {
	let rows = [];

	const destinationRows = getDestinationRows();

	for (let i = 0; i < fuelRange.length; i++) {
		let fuelRowDeltaV = Math.floor(
			calcDeltaV(
				formData.value.payloadMass + formData.value.rocketMass,
				fuelRange[i],
				formData.value.exhaustVelocity,
				true,
			),
		);

		// We only want to add fuel to our first or second stage
		if (formData.value.twoStage) {
			const secondStageMass =
				formData.value.payloadMass +
				formData.value.rocketMass +
				fuelRange[i];

			fuelRowDeltaV += Math.floor(
				calcDeltaV(
					secondStageMass + formData.value.firstStageMass,
					formData.value.firstStageFuel,
					formData.value.seaLevelVelocity,
					false,
				),
			);
		}

		// TODO: Should we build a loop or a separate function to build these rows?
		let newRow = [
			fuelRange[i],
			fuelRowDeltaV,
			buildDeltaVTooltip(
				'Your Rocket Fuel',
				fuelRowDeltaV,
				'Fuel',
				fuelRange[i],
			),
			...destinationRows,
		];

		rows.push(newRow);
	}

	return rows;
}

function getFuelOptions(fuelRange: number[]) {
	return {
		chartArea: {
			// leave room for y-axis labels
			width: '80%',
		},
		title: 'Fuel and Delta V (ΔV)',
		curveType: 'function',
		// theme: "material",
		hAxis: {
			title: 'ΔV (m/s)',
		},
		vAxis: {
			title: 'Fuel Mass (mt)',
			minValue: fuelRange[0],
			maxValue: fuelRange[fuelRange.length - 1],
		},
		orientation: 'vertical', // show C3 at bottom and payload on right
		legend: { position: 'top', maxLines: 3 },
		tooltip: {
			isHtml: true,
		},
		series: {
			0: { color: '#c6582a' },
			1: { color: 'black', lineDashStyle: [10, 10] },
			2: { color: '#d1d1d1', lineDashStyle: [10, 10] },
			3: { color: '#bb4444', lineDashStyle: [10, 10] },
			4: { color: 'brown', lineDashStyle: [10, 10] },
			5: { color: 'GoldenRod', lineDashStyle: [10, 10] },
			6: { color: '#333333', lineDashStyle: [10, 10] },
			7: { color: '#A79C86', lineDashStyle: [10, 10] },
			8: { color: '#7B7869', lineDashStyle: [10, 10] },
			9: { color: 'gold', lineDashStyle: [10, 10] },
		},
	};
}

function getDestinationRows() {
	return [
		destinations.value[0].deltaV, // LEO
		buildDeltaVTooltip(
			destinations.value[0].name,
			destinations.value[0].deltaV,
		),
		destinations.value[2].deltaV, // Moon
		buildDeltaVTooltip(
			destinations.value[2].name,
			destinations.value[2].deltaV,
		),
		destinations.value[3].deltaV, // Mars
		buildDeltaVTooltip(
			destinations.value[3].name,
			destinations.value[3].deltaV,
		),
		destinations.value[4].deltaV, // Ceres
		buildDeltaVTooltip(
			destinations.value[4].name,
			destinations.value[4].deltaV,
		),
		destinations.value[5].deltaV, // Venus
		buildDeltaVTooltip(
			destinations.value[5].name,
			destinations.value[5].deltaV,
		),
		destinations.value[6].deltaV, // Mercury
		buildDeltaVTooltip(
			destinations.value[6].name,
			destinations.value[6].deltaV,
		),
		destinations.value[7].deltaV, // Jupiter
		buildDeltaVTooltip(
			destinations.value[7].name,
			destinations.value[7].deltaV,
		),
		destinations.value[8].deltaV, // Saturn
		buildDeltaVTooltip(
			destinations.value[8].name,
			destinations.value[8].deltaV,
		),
		destinations.value[9].deltaV, // Sun
		buildDeltaVTooltip(
			destinations.value[9].name,
			destinations.value[9].deltaV,
		),
	];
}

function getC3Rows() {
	let rows = [];

	const planetC3s = [
		-0.6,
		buildC3Tooltip('Moon', '-', -0.6),
		15,
		buildC3Tooltip('Mars', '-', 15),
		83,
		buildC3Tooltip('Jupiter', '-', 83),
		139,
		buildC3Tooltip('Saturn Direct', '-', 139),
	];

	// Row 0. Added for debugging. Can be removed if not needed.
	const payloadZeroC3 = calcPayloadRowC3(0);
	let newRow = [
		0,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		payloadZeroC3,
		buildC3Tooltip('Your Rocket', 0, payloadZeroC3),
	].concat(planetC3s);

	rows.push(newRow);

	for (let i = 0; i < rockets.payloads.length; i++) {
		const payloadRowC3 = calcPayloadRowC3(rockets.payloads[i]);

		let newRow = [
			rockets.payloads[i],
			rockets.falconHeavyEx[i],
			buildC3Tooltip(
				'Falcon Heavy (Expendable)',
				rockets.payloads[i],
				rockets.falconHeavyEx[i],
			),
			rockets.falconHeavyRecovery[i],
			buildC3Tooltip(
				'Falcon Heavy (Recoverable)',
				rockets.payloads[i],
				rockets.falconHeavyRecovery[i],
			),
			rockets.newGlenn[i],
			buildC3Tooltip(
				'New Glenn',
				rockets.payloads[i],
				rockets.newGlenn[i],
			),
			rockets.slsBlockOne[i],
			buildC3Tooltip(
				'SLS Block 1',
				rockets.payloads[i],
				rockets.slsBlockOne[i],
			),
			rockets.slsBlockTwo[i],
			buildC3Tooltip(
				'SLS Block 2',
				rockets.payloads[i],
				rockets.slsBlockTwo[i],
			),
			payloadRowC3,
			buildC3Tooltip('Your Rocket', rockets.payloads[i], payloadRowC3),
		].concat(planetC3s);

		rows.push(newRow);
	}

	// If you have more payload than 50 we need to extend the chart beyond what the sample rockets show
	if (formData.value.payloadMass > 50) {
		let payloadSteps = Math.ceil(formData.value.payloadMass / 10);
		if (payloadSteps > 20) payloadSteps = 20;

		let currentPayload = 60;
		for (let i = 0; i < payloadSteps; i++) {
			const payloadRowC3 = calcPayloadRowC3(currentPayload);

			let newRow = [
				currentPayload,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				payloadRowC3,
				buildC3Tooltip('Your Rocket', currentPayload, payloadRowC3),
			].concat(planetC3s);

			rows.push(newRow);

			currentPayload += 10;
		}
	}

	return rows;
}

function c3DataTable() {
	if (!GoogleCharts.api.visualization) return;

	const dataTable = new GoogleCharts.api.visualization.DataTable();

	dataTable.addColumn('number', 'C3');
	dataTable.addColumn('number', 'Falcon Heavy (Expendable)');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Falcon Heavy (Recoverable)');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'New Glenn');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'SLS Block 1');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'SLS Block 2');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Your Rocket');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Moon');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Mars');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Jupiter');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});
	dataTable.addColumn('number', 'Saturn Direct');
	dataTable.addColumn({
		type: 'string',
		role: 'tooltip',
		p: { html: true },
	});

	return dataTable;
}

function getC3Options() {
	return {
		chartArea: {
			// leave room for y-axis labels
			width: '80%',
		},
		title: 'Characteristic Energy (C3)',
		curveType: 'function',
		// theme: "material",
		hAxis: {
			title: 'Launch Energy / C3 (km²/s²)',
		},
		vAxis: {
			title: 'Payload Mass (mt)',
			minValue: 0,
			maxValue: Math.max(30, formData.value.payloadMass + 10),
		},
		orientation: 'vertical', // show C3 at bottom and payload on right
		legend: { position: 'top', maxLines: 3 },
		tooltip: {
			isHtml: true,
		},
		series: {
			0: { color: 'blue' },
			1: { color: 'purple' },
			2: { color: 'pink' },
			3: { color: 'green' },
			4: { color: 'black' },
			5: { color: '#c6582a', lineDashStyle: [10, 2] },
			6: { color: '#cccccc', lineDashStyle: [10, 10] },
			7: { color: '#bb4444', lineDashStyle: [10, 10] },
			8: { color: '#A79C86', lineDashStyle: [10, 10] },
			9: { color: '#7B7869', lineDashStyle: [10, 10] },
		},
	};
}
</script>

<style></style>
