<template>
  <div id="solar-energy__results" class="col-lg-8 calc-form">
    <div class="p-2 rounded border">
      <table class="table mb-0">
        <tbody>
          <tr class="" title="L = L☉ * (R / R☉)² * (T / T☉)⁴">
            <th>Star Luminosity</th>
            <td class="text-end">{{ luminosity.toExponential(4) }} W</td>
          </tr>
          <tr class="" title="A = 4𝝅R²">
            <th>Orbit Sphere Size</th>
            <td class="text-end">{{ orbitSphereSize.toExponential(4) }} m²</td>
          </tr>
          <tr class="" title="E1 = L / A">
            <th>Energy Reaching Planet (Insolation)</th>
            <td class="text-end">{{ formatNumber(planetInsolation) }} W/m²</td>
          </tr>
          <tr class="" title="E2 = E1 * (100 - Atm%)">
            <th>Available Energy at Surface</th>
            <td class="text-end">
              {{ formatNumber(availableEnergyOnSurface) }} W/m²
            </td>
          </tr>
          <tr class="border-0" title="P = E2 * Eff%">
            <th class="border-0">Solar Panel Potential</th>
            <td class="text-end border-0">
              {{ formatNumber(solarPanelPotential) }} W/m²
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="result-chart my-4">
      <!-- <div
        id="efficiency-chart"
        v-show="showResult == 'efficiency'"
        style="width: 100%; height: 400px"
      ></div> -->
      <!-- <div
        id="fuel-chart"
        v-show="showResult == 'fuel'"
        style="width: 100%; height: 400px"
      ></div>
      <div
        id="c3-chart"
        v-show="showResult == 'c3'"
        style="width: 100%; height: 400px"
      ></div> -->
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  computed,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";

// @ts-ignore
import { GoogleCharts } from "google-charts";
import { rockets } from "../delta-v/constants";
import type { SolarEnergyForm } from "./constants";
import { physicsConstants, formatNumber } from "../utils";

type ResultTabs = "efficiency";

const showResult = ref<ResultTabs>("efficiency");

let efficiencyChartHTML: GoogleCharts.api.visualization.LineChart;
// let fuelChartHTML: GoogleCharts.api.visualization.LineChart;
// let c3ChartHTML: GoogleCharts.api.visualization.LineChart;

const props = defineProps<{
  formData: SolarEnergyForm;
}>();

/**
 *
 *
 * SETUP
 *
 *
 */
onBeforeMount(() => {
  // GoogleCharts.load("52", {
  //   packages: ["line", "corechart"],
  // }).then(setupCharts);
});

onMounted(() => {
  //window.addEventListener("resize", drawCharts, { passive: true });
});

onBeforeUnmount(() => {
  //window.removeEventListener("resize", drawCharts);
});

/**
 *
 *
 * COMPUTED
 *
 *
 */

// const starTemperature = computed(() => {
//   return props.formData.starTemperature ** 4;
// });

const luminosity = computed(() => {
  // L = L☉ * (R / R☉)² * (T / T☉)⁴
  return (
    physicsConstants.sunLuminosity *
    ((props.formData.starRadius * physicsConstants.sunRadius) /
      physicsConstants.sunRadius) **
      2 *
    (props.formData.starTemperature / physicsConstants.sunTemp) ** 4
  );

  // alternative L = σ * A * T⁴
  // return (
  //   physicsConstants.stefanBoltzmann * starArea.value * starTemperature.value
  // );
});

const orbitSphereSize = computed(() => {
  return (
    4 * Math.PI * (props.formData.planetOrbit * physicsConstants.AU * 1000) ** 2
  );
});

const planetInsolation = computed(() => {
  return luminosity.value / orbitSphereSize.value;
});

const availableEnergyOnSurface = computed(() => {
  return (
    planetInsolation.value * ((100 - props.formData.atmosphereAbsorption) / 100)
  );
});

const solarPanelPotential = computed(() => {
  const solarPotential =
    availableEnergyOnSurface.value *
    (props.formData.solarPanelEfficiency / 100);

  if (GoogleCharts.api?.visualization) {
    nextTick(drawCharts);
  }

  return solarPotential;
});

function showResultChart(chart: ResultTabs) {
  showResult.value = chart;

  if (GoogleCharts.api?.visualization) {
    nextTick(drawCharts);
  }
}

/*
 *
 *
 *  DRAWING FUNCTIONS
 *
 *
 * */
function setupCharts() {
  if (!GoogleCharts.api.visualization) return;

  efficiencyChartHTML = new GoogleCharts.api.visualization.LineChart(
    document.getElementById("efficiency-chart")
  );

  drawCharts();
}

function drawCharts() {
  // TODO: Deprecated until we have a better chart to show
  return;

  switch (showResult.value) {
    case "efficiency":
      drawEfficiencyChart();
      break;
    // case "fuel":
    //   drawFuelChart();
    //   break;
    // case "c3":
    //   drawC3Chart();
    //   break;
  }
}

function drawEfficiencyChart() {
  if (!GoogleCharts.api.visualization) return;

  const dataTable = new GoogleCharts.api.visualization.DataTable();

  dataTable.addColumn("number", "Power");
  dataTable.addColumn("number", "Potential Energy");
  dataTable.addColumn({
    type: "string",
    role: "tooltip",
    p: { html: true },
  });

  const solarPotentialRows: [number, number, string][] = [];

  for (let i = 0; i <= 100; i += 10) {
    const power = availableEnergyOnSurface.value * (i / 100);
    solarPotentialRows.push([power, i, buildEfficiencyTooltip(power, i)]);
  }

  dataTable.addRows(solarPotentialRows);

  var options = getEfficiencyChartOptions();

  efficiencyChartHTML.draw(dataTable, options);
}

function buildEfficiencyTooltip(power: number, efficiency: number) {
  let tooltipString = '<div style="padding:10px; white-space: nowrap;">';

  tooltipString +=
    "Potential Energy: <strong>" + power.toFixed(2) + " (W/m²)</strong><br />";

  tooltipString += "Efficiency: <strong>" + efficiency + "%</strong></div>";

  return tooltipString;
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
function getEfficiencyChartOptions() {
  return {
    chartArea: {
      // leave room for y-axis labels
      width: "80%",
    },
    title: "Solar Power Potential",
    curveType: "function",
    //theme: "maximized",
    hAxis: {
      title: "Efficiency",
    },
    vAxis: {
      title: "Energy",
      minValue: 0,
      maxValue: 100,
    },
    orientation: "vertical", // show C3 at bottom and payload on right
    legend: { position: "top", maxLines: 3 },
    tooltip: {
      isHtml: true,
    },
    series: {
      0: { color: "#c6582a" },
      // 1: { color: "black" },
      // 2: { color: "#d1d1d1", lineDashStyle: [10, 10] },
    },
  };
}
</script>
