import type { SpaceCalc } from "../types/types";
import {
  ADVANCED_CAT,
  HABITAT_CAT,
  LIFE_CAT,
  ORBIT_CAT,
  ROCKET_CAT,
  STATION_CAT,
  categories,
} from "../components/vue/home/constants";

// TODO: Figure out a better way to create calculators...may need a DB. For now, just hardcode them.
// At the very least share / pass this to the pages so they can display the name and description the same as these strings
export const unOrderedCalculators: SpaceCalc[] = [
  {
    id: "delta-v",
    name: "Rocket Potential Delta V",
    description: "Calculate the delta v required for a mission",
    categories: [categories[ROCKET_CAT], categories[ORBIT_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/delta-v",
  },
  {
    id: "hohmann-transfer",
    name: "Hohmann Transfer",
    description: "Calculate the delta v required for a Hohmann transfer",
    categories: [categories[ROCKET_CAT], categories[ORBIT_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/hohmann-transfer",
  },
  {
    id: "orbit-visualizer",
    name: "Orbit Visualizer",
    description: "Visualize the orbit of a satellite",
    categories: [categories[ORBIT_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/orbit-visualizer",
  },
  {
    id: "rotational-gravity",
    name: "Rotational Gravity",
    description: "Calculate the forces on a rotating space station",
    categories: [categories[STATION_CAT], categories[HABITAT_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/rotational-gravity",
  },
  {
    id: "habitat-requirements",
    name: "Habitat Requirements",
    description:
      "Esimate the energy, mass, crew, and volume requirements for a habitat",
    categories: [categories[HABITAT_CAT], categories[ADVANCED_CAT]],
    advanced: true,
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/habitat-requirements",
  },
  {
    id: "nutrition-requirements",
    name: "Nutrition Requirements",
    description: "Estimate the nutrition requirements for a crew",
    categories: [categories[HABITAT_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/nutrition-requirements",
  },
  {
    id: "habitable-zone",
    name: "Habitable Zone",
    description: "Estimate the habitable zone of a star",
    categories: [categories[ORBIT_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/habitable-zone",
  },
  {
    id: "solar-energy",
    name: "Solar Energy",
    description:
      "Estimate the available power from a solar panel anywhere in the solar system",
    categories: [categories[HABITAT_CAT], categories[STATION_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/solar-energy",
  },
  {
    id: "drake-equation",
    name: "Drake Equation",
    description:
      "Estimate the number of intelligent civilizations in the Milky Way galaxy",
    categories: [categories[LIFE_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/drake-equation",
  },
  {
    id: "oneill-cylinder",
    name: "O'Neill Cylinder",
    description:
      "Create an O'Neill Cylinder and estimate the population and energy requirements",
    categories: [categories[STATION_CAT], categories[ADVANCED_CAT]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/oneill-cylinder",
  },
];

export const calculators = unOrderedCalculators.sort((a, b) =>
  a.name.localeCompare(b.name)
);