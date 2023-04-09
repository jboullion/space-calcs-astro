<template>
  <div id="nutrition__app" class="row mt-5" v-cloak>
    <div id="nutrition__form" class="col-lg-8 col-xl-7 mb-5">
      <div class="calc-form mb-5">
        <div class="row">
          <div class="col-lg-4 mb-3">
            <TextInput
              id="duration"
              label="Duration"
              v-model.number="duration"
              @change="calculateNutrition"
              tooltip="How long will the mission be?"
              description=""
              type="number"
            >
              <template #append>
                <div class="input-group-text">days</div>
              </template>
            </TextInput>
          </div>
          <div class="col-lg-4 mb-3">
            <TextInput
              id="population"
              class=""
              label="Population"
              v-model.number="population"
              @change="calculateNutrition"
              tooltip="How many people will be in the mission?"
              description=""
              type="number"
            >
              <template #append>
                <div class="input-group-text">people</div>
              </template>
            </TextInput>
          </div>
          <div class="col-lg-4 mb-3">
            <TextInput
              id="calories"
              class=""
              label="Calories"
              v-model.number="goals.calories"
              @change="calculateNutrition"
              tooltip="How many calories per day per person"
              description=""
              type="number"
            >
              <template #append>
                <div class="input-group-text">kcal</div>
              </template>
            </TextInput>
          </div>
        </div>

        <div class="mb-3">
          <TextInput
            id="search"
            class=""
            label="Search"
            v-model="search"
            @change="searchUSDA"
            tooltip="Search the USDA database for a food"
            description=""
            :disabled="loading"
          >
            <template #append>
              <div class="input-group-append">
                <button
                  class="btn btn-primary"
                  :class="{ 'rounded-0': foodResults.length }"
                  @click="searchUSDA"
                >
                  <i v-if="loading" class="fa-solid fa-cog fa-spin"></i>
                  <i v-else class="fa fa-search"></i>
                </button>
              </div>
              <div class="input-group-append" v-if="foodResults.length">
                <button class="btn btn-danger" @click="clearResults">
                  <i class="fa fa-times"></i>
                </button>
              </div>
            </template>
          </TextInput>
        </div>

        <div class="form-list" v-if="foodResults.length">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Add</th>
                <th>Food</th>
                <th class="text-center">Calories</th>
                <th class="text-center">Serving</th>
                <th class="text-center">Fat</th>
                <th class="text-center">Carbs</th>
                <th class="text-center">Protein</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="food in foodResults"
                :key="food.id"
                :title="food.name"
                @click="showFoodModal(food)"
              >
                <td>
                  <button
                    class="btn btn-success btn-sm"
                    @click.stop="addFood(food)"
                  >
                    +
                  </button>
                </td>
                <th>
                  <div class="ellipsis">{{ food.name }}</div>
                </th>
                <td>{{ food.calories }}kcal</td>

                <td>{{ food.servingSize }}g</td>
                <td>{{ food.fat }}g</td>
                <td>{{ food.carbs }}g</td>
                <td>{{ food.protein }}g</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div id="food" v-if="foodMenu.length">
        <h3>Food List</h3>

        <table class="table table-striped food__table">
          <thead>
            <tr>
              <th>Name</th>
              <th colspan="3">Serving Size</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(food, index) in foodMenu"
              :key="food.id"
              :title="food.name"
              @click="showFoodModal(food)"
              class="food__row"
            >
              <th class="food__name ellipsis">
                <b>{{ food.name }}</b>
              </th>

              <td class="food__servings">{{ food.servingSize }}g</td>
              <td class="food__qty">
                <input
                  type="number"
                  class="form-control"
                  @click.stop
                  @change="calculateNutrition"
                  @input="
                    food.servings && food.servings < 1
                      ? (food.servings = 1)
                      : null
                  "
                  v-model.number="food.servings"
                />
              </td>
              <td class="food__remove">
                <button
                  class="btn btn-danger btn-sm"
                  @click.stop="removeFood(index)"
                >
                  <i class="fa fa-times"></i>
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td></td>
              <td class="text-right" colspan="3">
                <strong>Total Mass: {{ foodMass.toLocaleString() }}g</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    <div id="nutrition__results" class="col-lg-4 col-xl-5 calc-form">
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
              <th>
                <b>Sodium</b> {{ formatNumber(nutrition.sodium.total) }}mg
              </th>
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
              <th>
                <b>Protein</b> {{ formatNumber(nutrition.protein.total) }}g
              </th>
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

        <p class="small-info mt-2">
          * Percent values are based on a {{ goals.calories }} calorie diet for
          a population of {{ population }} for a period of {{ duration }} days.
        </p>
        <br />

        <p class="small-info">Calories per gram:</p>
        <p class="small-info text-center">
          Fat 9 &bull; Carbohydrate 4 &bull; Protein 4
        </p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
