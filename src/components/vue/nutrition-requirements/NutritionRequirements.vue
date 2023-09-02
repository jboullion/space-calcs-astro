<template>
    <div id="nutrition__app" class="row" v-cloak>
        <div id="nutrition__form" class="col-lg-8 col-xl-7 mb-5">
            <div class="calc-form mb-5 p-2 rounded border">
                <div class="row">
                    <div class="col-lg-4">
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
                    <div class="col-lg-4">
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
                    <div class="col-lg-4">
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

                <div class="">
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
                            <div
                                class="input-group-append"
                                v-if="foodResults.length"
                            >
                                <button
                                    class="btn btn-danger rounded-0"
                                    @click="clearResults"
                                >
                                    <i class="fa fa-times"></i>
                                </button>
                            </div>
                            <div
                                class="input-group-append rounded-end bg-primary"
                            >
                                <button
                                    class="btn text-white rounded-start-0"
                                    :class="{ 'rounded-0': foodResults.length }"
                                    @click="searchUSDA"
                                >
                                    <i
                                        v-if="loading"
                                        class="fa-solid fa-cog fa-spin"
                                    ></i>
                                    <i v-else class="fa fa-search"></i>
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
                                @click="openFoodModal(food)"
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

                <div class="p-2 rounded border">
                    <table class="table food__table">
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
                                @click="openFoodModal(food)"
                                class="food__row"
                            >
                                <th class="food__name ellipsis">
                                    <b>{{ food.name }}</b>
                                </th>

                                <td class="food__servings">
                                    {{ food.servingSize }}g
                                </td>
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
                                    <strong
                                        >Total Mass:
                                        {{ foodMass.toLocaleString() }}g</strong
                                    >
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
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
                                {{ formatNumber(nutrition.calories.total) }}
                                kcal
                            </th>
                            <td>
                                <!-- Calories from Fat {{ nutrition.fat.calories }} -->
                                <b
                                    >{{
                                        formatNumber(
                                            nutrition.calories.percent,
                                        )
                                    }}%</b
                                >
                            </td>
                        </tr>
                        <tr class="thick-row">
                            <td colspan="2" class="small-info">
                                <b>% Value*</b>
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <b>Total Fat</b>
                                {{ formatNumber(nutrition.fat.total) }}g
                            </th>
                            <td>
                                <b
                                    >{{
                                        formatNumber(nutrition.fat.percent)
                                    }}%</b
                                >
                            </td>
                        </tr>
                        <tr>
                            <th class="ps-3">
                                Saturated Fat
                                {{ formatNumber(nutrition.fat.saturated) }}g
                            </th>
                            <td>
                                <b
                                    >{{
                                        formatNumber(
                                            nutrition.fat.saturatedPercent,
                                        )
                                    }}%</b
                                >
                            </td>
                        </tr>
                        <tr>
                            <th class="ps-3">
                                Trans Fat
                                {{ formatNumber(nutrition.fat.trans) }}g
                            </th>
                            <td></td>
                        </tr>
                        <tr>
                            <th>
                                <b>Cholesterol</b>
                                {{
                                    formatNumber(nutrition.cholesterol.total)
                                }}mg
                            </th>
                            <td>
                                <b
                                    >{{
                                        formatNumber(
                                            nutrition.cholesterol.percent,
                                        )
                                    }}%</b
                                >
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <b>Sodium</b>
                                {{ formatNumber(nutrition.sodium.total) }}mg
                            </th>
                            <td>
                                <b
                                    >{{
                                        formatNumber(nutrition.sodium.percent)
                                    }}%</b
                                >
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <b>Total Carbohydrate</b>
                                {{ formatNumber(nutrition.carbs.total) }}g
                            </th>
                            <td>
                                <b
                                    >{{
                                        formatNumber(nutrition.carbs.percent)
                                    }}%</b
                                >
                            </td>
                        </tr>
                        <tr>
                            <th class="ps-3">
                                Dietary Fiber
                                {{ formatNumber(nutrition.fiber.total) }}g
                            </th>
                            <td>
                                <b
                                    >{{
                                        formatNumber(nutrition.fiber.percent)
                                    }}%</b
                                >
                            </td>
                        </tr>
                        <tr>
                            <th class="ps-3">
                                Sugars
                                {{ formatNumber(nutrition.sugar.total) }}g
                            </th>
                            <td>
                                <b
                                    >{{
                                        formatNumber(nutrition.sugar.percent)
                                    }}%</b
                                >
                            </td>
                        </tr>
                        <tr class="thick-end">
                            <th>
                                <b>Protein</b>
                                {{ formatNumber(nutrition.protein.total) }}g
                            </th>
                            <td>
                                <b
                                    >{{
                                        formatNumber(nutrition.protein.percent)
                                    }}%</b
                                >
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
                    * Percent values are based on a {{ goals.calories }} calorie
                    diet for a population of {{ population }} for a period of
                    {{ duration }} days.
                </p>
                <br />

                <p class="small-info">Calories per gram:</p>
                <p class="small-info text-center">
                    Fat 9 &bull; Carbohydrate 4 &bull; Protein 4
                </p>
            </div>
        </div>
        <Transition name="fade">
            <FoodModal
                v-if="modalFood && showFoodModal"
                :show="showFoodModal"
                :food="modalFood"
                @close="closeFoodModal"
                @addFood="addFood"
            />
        </Transition>
    </div>
