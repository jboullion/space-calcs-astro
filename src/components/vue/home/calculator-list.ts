import type { SpaceCalc } from "../../../types/types";
import {
  HABITAT_CAT,
  ORBIT_CAT,
  ROCKET_CAT,
  STATION_CAT,
  categories,
} from "./constants";

// TODO: Figure out a better way to create calculators...may need a DB. For now, just hardcode them.
// At the very least share / pass this to the pages so they can display the name and description the same as these strings
export const unOrderedCalculators: SpaceCalc[] = [
  {
    name: "Delta V",
    description: "Calculate the delta v required for a mission",
    categories: [categories[ROCKET_CAT], categories[ORBIT_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/delta-v",
  },
  {
    name: "Hohmann Transfer",
    description: "Calculate the delta v required for a Hohmann transfer",
    categories: [categories[ROCKET_CAT], categories[ORBIT_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/hohmann-transfer",
  },
  {
    name: "Orbit Visualizer",
    description: "Visualize the orbit of a satellite",
    categories: [categories[ORBIT_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/orbit-visualizer",
  },
  {
    name: "Rotational Gravity",
    description: "Calculate the forces on a rotating space station",
    categories: [categories[STATION_CAT], categories[HABITAT_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/rotational-gravity",
  },
  {
    name: "Habitat Requirements",
    description:
      "Esimate the energy, mass, crew, and volume requirements for a habitat",
    categories: [categories[HABITAT_CAT]],
    advanced: true,
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/habitat-requirements",
  },
  {
    name: "Nutrition Requirements",
    description: "Estimate the nutrition requirements for a crew",
    categories: [categories[HABITAT_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/nutrition-requirements",
  },
  {
    name: "Habitable Zone",
    description: "Estimate the habitable zone of a star",
    categories: [categories[ORBIT_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/habitable-zone",
  },
  {
    name: "Solar Energy",
    description:
      "Estimate the available power from a solar panel anywhere in the solar system",
    categories: [categories[HABITAT_CAT], categories[STATION_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/solar-energy",
  },
];

export const calculators = unOrderedCalculators.sort((a, b) =>
  a.name.localeCompare(b.name)
);