/**
 * TODOS:
 * Needed:
 * Order foodmodal nutrients alphabetically
 *
 *
 * Wanted:
 *
 * Should we update our foodResults / foodMenu to Maps instead of an objects?
 *
 *
 * Optional:
 * Results / charts?
 * Advanced Mode:
 * Allow changing of all sorts of nutritional requirements. At least Protein, Carbohydrates, and Fat.
 * Allow adding of custom foods?
 *
 */

import { ref, onMounted } from "vue";
import { deepClone, formatNumber } from "../utils";
import TextInput from "../forms/TextInput.vue";

type Nutrient = {
  nutrientId: number;
  name: string;
  nutrientName: string;
  unitName: string;
  amount: number;
  unit: string;
  value: number;
};

type Food = {
  id?: number;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  servingSize: number;
  nutrients: Nutrient[];
  show?: boolean;
  servings?: number;
};

type nutrientTotal = {
  total: number;
  percent: number;
  name: string;
  unit: string;
  id: number;
};

const loading = ref(false);

/***************************************************************************
 * Food Data
 **************************************************************************/
// https://nexusaurora.org
const USDA_API_URL =
  "https://nexusaurora.org/wp-content/themes/nexus-aurora/api/nutrition";
const requestOptions: RequestInit = {
  method: "GET",
  redirect: "follow",
};

const search = ref("");
const foodResults = ref<Food[]>([]);
const totalResults = ref(0);
const duration = ref(1);
const population = ref(1);

const foodMenu = ref<Food[]>([]);
const foodMass = ref(0);
const nutrientTotals = ref<nutrientTotal[]>([]);

const goals = ref({
  calories: 2000,
  protein: 50,
  fat: 65,
  saturated: 13,
  carbs: 300,
  fiber: 25,
  sodium: 2400,
  cholesterol: 300,
  sugar: 50,
});

function searchUSDA() {
  if (loading.value || !search.value) return;

  loading.value = true;

  fetch(USDA_API_URL + "/search.php?search=" + search.value, requestOptions)
    .then((response) => response.json())
    .then((result: Food[]) => {
      foodResults.value = [];
      result.forEach((food: Food) => {
        foodResults.value.push({
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          fat: food.fat,
          carbs: food.carbs,
          // @ts-ignore
          servingSize: food.serving_size,
          // @ts-ignore
          nutrients: JSON.parse(food.nutrients),
        });
      });
    })
    .catch((error) => console.log("error", error))
    .finally(() => {
      loading.value = false;
      totalResults.value = foodResults.value.length;
    });
}

function addFood(food: Food) {
  const newFood: Food = { ...food };
  newFood.show = false;
  newFood.servings = 1;

  foodMenu.value.push(newFood);
  calculateNutrition();
}

function removeFood(index: number) {
  foodMenu.value.splice(index, 1);
  calculateNutrition();
}

function clearResults() {
  foodResults.value = [];
  totalResults.value = 0;
  search.value = "";
}

/***************************************************************************
 * Food Data
 * **************************************************************************/

/***************************************************************************
 * NUTRITION RESULTS
 **************************************************************************/

const nutritionDefault = {
  calories: {
    total: 0,
    percent: 0,
  },
  fat: {
    total: 0,
    percent: 0,
    calories: 0,
    saturated: 0,
    saturatedPercent: 0,
    trans: 0,
  },
  cholesterol: {
    total: 0,
    percent: 0,
  },
  sodium: {
    total: 0,
    percent: 0,
  },
  carbs: {
    total: 0,
    percent: 0,
  },
  fiber: {
    total: 0,
    percent: 0,
  },
  protein: {
    total: 0,
    percent: 0,
  },
  sugar: {
    total: 0,
    percent: 0,
  },
  micro: {
    calcium: {
      total: 0,
      percent: 0,
    },
    fluoride: {
      total: 0,
      percent: 0,
    },
    folate: {
      total: 0,
      percent: 0,
    },
    iodine: {
      total: 0,
      percent: 0,
    },
    iron: {
      total: 0,
      percent: 0,
    },
    magnesium: {
      total: 0,
      percent: 0,
    },
    manganese: {
      total: 0,
      percent: 0,
    },
    phosphorus: {
      total: 0,
      percent: 0,
    },
    potassium: {
      total: 0,
      percent: 0,
    },
    sulfur: {
      total: 0,
      percent: 0,
    },
    thiamin: {
      total: 0,
      percent: 0,
    },
    riboflavin: {
      total: 0,
      percent: 0,
    },
    niacin: {
      total: 0,
      percent: 0,
    },
    vitaminA: {
      total: 0,
      percent: 0,
    },
    vitaminC: {
      total: 0,
      percent: 0,
    },
    vitaminD: {
      total: 0,
      percent: 0,
    },
    vitaminB6: {
      total: 0,
      percent: 0,
    },
    vitaminB12: {
      total: 0,
      percent: 0,
    },
    vitaminE: {
      total: 0,
      percent: 0,
    },
    vitaminK: {
      total: 0,
      percent: 0,
    },
    zinc: {
      total: 0,
      percent: 0,
    },
  },
};

