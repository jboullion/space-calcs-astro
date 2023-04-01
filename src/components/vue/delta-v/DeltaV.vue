<template>
  <div id="delta-v__form" class="col-lg-4">
    <div class="calc-form mb-5">
      <number-input
        id="payload-mass"
        label="Payload Mass"
        v-model="formData.payloadMass"
        unit="mt"
      />

      <number-input
        id="rocket-mass"
        :label="formData.twoStage ? 'Second Stage ' : '' + 'Rocket Mass'"
        v-model="formData.rocketMass"
        unit="mt"
        tooltip="Rocket mass is the mass of the rocket without fuel or payload."
      />

      <number-input
        id="fuel-mass"
        :label="formData.twoStage ? 'Second Stage ' : '' + 'Fuel Mass'"
        v-model="formData.fuelMass"
        unit="mt"
      />

      <number-input
        id="specific-impulse"
        :label="
          formData.twoStage
            ? 'Second Stage '
            : '' + 'Specific Impulse (I<sub>sp</sub>)'
        "
        v-model="formData.specificImpulse"
        unit="s"
        :change-fn="calcExhaustVelocity"
        tooltip="How efficiently an engine creates thrust. Directly related to exhaust velocity."
        :description="
          addCommas(formData.exhaustVelocity) +
          ' m/s Exhaust Velocity (V<sub>e</sub>)'
        "
      />
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

import { onBeforeMount, ref, onMounted, computed } from "vue";
import {
  constants,
  formData,
  rockets,
  destinations,
  defaultEngines,
  formResults,
} from "./constants";
import NumberInput from "../forms/NumberInput.vue";

// @ts-ignore
import { GoogleCharts } from "google-charts";

const updating = ref(false);

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
function onBeforeMount() {
  // Default selected options
  formData.value.engine = defaultEngines[1];

  // calcExhaustVelocity();
  GoogleCharts.charts.load("current", { packages: ["line", "corechart"] });
  GoogleCharts.charts.setOnLoadCallback(drawCharts);
}

function onMounted() {
  window.addEventListener("resize", drawCharts, { passive: true });
}

function onBeforeUnmount() {
  window.removeEventListener("resize", drawCharts);
}

function addCommas(value: number) {
  return value.toLocaleString();
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
      ((deltaV / destination.deltaV) * 100).toFixed(1)
    );
  });

  //const deltaVKM = deltaV / 1000;
  //if (deltaVKM > constants.escVe / 2) {
  formResults.value.C3 = calcC3(deltaV);
  //}

  // $nextTick(() => {
  //   drawCharts();
  // });

  return round(deltaV, 2);
});

