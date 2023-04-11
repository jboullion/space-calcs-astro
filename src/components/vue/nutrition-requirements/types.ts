export type Nutrient = {
  nutrientId: number;
  name: string;
  nutrientName: string;
  unitName: string;
  amount: number;
  unit: string;
  value: number;
};

export type Food = {
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

export type NutrientTotal = {
  total: number;
  percent: number;
  name: string;
  unit: string;
  id: number;
};

export type NutritionResults = {
  nutrition: any;
  foodMass: number;
};