const nutrition = ref({ ...nutritionDefault });

// These are the nutrition label IDs. All nutrients will be listed in detailsst modal
const CALORIES_ID = 1008;
const FAT_ID = 1004;
const SATURATED_FAT_ID = 1258;
const TRANS_FAT_ID = 1257;
const CARBS_ID = 1005;
const PROTEIN_ID = 1003;
const CHOLESTEROL_ID = 1253;
const SODIUM_ID = 1093;
const FIBER_ID = 1079;
const SUGAR_ID = 2000;

function getNutrient(food: Food, nutrientId: number): number {
  if (food.nutrients) {
    const nutrient = food.nutrients.find(
      (nutrient: any) => nutrient.nutrientId === nutrientId
    );

    return nutrient ? nutrient.value : 0;
  }

  return 0;
}

function calculateNutrition() {
  nutrition.value = deepClone(nutritionDefault);
  nutrientTotals.value = [];

  foodMass.value = 0;

  foodMenu.value.forEach((food) => {
    food.servings = food.servings || 1;

    nutrition.value.calories.total += food.calories * food.servings;
    nutrition.value.protein.total += food.protein * food.servings;
    nutrition.value.carbs.total += food.carbs * food.servings;
    nutrition.value.fat.total += food.fat * food.servings;

    nutrition.value.fat.saturated +=
      getNutrient(food, SATURATED_FAT_ID) * food.servings;
    nutrition.value.fat.trans +=
      getNutrient(food, TRANS_FAT_ID) * food.servings;
    nutrition.value.cholesterol.total +=
      getNutrient(food, CHOLESTEROL_ID) * food.servings;
    nutrition.value.sodium.total +=
      getNutrient(food, SODIUM_ID) * food.servings;
    nutrition.value.fiber.total += getNutrient(food, FIBER_ID) * food.servings;
    nutrition.value.sugar.total += getNutrient(food, SUGAR_ID) * food.servings;

    foodMass.value += food.servings * food.servingSize;

    // Loop through each of our nutrients and add them to the total
    food.nutrients.forEach((nutrient: Nutrient) => {
      const nutrientIndex = nutrientTotals.value.findIndex(
        (n: { id: number }) => n.id === nutrient.nutrientId
      );

      if (nutrientIndex === -1) {
        nutrientTotals.value.push({
          total: nutrient.value * (food.servings || 1),
          percent: 0,
          name: nutrient.nutrientName,
          unit: nutrient.unitName,
          id: nutrient.nutrientId,
        });
      } else {
        nutrientTotals.value[nutrientIndex].total +=
          nutrient.value * (food.servings || 1);
      }
    });
  });

  const multiplier = population.value * duration.value;

  nutrition.value.calories.percent =
    (nutrition.value.calories.total / (goals.value.calories * multiplier)) *
    100;
  nutrition.value.fat.percent =
    (nutrition.value.fat.total / (goals.value.fat * multiplier)) * 100;
  nutrition.value.fat.saturatedPercent =
    (nutrition.value.fat.saturated / (goals.value.saturated * multiplier)) *
    100;

  nutrition.value.protein.percent =
    (nutrition.value.protein.total / (goals.value.protein * multiplier)) * 100;

  nutrition.value.carbs.percent =
    (nutrition.value.carbs.total / (goals.value.carbs * multiplier)) * 100;

  nutrition.value.cholesterol.percent =
    (nutrition.value.cholesterol.total /
      (goals.value.cholesterol * multiplier)) *
    100;
  nutrition.value.sodium.percent =
    (nutrition.value.sodium.total / (goals.value.sodium * multiplier)) * 100;
  nutrition.value.fiber.percent =
    (nutrition.value.fiber.total / (goals.value.fiber * multiplier)) * 100;
  nutrition.value.sugar.percent =
    (nutrition.value.sugar.total / (goals.value.sugar * multiplier)) * 100;

  // Sort our nutrients alphabetically
  nutrientTotals.value.sort((a, b) => a.name.localeCompare(b.name));
}

/***************************************************************************
 * END NUTRITION RESULTS
 * *************************************************************************/

/***************************************************************************
 * FOOD MODAL
 * *************************************************************************/
let foodModal = null;
const modalFood = ref<Food | null>(null);

onMounted(() => {
  //foodModal = new bootstrap.Modal(document.getElementById("foodModal"));
});