const firstStageDeltaV = computed(() => {
  const deltaV = calcDeltaV(
    secondStageMass.value + formData.value.firstStageMass,
    formData.value.firstStageFuel,
    formData.value.seaLevelVelocity,
    false
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
    true
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
function calcIsp(seaLevel = false) {
  if (seaLevel) {
    formData.value.seaLevelSpecificImpulse = round(
      formData.value.seaLevelVelocity / constants.g,
      3
    );
  } else {
    formData.value.specificImpulse = round(
      formData.value.exhaustVelocity / constants.g,
      3
    );
  }
}

function calcExhaustVelocity() {
  formData.value.exhaustVelocity = convertIspToVe(
    formData.value.specificImpulse
  );
  formData.value.seaLevelVelocity = convertIspToVe(
    formData.value.seaLevelSpecificImpulse
  );
}

function updateEngine() {
  formData.value.specificImpulse = formData.value.engine.ispVacuum;
  formData.value.seaLevelSpecificImpulse = formData.value.engine.ispSeaLevel;

  formData.value.exhaustVelocity = convertIspToVe(
    formData.value.specificImpulse
  );
  formData.value.seaLevelVelocity = convertIspToVe(
    formData.value.seaLevelSpecificImpulse
  );
}

function calcC3(deltaV: number) {
  const deltaVKM = deltaV / 1000;
  return round(
    Math.pow(deltaVKM - constants.c3Deceleration, 2) -
      Math.pow(constants.escVe, 2),
    1
  );
}

function calcDeltaV(
  drymass: number,
  fuel: number,
  velocity: number,
  isSecondStage: boolean
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
 *
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
 *
 *
 *
 *
 *
 * */

function drawCharts() {
  drawC3Chart();
  drawFuelChart();
  drawDeltaVChart();
}

function drawDeltaVChart() {
  if (!GoogleCharts.visualization) return;

  const dataTable = deltaVDataTable();

  let rows = [];

  const destinationRows = getDestinationRows();

  for (let i = 0; i < rockets.payloads.length; i++) {
    let payloadRowDeltaV = Math.floor(
      calcDeltaV(
        rockets.payloads[i] + formData.value.rocketMass,
        formData.value.fuelMass,
        formData.value.exhaustVelocity,
        true
      )
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
          false
        )
      );
    }

    // TODO: Should we build a loop or a separate function to build these rows?
    let newRow = [
      rockets.payloads[i],
      payloadRowDeltaV,
      buildDeltaVTooltip(
        "Your Rocket",
        payloadRowDeltaV,
        "Payload",
        rockets.payloads[i]
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
          true
        )
      );

      if (formData.value.twoStage) {
        const secondStageMass =
          currentPayload + formData.value.rocketMass + formData.value.fuelMass;
        payloadRowDeltaV += Math.floor(
          calcDeltaV(
            secondStageMass + formData.value.firstStageMass,
            formData.value.firstStageFuel,
            formData.value.seaLevelVelocity,
            false
          )
        );
      }

      let newRow = [
        currentPayload,
        payloadRowDeltaV,
        buildDeltaVTooltip(
          "Your Rocket Payload",
          payloadRowDeltaV,
          "Payload",
          currentPayload
        ),
        ...destinationRows,
      ];

      rows.push(newRow);

      currentPayload += 10;
    }
  }

  dataTable.addRows(rows);

  const options = {
    chartArea: {
      // leave room for y-axis labels
      width: "80%",
    },
    title: "Payload and Delta V (ΔV)",
    curveType: "function",
    theme: "material",
    hAxis: {
      title: "ΔV (m/s)",
    },
    vAxis: {
      title: "Payload Mass (mt)",
      minValue: 0,
      maxValue: Math.max(30, formData.value.payloadMass + 10),
    },
    orientation: "vertical", // show C3 at bottom and payload on right
    legend: { position: "top", maxLines: 3 },
    tooltip: {
      isHtml: true,
    },
    series: {
      0: { color: "#c6582a" },
      1: { color: "black", lineDashStyle: [10, 10] },
      2: { color: "#d1d1d1", lineDashStyle: [10, 10] },
      3: { color: "#bb4444", lineDashStyle: [10, 10] },
      4: { color: "brown", lineDashStyle: [10, 10] },
      5: { color: "GoldenRod", lineDashStyle: [10, 10] },
      6: { color: "#333333", lineDashStyle: [10, 10] },
      7: { color: "#A79C86", lineDashStyle: [10, 10] },
      8: { color: "#7B7869", lineDashStyle: [10, 10] },
      9: { color: "gold", lineDashStyle: [10, 10] },
    },
  };

  const chart = new GoogleCharts.visualization.LineChart(
    document.getElementById("delta-v-chart")
  );

  chart.draw(dataTable, options);
}

function drawFuelChart() {
  if (!GoogleCharts.visualization) return;

  const dataTable = deltaVDataTable();

  let rows = [];
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

  const destinationRows = getDestinationRows();

  for (let i = 0; i < fuelRange.length; i++) {
    let fuelRowDeltaV = Math.floor(
      calcDeltaV(
        formData.value.payloadMass + formData.value.rocketMass,
        fuelRange[i],
        formData.value.exhaustVelocity,
        true
      )
    );

    // We only want to add fuel to our first or second stage
    if (formData.value.twoStage) {
      const secondStageMass =
        formData.value.payloadMass + formData.value.rocketMass + fuelRange[i];

      fuelRowDeltaV += Math.floor(
        calcDeltaV(
          secondStageMass + formData.value.firstStageMass,
          formData.value.firstStageFuel,
          formData.value.seaLevelVelocity,
          false
        )
      );
    }

    // TODO: Should we build a loop or a separate function to build these rows?
    let newRow = [
      fuelRange[i],
      fuelRowDeltaV,
      buildDeltaVTooltip(
        "Your Rocket Fuel",
        fuelRowDeltaV,
        "Fuel",
        fuelRange[i]
      ),
      ...destinationRows,
    ];

    rows.push(newRow);
  }

  dataTable.addRows(rows);

  const options = {
    chartArea: {
      // leave room for y-axis labels
      width: "80%",
    },
    title: "Fuel and Delta V (ΔV)",
    curveType: "function",
    theme: "material",
    hAxis: {
      title: "ΔV (m/s)",
    },
    vAxis: {
      title: "Fuel Mass (mt)",
      minValue: fuelRange[0],
      maxValue: fuelRange[fuelRange.length - 1],
    },
    orientation: "vertical", // show C3 at bottom and payload on right
    legend: { position: "top", maxLines: 3 },
    tooltip: {
      isHtml: true,
    },
    series: {
      0: { color: "#c6582a" },
      1: { color: "black", lineDashStyle: [10, 10] },
      2: { color: "#d1d1d1", lineDashStyle: [10, 10] },
      3: { color: "#bb4444", lineDashStyle: [10, 10] },
      4: { color: "brown", lineDashStyle: [10, 10] },
      5: { color: "GoldenRod", lineDashStyle: [10, 10] },
      6: { color: "#333333", lineDashStyle: [10, 10] },
      7: { color: "#A79C86", lineDashStyle: [10, 10] },
      8: { color: "#7B7869", lineDashStyle: [10, 10] },
      9: { color: "gold", lineDashStyle: [10, 10] },
    },
  };

  const chart = new GoogleCharts.visualization.LineChart(
    document.getElementById("fuel-chart")
  );

  chart.draw(dataTable, options);
}

function drawC3Chart() {
  if (!GoogleCharts.visualization) return;

  const dataTable = new GoogleCharts.visualization.DataTable();

  dataTable.addColumn("number", "C3");
  dataTable.addColumn("number", "Falcon Heavy (Expendable)");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Falcon Heavy (Recoverable)");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "New Glenn");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "SLS Block 1");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "SLS Block 2");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Your Rocket");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Moon");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Mars");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Jupiter");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Saturn Direct");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });

  const planetC3s = [
    -0.6,
    buildC3Tooltip("Moon", "-", -0.6),
    15,
    buildC3Tooltip("Mars", "-", 15),
    83,
    buildC3Tooltip("Jupiter", "-", 83),
    139,
    buildC3Tooltip("Saturn Direct", "-", 139),
  ];

  let rows = [];

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
    buildC3Tooltip("Your Rocket", 0, payloadZeroC3),
  ].concat(planetC3s);

  rows.push(newRow);

  for (let i = 0; i < rockets.payloads.length; i++) {
    const payloadRowC3 = calcPayloadRowC3(rockets.payloads[i]);

    let newRow = [
      rockets.payloads[i],
      rockets.falconHeavyEx[i],
      buildC3Tooltip(
        "Falcon Heavy (Expendable)",
        rockets.payloads[i],
        rockets.falconHeavyEx[i]
      ),
      rockets.falconHeavyRecovery[i],
      buildC3Tooltip(
        "Falcon Heavy (Recoverable)",
        rockets.payloads[i],
        rockets.falconHeavyRecovery[i]
      ),
      rockets.newGlenn[i],
      buildC3Tooltip("New Glenn", rockets.payloads[i], rockets.newGlenn[i]),
      rockets.slsBlockOne[i],
      buildC3Tooltip(
        "SLS Block 1",
        rockets.payloads[i],
        rockets.slsBlockOne[i]
      ),
      rockets.slsBlockTwo[i],
      buildC3Tooltip(
        "SLS Block 2",
        rockets.payloads[i],
        rockets.slsBlockTwo[i]
      ),
      payloadRowC3,
      buildC3Tooltip("Your Rocket", rockets.payloads[i], payloadRowC3),
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
        buildC3Tooltip("Your Rocket", currentPayload, payloadRowC3),
      ].concat(planetC3s);

      rows.push(newRow);

      currentPayload += 10;
    }
  }

  dataTable.addRows(rows);

  const options = {
    chartArea: {
      // leave room for y-axis labels
      width: "80%",
    },
    title: "Characteristic Energy (C3)",
    curveType: "function",
    theme: "material",
    hAxis: {
      title: "Launch Energy / C3 (km²/s²)",
    },
    vAxis: {
      title: "Payload Mass (mt)",
      minValue: 0,
      maxValue: Math.max(30, formData.value.payloadMass + 10),
    },
    orientation: "vertical", // show C3 at bottom and payload on right
    legend: { position: "top", maxLines: 3 },
    tooltip: {
      isHtml: true,
    },
    series: {
      0: { color: "blue" },
      1: { color: "purple" },
      2: { color: "pink" },
      3: { color: "green" },
      4: { color: "black" },
      5: { color: "#c6582a", lineDashStyle: [10, 2] },
      6: { color: "#cccccc", lineDashStyle: [10, 10] },
      7: { color: "#bb4444", lineDashStyle: [10, 10] },
      8: { color: "#A79C86", lineDashStyle: [10, 10] },
      9: { color: "#7B7869", lineDashStyle: [10, 10] },
    },
  };

  const chart = new GoogleCharts.visualization.LineChart(
    document.getElementById("c3-chart")
  );

  chart.draw(dataTable, options);
}

