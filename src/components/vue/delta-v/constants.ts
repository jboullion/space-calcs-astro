import { ref } from "vue";
import type { DeltaVForm, Destination, Engine } from "./types";

export const constants = {
  g: 9.80665, // m/s
  c3Deceleration: 1.5, // km/s
  escVe: 11.186, // km/s
};

export const formResults = ref({
  C3: 0,
});

export const rockets = {
  payloads: [2, 4, 6, 8, 10, 12, 14, 16, 20, 25, 30, 40, 50],
  falconHeavyRecovery: [
    40,
    20,
    5,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  falconHeavyEx: [
    82,
    60,
    44,
    31,
    20,
    11,
    4,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  newGlenn: [
    20,
    12,
    3,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  // https://explorers.larc.nasa.gov/2019APSMEX/MO/pdf_files/SLS%20mission%20planners%20guide%202018-12-19.pdf
  // Page 35
  slsBlockOne: [140, 100, 80, 65, 55, 45, 33, 28, 15, 5, null, null, null],
  slsBlockTwo: [120, 100, 90, 83, 76, 68, 62, 55, 45, 33, 22, 8, -8],
};

export const destinations = ref<Destination[]>([
  {
    name: "LEO",
    deltaV: 9256,
    percent: 0,
  },
  {
    name: "GEO",
    deltaV: 11696,
    percent: 0,
  },
  {
    name: "Moon",
    deltaV: 14917,
    percent: 0,
  },
  {
    name: "Mars (Aerobrake)",
    deltaV: 13500,
    percent: 0,
    aerobrake: true,
  },
  {
    name: "Ceres",
    deltaV: 18967,
    percent: 0,
  },
  {
    name: "Venus Orbit",
    deltaV: 16046,
    percent: 0,
  },
  {
    name: "Mercury",
    deltaV: 25425,
    percent: 0,
  },
  {
    name: "Jupiter Orbit",
    deltaV: 33026,
    percent: 0,
  },
  {
    name: "Saturn Orbit",
    deltaV: 27189,
    percent: 0,
  },
  {
    name: "Sun Escape",
    deltaV: 17979,
    percent: 0,
  },
  {
    name: "Europa",
    deltaV: 26740,
    percent: 0,
  },

  {
    name: "Titan (Aerobrake)",
    deltaV: 20021,
    percent: 0,
  },
]);

// TODO: Should this be defaultRockets instead? Also include common dry mass and payload values?
export const defaultEngines: Engine[] = [
  {
    name: "Merlin, Falcon 9",
    value: "Merlin, Falcon 9",
    ispVacuum: 348,
    ispSeaLevel: 311,
  },
  {
    name: "Raptor, Starship",
    value: "Raptor, Starship",
    ispVacuum: 350,
    ispSeaLevel: 330,
  },
  {
    name: "RD-107, Soyuz-FG",
    value: "RD-107, Soyuz-FG",
    ispVacuum: 320,
    ispSeaLevel: 263,
  },
  {
    name: "RS-25, Space Shuttle",
    value: "RS-25, Space Shuttle",
    ispVacuum: 452,
    ispSeaLevel: 366,
  },
  {
    name: "Rutherford, Electron",
    value: "Rutherford, Electron",
    ispVacuum: 343,
    ispSeaLevel: 311,
  },
  {
    name: "Vulcain 2, Ariane 5",
    value: "Vulcain 2, Ariane 5",
    ispVacuum: 429,
    ispSeaLevel: 318,
  },
  {
    name: "YF-100, Long March 7",
    value: "YF-100, Long March 7",
    ispVacuum: 335,
    ispSeaLevel: 300,
  },
];