function showFoodModal(food: Food) {
  modalFood.value = food;
  //foodModal.show();
}

/***************************************************************************
 * END FOOD MODAL
 * *************************************************************************/
</script>

<style>
/**
 * Globals
 */
.btn.btn-sm {
  padding: 4px 12px;
  font-size: 0.8rem;
}

.form-control {
}

/**
 * Food Search
 */
.calc-form {
  position: relative;
}

.form-list {
  border: 1px solid black;
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  z-index: 100;
  background-color: white;
  font-size: 14px;
  max-height: 300px;
  overflow-y: auto;
}

.form-list table {
  margin: 0;
}

.form-list table tr {
  vertical-align: middle;
  cursor: pointer;
}

.form-list table tbody td {
  text-align: center;
}

.form-list .ellipsis {
  max-width: 200px;
}

/**
 * FOOD ITEM
 */
.food__group {
  /* border: 1px solid black;
  border-radius: 5px; */
}

.food__group.list-group-item {
  padding: 0;
  border-color: #666;
}

.food__row {
  /* display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center; */
  vertical-align: middle;
  cursor: pointer;
  padding: 5px 10px;
}

.food__row .form-control {
  line-height: 1;
  font-size: 14px;
}

.food__name {
  font-weight: 500;
  max-width: 360px;
}

.food__qty {
  width: 100px;
}

.food__info {
}

.food__info table {
  margin: 0;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  border-collapse: collapse;
  overflow: hidden;
  font-size: 14px;
}

.food__info table th,
.food__info table td {
  padding: 5px 10px;
}

.food__table {
  font-size: 14px;
}

.food__servings {
  width: 100px;
}

.food__remove {
  width: 56px;
}

@media screen and (max-width: 768px) {
  .food__name {
    max-width: 160px;
  }
}

/**
 * NUTRITION LABEL
 */
#nutrition {
  padding: 100px 0;
}

.performance-facts {
  border: 1px solid black;
  padding: 0.5rem;
  position: -webkit-sticky; /* Safari */
  position: sticky;
  top: 100px;
}

.performance-facts p {
  margin: 0;
}

.performance-facts table {
  border-collapse: collapse;
}

.performance-facts__title {
  font-weight: bold;
  font-size: 2rem;
  margin: 0 0 0.25rem 0;
}

.performance-facts__header {
  border-bottom: 10px solid black;
  padding: 0 0 0.25rem 0;
  margin: 0 0 0.5rem 0;
}

.performance-facts__header p {
  margin: 0;
}

.performance-facts__table,
.performance-facts__table--small,
.performance-facts__table--grid {
  width: 100%;
}

.performance-facts__table thead tr th,
.performance-facts__table--small thead tr th,
.performance-facts__table--grid thead tr th,
.performance-facts__table thead tr td,
.performance-facts__table--small thead tr td,
.performance-facts__table--grid thead tr td {
  border: 0;
}

.performance-facts__table th,
.performance-facts__table--small th,
.performance-facts__table--grid th,
.performance-facts__table td,
.performance-facts__table--small td,
.performance-facts__table--grid td {
  font-weight: normal;
  text-align: left;
  padding: 0.25rem 0;
  border-top: 1px solid black;
  white-space: nowrap;
}

.performance-facts__table td:last-child,
.performance-facts__table--small td:last-child,
.performance-facts__table--grid td:last-child {
  text-align: right;
}

.performance-facts__table .blank-cell,
.performance-facts__table--small .blank-cell,
.performance-facts__table--grid .blank-cell {
  width: 1rem;
  border-top: 0;
}

.performance-facts__table .thick-row th,
.performance-facts__table--small .thick-row th,
.performance-facts__table--grid .thick-row th,
.performance-facts__table .thick-row td,
.performance-facts__table--small .thick-row td,
.performance-facts__table--grid .thick-row td {
  border-top-width: 5px;
}

.small-info {
  font-size: 0.7rem;
}

.performance-facts__table--small {
  border-bottom: 1px solid #999;
  margin: 0 0 0.5rem 0;
}

.performance-facts__table--small thead tr {
  border-bottom: 1px solid black;
}

.performance-facts__table--small td:last-child {
  text-align: left;
}

.performance-facts__table--small th,
.performance-facts__table--small td {
  border: 0;
  padding: 0;
}

.performance-facts__table--grid {
  margin: 0 0 0.5rem 0;
}

.performance-facts__table--grid td:last-child {
  text-align: left;
}

.performance-facts__table--grid td:last-child::before {
  content: "•";
  font-weight: bold;
  margin: 0 0.25rem 0 0;
}

.text-center {
  text-align: center;
}

.thick-end {
  border-bottom: 10px solid black;
}
.thin-end {
  border-bottom: 1px solid black;
}
/*
 * END NUTRITION LABEL
 */
</style>
