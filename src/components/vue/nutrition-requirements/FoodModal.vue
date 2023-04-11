<template>
  <BaseModal :title="food.name" @close="emit('close')">
    <!-- <div class="food__info">
      <table class="table table-striped">
        <tbody>
          <tr class="food__nutrients" v-for="nutrient in orderedNutrients">
            <th>{{ nutrient.nutrientName }}</th>
            <td>
              {{ nutrient.value.toLocaleString()
              }}{{ nutrient.unitName.toLowerCase() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div> -->
    <div class="performance-facts">
      <header class="performance-facts__header">
        <h1 class="performance-facts__title">Nutrition Facts</h1>
        <!-- <p>Serving Size 1/2 cup (about 82g)
            <p>Serving Per Container 8</p> -->
      </header>
      <table class="performance-facts__table">
        <tbody>
          <tr>
            <th>
              <b>Calories</b>
              {{ formatNumber(nutrition.calories.total) }} kcal
            </th>
            <td>
              <!-- Calories from Fat {{ nutrition.fat.calories }} -->
              <b>{{ formatNumber(nutrition.calories.percent) }}%</b>
            </td>
          </tr>
          <tr class="thick-row">
            <td colspan="2" class="small-info">
              <b>% Value*</b>
            </td>
          </tr>
          <tr>
            <th><b>Total Fat</b> {{ formatNumber(nutrition.fat.total) }}g</th>
            <td>
              <b>{{ formatNumber(nutrition.fat.percent) }}%</b>
            </td>
          </tr>
          <tr>
            <th class="ps-3">
              Saturated Fat {{ formatNumber(nutrition.fat.saturated) }}g
            </th>
            <td>
              <b>{{ formatNumber(nutrition.fat.saturatedPercent) }}%</b>
            </td>
          </tr>
          <tr>
            <th class="ps-3">
              Trans Fat {{ formatNumber(nutrition.fat.trans) }}g
            </th>
            <td></td>
          </tr>
          <tr>
            <th>
              <b>Cholesterol</b>
              {{ formatNumber(nutrition.cholesterol.total) }}mg
            </th>
            <td>
              <b>{{ formatNumber(nutrition.cholesterol.percent) }}%</b>
            </td>
          </tr>
          <tr>
            <th><b>Sodium</b> {{ formatNumber(nutrition.sodium.total) }}mg</th>
            <td>
              <b>{{ formatNumber(nutrition.sodium.percent) }}%</b>
            </td>
          </tr>
          <tr>
            <th>
              <b>Total Carbohydrate</b>
              {{ formatNumber(nutrition.carbs.total) }}g
            </th>
            <td>
              <b>{{ formatNumber(nutrition.carbs.percent) }}%</b>
            </td>
          </tr>
          <tr>
            <th class="ps-3">
              Dietary Fiber {{ formatNumber(nutrition.fiber.total) }}g
            </th>
            <td>
              <b>{{ formatNumber(nutrition.fiber.percent) }}%</b>
            </td>
          </tr>
          <tr>
            <th class="ps-3">
              Sugars {{ formatNumber(nutrition.sugar.total) }}g
            </th>
            <td>
              <b>{{ formatNumber(nutrition.sugar.percent) }}%</b>
            </td>
          </tr>
          <tr class="thick-end">
            <th><b>Protein</b> {{ formatNumber(nutrition.protein.total) }}g</th>
            <td>
              <b>{{ formatNumber(nutrition.protein.percent) }}%</b>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="nutrientTotals.length">
        <div
          v-for="(nutrient, nutrientId) in nutrientTotals"
          :key="nutrientId"
          class="thin-end py-1 d-flex justify-content-between"
        >
          {{ nutrient.name }}
          <b
            >{{ formatNumber(nutrient.total)
            }}{{ nutrient.unit.toLowerCase() }}</b
          >
        </div>
      </div>

      <br />

      <p class="small-info">Calories per gram:</p>
      <p class="small-info text-center">
        Fat 9 &bull; Carbohydrate 4 &bull; Protein 4
      </p>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
// TODO: This is a hijacked bootstrap modal. Might be nice to use something more custom.
import { computed } from "vue";
import type { Food } from "./types";

import {
  calculateFoodNutrition,
  calculateNutritionTotals,
} from "./nutrition-util";
import { formatNumber } from "../utils";

import BaseModal from "../shared/BaseModal.vue";

const props = defineProps<{
  food: Food;
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const nutrition = calculateFoodNutrition(props.food);
const nutrientTotals = calculateNutritionTotals(props.food);
</script>

<style></style>
