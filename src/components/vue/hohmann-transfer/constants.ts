import * as THREE from "three";
import { ref } from "vue";

export type Location = {
  name: string;
  distance: number; // km
  au: number;
  orbitalPeriod: number; // days. Convert to seconds before use.
  orbitColor: number;
  planetSize: number;
};

export const locations: Location[] = [
  {
    name: "Mercury",
    distance: 57910000, // km
    au: 0.39,
    orbitalPeriod: 87.66, // days. Convert to seconds before use.
    orbitColor: 0x6c757d,
    planetSize: 0.35,
  },
  {
    name: "Venus",
    distance: 108210000, // km
    au: 0.72,
    orbitalPeriod: 224.701, // days. Convert to seconds before use.
    orbitColor: 0xffc107,
    planetSize: 0.9,
  },
  {
    name: "Earth",
    distance: 149600000, // km
    au: 1,
    orbitalPeriod: 365.25636, // days. Convert to seconds before use.
    orbitColor: 0x0d6efd,
    planetSize: 1,
  },
  {
    name: "Mars",
    distance: 227920000, // km
    au: 1.52,
    orbitalPeriod: 686.6812, // days. Convert to seconds before use.
    orbitColor: 0xdc3545,
    planetSize: 0.4,
  },
  {
    name: "Jupiter",
    distance: 778570000, // km
    au: 5.2,
    orbitalPeriod: 4332.71, // days. Convert to seconds before use.
    orbitColor: 0xa79c86,
    planetSize: 4,
  },
  {
    name: "Saturn",
    distance: 1433530000, // km
    au: 9.58,
    orbitalPeriod: 10759.721, // days. Convert to seconds before use.
    orbitColor: 0x7b7869,
    planetSize: 3,
  },
  {
    name: "Uranus",
    distance: 2872460000, // km
    au: 19.2,
    orbitalPeriod: 30685.1868, // days. Convert to seconds before use.
    orbitColor: 0x0dcaf0,
    planetSize: 2,
  },
  {
    name: "Neptune",
    distance: 4495060000, // km
    au: 30.05,
    orbitalPeriod: 60190.5955, // days. Convert to seconds before use.
    orbitColor: 0x4b70dd,
    planetSize: 2,
  },
];

export const physicsConstants = {
  g: 9.80665, // m/s
  c3Deceleration: 1.5, // km/s
  escVe: 11.186, // km/s,
  GM: 1.327e11,
};

export const scaleConversions = {
  secondsToDays: 86400,
  scaleFactor: 100000,
};

export const animationConstants = ref({
  play: false,
  FPS: 60, // In order to ensure things run smoothly on all devices we need to set a fixed framerate
  prevTick: 0, // track the last tick timestamp
  orbitRotationVector: new THREE.Vector3(0, 0, 1),
  simulationSpeed: 1000, // how much faster than real time does the animation play?
  currentFrame: 1,
  complete: false,
  duration: 10, // seconds
});

// Hohman transfers for things orbiting Earth
// TODO: If a user selects Earth as either the starting or ending orbit, include these locations in the other option
// earthLocations: [
//   {
//     name: "LEO",
//     distance: 6628, // km
//     au: 0,
//     orbitalPeriod: 0.0642, // days. Convert to seconds before use.
//     earthOrbit: true
//   },
//   {
//     name: "GEO",
//     distance: 42164, // km
//     au: 0,
//     orbitalPeriod: 1, // days. Convert to seconds before use.
//     earthOrbit: true
//   },
//   {
//     name: "Moon",
//     distance: 390850, // km
//     au: 0,
//     orbitalPeriod: 27.32, // days. Convert to seconds before use.
//     earthOrbit: true
//   },
// ]
