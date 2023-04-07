import type { SpaceCalc } from "../../../types/types";
import { categories } from "./constants";

// TODO: Figure out a better way to create calculators...may need a DB. For now, just hardcode them.
// At the very least share / pass this to the pages so they can display the name and description the same as these strings
export const calculators: SpaceCalc[] = [
  {
    name: "Delta V",
    description: "Calculate the delta v required for a mission",
    categories: [categories[0]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/delta-v",
  },
  {
    name: "Hohmann Transfer",
    description: "Calculate the delta v required for a Hohmann transfer",
    categories: [categories[1]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/hohmann-transfer",
  },
  {
    name: "Orbit Visualizer",
    description: "Visualize the orbit of a satellite",
    categories: [categories[1]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/orbit-visualizer",
  },
  {
    name: "Rotational Gravity",
    description: "Calculate the forces on a rotating space station",
    categories: [categories[3]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/rotational-gravity",
  },
  {
    name: "Habitat Requirements",
    description:
      "Esimate the energy, mass, crew, and volume requirements for a habitat",
    categories: [categories[2]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/habitat-requirements",
  },
  {
    name: "Nutrition Requirements",
    description: "Estimate the nutrition requirements for a crew",
    categories: [categories[2]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/nutrition-requirements",
  },
];
