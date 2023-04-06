import type { Category } from "../components/vue/home/constants";

export interface Reference {
  title: string;
  url: string;
}

export type SpaceTool = {
  name: string;
  description: string;
  categories: Category[];
  image: string;
  link: string;
};