function buildC3Tooltip(
  title: string,
  payload: number | string,
  C3: number | null
) {
  return (
    '<div style="padding:10px; white-space: nowrap;">' +
    '<strong style="font-size: 120%;">' +
    title +
    "</strong><br />" +
    "Payload: <strong>" +
    payload +
    " (mt)</strong><br />" +
    "C3: <strong>" +
    C3 +
    " (km²/s²)</strong></div>"
  );
}

function buildDeltaVTooltip(
  title: string,
  deltaV: number,
  type?: string,
  value?: number
) {
  let tooltipString =
    '<div style="padding:10px; white-space: nowrap;">' +
    '<strong style="font-size: 120%;">' +
    title +
    "</strong><br />";

  if (type) {
    tooltipString += type + ": <strong>" + value + " (mt)</strong><br />";
  }

  tooltipString += "Delta V: <strong>" + deltaV + " (m/s)</strong></div>";

  return tooltipString;
}

function calcPayloadRowC3(payload: number) {
  let deltaV = calcDeltaV(
    payload + formData.value.rocketMass,
    formData.value.fuelMass,
    formData.value.exhaustVelocity,
    true
  );

  if (formData.value.twoStage) {
    const secondStageMass =
      formData.value.rocketMass + payload + formData.value.fuelMass; // c3Payload
    deltaV += calcDeltaV(
      secondStageMass + formData.value.firstStageMass,
      formData.value.firstStageFuel,
      formData.value.seaLevelVelocity,
      false
    );
  }

  return calcC3(deltaV);
}

