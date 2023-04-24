<template>
  <div id="solar-energy__results" class="col-lg-8 calc-form">
    <!-- <table class="table table-striped">
      <tbody>
        <tr v-if="formData.twoStage" class="">
          <th>First Stage ΔV</th>
          <td class="text-end">{{ addCommas(firstStageDeltaV) }} m/s</td>
        </tr>
        <tr v-if="formData.twoStage" class="">
          <th>Second Stage ΔV</th>
          <td class="text-end">{{ addCommas(secondStageDeltaV) }} m/s</td>
        </tr>
        <tr class="table-success">
          <th>Total ΔV</th>
          <td class="text-end">{{ addCommas(totalDeltaV) }} m/s</td>
        </tr>
      </tbody>
    </table> -->

    <!-- <div class="btn-group w-100" role="group" aria-label="Basic example">
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
    </div> -->

    <div class="result-chart my-4">
      <div
        id="efficiency-chart"
        v-show="showResult == 'efficiency'"
        style="width: 100%; height: 400px"
      ></div>
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
import { nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue";

// @ts-ignore
import { GoogleCharts } from "google-charts";
import { rockets } from "../delta-v/constants";

type ResultTabs = "efficiency";

const showResult = ref<ResultTabs>("efficiency");

let efficiencyChartHTML: GoogleCharts.api.visualization.LineChart;
// let fuelChartHTML: GoogleCharts.api.visualization.LineChart;
// let c3ChartHTML: GoogleCharts.api.visualization.LineChart;

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
  GoogleCharts.load("52", {
    packages: ["line", "corechart"],
  }).then(setupCharts);
});

onMounted(() => {
  //window.addEventListener("resize", drawCharts, { passive: true });
});

onBeforeUnmount(() => {
  //window.removeEventListener("resize", drawCharts);
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

  efficiencyChartHTML = new GoogleCharts.api.visualization.LineChart(
    document.getElementById("efficiency-chart")
  );

  drawCharts();
}

function drawCharts() {
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

  var data = GoogleCharts.api.visualization.arrayToDataTable([
    ["Power", "Potential Energy"],
    [0, 0],
    [25, 25],
    [50, 50],
    [75, 75],
    [100, 100],
  ]);

  var options = getEfficiencyChartOptions();

  efficiencyChartHTML.draw(data, options);
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
    title: "Solar Power Efficiency",
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
    // tooltip: {
    //   isHtml: true,
    // },
    series: {
      0: { color: "#c6582a" },
      // 1: { color: "black" },
      // 2: { color: "#d1d1d1", lineDashStyle: [10, 10] },
    },
  };
}
</script>