</template>
<script setup lang="ts">
/**
 * TODOS:
 * Needed:
 * Our food modal is a super hack job and needs to be redone.
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

import { ref, onMounted } from 'vue';
import { deepClone, formatNumber } from '../utils';
import type { Food, NutrientTotal, Nutrient } from './types';
import TextInput from '../forms/TextInput.vue';
import FoodModal from './FoodModal.vue';
import TestModal from '../shared/BaseModal.vue';
import {
    CHOLESTEROL_ID,
    FIBER_ID,
    SATURATED_FAT_ID,
    SODIUM_ID,
    SUGAR_ID,
    TRANS_FAT_ID,
    calculateFoodNutrition,
    calculateNutritionPercentages,
    calculateNutritionTotals,
    getNutrient,
    goals,
    nutritionDefault,
} from './nutrition-util';

const loading = ref(false);

/***************************************************************************
 * Food Data
 **************************************************************************/
// https://nexusaurora.org
const USDA_API_URL =
    'https://nexusaurora.org/wp-content/themes/nexus-aurora/api/nutrition';
const requestOptions: RequestInit = {
    method: 'GET',
    redirect: 'follow',
};

const search = ref('');
const foodResults = ref<Food[]>([]);
const totalResults = ref(0);
const duration = ref(1);
const population = ref(1);

const foodMenu = ref<Food[]>([]);
const foodMass = ref(0);

function searchUSDA() {
    if (loading.value || !search.value) return;

    loading.value = true;

    fetch(USDA_API_URL + '/search.php?search=' + search.value, requestOptions)
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
        .catch((error) => console.log('error', error))
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
    search.value = '';
}

/***************************************************************************
 * Food Data
 * **************************************************************************/

/***************************************************************************
 * NUTRITION RESULTS
 **************************************************************************/

const nutrition = ref({ ...nutritionDefault });
const nutrientTotals = ref<NutrientTotal[]>([]);

function calculateNutrition() {
    nutrition.value = deepClone(nutritionDefault);
    nutrientTotals.value = [];

    foodMass.value = 0;

    foodMenu.value.forEach((food) => {
        nutrition.value = calculateFoodNutrition(food, {
            ...nutrition.value,
        });

        foodMass.value += (food.servings || 0) * food.servingSize;

        nutrientTotals.value = calculateNutritionTotals(
            food,
            nutrientTotals.value,
        );
    });

    const multiplier = population.value * duration.value;
    nutrition.value = calculateNutritionPercentages(
        nutrition.value,
        multiplier,
    );
}

/***************************************************************************
 * END NUTRITION RESULTS
 * *************************************************************************/

/***************************************************************************
 * FOOD MODAL
 * *************************************************************************/
const showFoodModal = ref(false);
const modalFood = ref<Food | null>(null);

onMounted(() => {
    //foodModal = new bootstrap.Modal(document.getElementById("foodModal"));
});

function openFoodModal(food: Food) {
    modalFood.value = food;
    showFoodModal.value = true;
    console.log('openFoodModal', food);
    //foodModal.show();
}

function closeFoodModal() {
    showFoodModal.value = false;
    //foodModal.hide();
    console.log('closeFoodModal');
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
    border: 1px solid var(--bs-border-color);
    border-radius: 5px;

    width: 100%;
    z-index: 100;
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
    border: 1px solid var(--bs-dark);
    padding: 0.5rem;
    position: -webkit-sticky; /* Safari */
    position: sticky;
    top: 100px;
}

[data-bs-theme='dark'] .performance-facts {
    border: 1px solid var(--bs-border-color);
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
    border-bottom: 10px solid var(--bs-dark);
    padding: 0 0 0.25rem 0;
    margin: 0 0 0.5rem 0;
}

[data-bs-theme='dark'] .performance-facts__header {
    border-bottom: 10px solid var(--bs-border-color);
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
    border-top: 1px solid var(--bs-dark);
    white-space: nowrap;
}

[data-bs-theme='dark'] .performance-facts__table th,
[data-bs-theme='dark'] .performance-facts__table--small th,
[data-bs-theme='dark'] .performance-facts__table--grid th,
[data-bs-theme='dark'] .performance-facts__table td,
[data-bs-theme='dark'] .performance-facts__table--small td,
[data-bs-theme='dark'] .performance-facts__table--grid td {
    border-top: 1px solid var(--bs-border-color);
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
    border-bottom: 1px solid var(--bs-dark);
}

[data-bs-theme='dark'] .performance-facts__table--small thead tr {
    border-bottom: 1px solid var(--bs-border-color);
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
    content: '•';
    font-weight: bold;
    margin: 0 0.25rem 0 0;
}

.text-center {
    text-align: center;
}

.thick-end {
    border-bottom: 10px solid var(--bs-dark);
}
.thin-end {
    border-bottom: 1px solid var(--bs-dark);
}

[data-bs-theme='dark'] .thick-end {
    border-bottom: 10px solid var(--bs-border-color);
}

[data-bs-theme='dark'] .thin-end {
    border-bottom: 1px solid var(--bs-border-color);
}
/*
 * END NUTRITION LABEL
 */

/**
  * FOOD MODAL
  */
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
    opacity: 1;
}

.fade-leave-active,
.fade-enter-active {
    transition: opacity 0.3s;
}

.modal-enter,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s;
}

.modal-enter-to,
.modal-leave {
    opacity: 1;
}
</style>