/*
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *  DATA FUNCTIONS
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * */
function deltaVDataTable() {
  const dataTable = new GoogleCharts.visualization.DataTable();

  dataTable.addColumn("number", "Delta V");
  dataTable.addColumn("number", "Your Rocket");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "LEO");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Moon");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Mars (Aerobrake)");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Ceres");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Venus Orbit");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Mercury");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Jupiter");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Saturn");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  dataTable.addColumn("number", "Sun Escape");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });
  return dataTable;
}

function getDestinationRows() {
  return [
    destinations.value[0].deltaV,
    buildDeltaVTooltip(
      destinations.value[0].name,
      destinations.value[0].deltaV
    ),
    destinations.value[2].deltaV,
    buildDeltaVTooltip(
      destinations.value[2].name,
      destinations.value[2].deltaV
    ),
    destinations.value[3].deltaV,
    buildDeltaVTooltip(
      destinations.value[3].name,
      destinations.value[3].deltaV
    ),
    destinations.value[4].deltaV,
    buildDeltaVTooltip(
      destinations.value[4].name,
      destinations.value[4].deltaV
    ),
    destinations.value[5].deltaV,
    buildDeltaVTooltip(
      destinations.value[5].name,
      destinations.value[5].deltaV
    ),
    destinations.value[6].deltaV,
    buildDeltaVTooltip(
      destinations.value[6].name,
      destinations.value[6].deltaV
    ),
    destinations.value[7].deltaV,
    buildDeltaVTooltip(
      destinations.value[7].name,
      destinations.value[7].deltaV
    ),
    destinations.value[8].deltaV,
    buildDeltaVTooltip(
      destinations.value[8].name,
      destinations.value[8].deltaV
    ),
    destinations.value[9].deltaV,
    buildDeltaVTooltip(
      destinations.value[9].name,
      destinations.value[9].deltaV
    ),
    destinations.value[10].deltaV,
    buildDeltaVTooltip(
      destinations.value[10].name,
      destinations.value[10].deltaV
    ),
  ];
}

/*

  watch: {
    "formData.showC3": {
      handler(newShowC3) {
        $nextTick(() => {
          drawC3Chart();
        });
      },
    },
    "formData.twoStage": {
      handler(newTwoStage) {
        if (!newTwoStage) formData.value.refill = false;
      },
    },
    // formData: {
    //   handler(newVal){
    //     // Updating scene here to only update onces per watch.
    //     if(needsUpdate){
    //       setupScene();
    //     }
    //   },
    //   deep: true
    // }
  },
});
*/
</script>
<style></style>
