import { deepClone } from "../utils";
import type { Food, Nutrient, NutrientTotal, NutritionResults } from "./types";

export const nutritionDefault = {
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

// These are the nutrition label IDs. All nutrients will be listed in detailsst modal
export const CALORIES_ID = 1008;
export const FAT_ID = 1004;
export const SATURATED_FAT_ID = 1258;
export const TRANS_FAT_ID = 1257;
export const CARBS_ID = 1005;
export const PROTEIN_ID = 1003;
export const CHOLESTEROL_ID = 1253;
export const SODIUM_ID = 1093;
export const FIBER_ID = 1079;
export const SUGAR_ID = 2000;

export const goals = {
  calories: 2000,
  protein: 50,
  fat: 65,
  saturated: 13,
  carbs: 300,
  fiber: 25,
  sodium: 2400,
  cholesterol: 300,
  sugar: 50,
};

export function getNutrient(food: Food, nutrientId: number): number {
  if (food.nutrients) {
    const nutrient = food.nutrients.find(
      (nutrient: any) => nutrient.nutrientId === nutrientId
    );

    return nutrient ? nutrient.value : 0;
  }

  return 0;
}

export function calculateFoodNutrition(
  food: Food,
  multiplier: number = 1
): any {
  const nutrition = deepClone(nutritionDefault);

  food.servings = food.servings || 1;

  nutrition.calories.total += food.calories * food.servings;
  nutrition.protein.total += food.protein * food.servings;
  nutrition.carbs.total += food.carbs * food.servings;
  nutrition.fat.total += food.fat * food.servings;

  nutrition.fat.saturated +=
    getNutrient(food, SATURATED_FAT_ID) * food.servings;
  nutrition.fat.trans += getNutrient(food, TRANS_FAT_ID) * food.servings;
  nutrition.cholesterol.total +=
    getNutrient(food, CHOLESTEROL_ID) * food.servings;
  nutrition.sodium.total += getNutrient(food, SODIUM_ID) * food.servings;
  nutrition.fiber.total += getNutrient(food, FIBER_ID) * food.servings;
  nutrition.sugar.total += getNutrient(food, SUGAR_ID) * food.servings;

  nutrition.calories.percent =
    (nutrition.calories.total / (goals.calories * multiplier)) * 100;
  nutrition.fat.percent =
    (nutrition.fat.total / (goals.fat * multiplier)) * 100;
  nutrition.fat.saturatedPercent =
    (nutrition.fat.saturated / (goals.saturated * multiplier)) * 100;

  nutrition.protein.percent =
    (nutrition.protein.total / (goals.protein * multiplier)) * 100;

  nutrition.carbs.percent =
    (nutrition.carbs.total / (goals.carbs * multiplier)) * 100;

  nutrition.cholesterol.percent =
    (nutrition.cholesterol.total / (goals.cholesterol * multiplier)) * 100;
  nutrition.sodium.percent =
    (nutrition.sodium.total / (goals.sodium * multiplier)) * 100;
  nutrition.fiber.percent =
    (nutrition.fiber.total / (goals.fiber * multiplier)) * 100;
  nutrition.sugar.percent =
    (nutrition.sugar.total / (goals.sugar * multiplier)) * 100;

  return nutrition;
}

export function calculateNutritionTotals(
  food: Food,
  nutrientTotals: NutrientTotal[] = []
): NutrientTotal[] {
  food.nutrients.forEach((nutrient: Nutrient) => {
    const nutrientIndex = nutrientTotals.findIndex(
      (n: { id: number }) => n.id === nutrient.nutrientId
    );

    if (nutrientIndex === -1) {
      nutrientTotals.push({
        total: nutrient.value * (food.servings || 1),
        percent: 0,
        name: nutrient.nutrientName,
        unit: nutrient.unitName,
        id: nutrient.nutrientId,
      });
    } else {
      nutrientTotals[nutrientIndex].total +=
        nutrient.value * (food.servings || 1);
    }
  });

  nutrientTotals.sort((a, b) => a.name.localeCompare(b.name));

  return nutrientTotals;
}
