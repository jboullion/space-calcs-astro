<template>
  <div id="delta-v__results" class="col-lg-8 calc-form">
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
import { ref } from "vue";
type ResultTabs = "efficiency";

const showResult = ref<ResultTabs>("efficiency");
</script>
