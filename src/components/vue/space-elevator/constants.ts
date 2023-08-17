import type { SEMaterial } from './types';

// TODO: Update this with real values!
export const materials: SEMaterial[] = [
    {
        name: 'Aluminium Alloy (T6)',
        value: 'aluminium',
        yieldStress: 480,
        tensileStrength: 530,
        density: 2700,
        youngsModulus: 82,
        poissonRatio: 0.35,
    },
    {
        name: 'High C steel',
        value: 'highCsteel',
        yieldStress: 1155,
        tensileStrength: 1200,
        density: 7800,
        youngsModulus: 217,
        poissonRatio: 0.3,
    },
    {
        name: 'Titanium',
        value: 'titanium',
        yieldStress: 1245,
        tensileStrength: 1620,
        density: 4600,
        youngsModulus: 120,
        poissonRatio: 0.32,
    },
    {
        name: 'Concrete',
        value: 'concrete',
        yieldStress: 60,
        tensileStrength: 5,
        density: 2600,
        youngsModulus: 21,
        poissonRatio: 0.3,
    },
    {
        name: 'Nylon',
        value: 'nylon',
        yieldStress: 94,
        tensileStrength: 165,
        density: 1140,
        youngsModulus: 3.2,
        poissonRatio: 0.4,
    },

    {
        name: 'Kevlar',
        value: 'kevlar',
        yieldStress: 0,
        tensileStrength: 3000,
        density: 1440,
        youngsModulus: 112,
        poissonRatio: 0.36,
    },
    {
        name: 'Carbon Fibre',
        value: 'carbonFibre',
        yieldStress: 0,
        tensileStrength: 1600,
        density: 2000,
        youngsModulus: 0.74,
        poissonRatio: 0.28,
    },
    {
        name: 'Carbon Nanotubes',
        value: 'carbonNanotubes',
        yieldStress: 0,
        tensileStrength: 63000,
        density: 2270,
        youngsModulus: 800,
        poissonRatio: 0.2,
    },
    {
        name: 'Graphene',
        value: 'graphene',
        yieldStress: 0,
        tensileStrength: 130000,
        density: 2270,
        youngsModulus: 1000,
        poissonRatio: 0.19,
    },
    {
        name: 'Unobtanium',
        value: 'unobtanium',
        yieldStress: 1000000,
        tensileStrength: 1000000,
        density: 1000,
        youngsModulus: 1000000,
        poissonRatio: 0.001,
    },
];

// export type OrbitLocations = {
//   id: number;
//   name: string;
//   value: string;
//   description: string;
//   g: number;
//   gravity: number;
//   radius: number;
//   mass: number;
//   rotationSpeed: number;
//   axis: null;
//   stationaryOrbit: number;
//   hillSphere: number;
// };

// export const locations: OrbitLocations[] = [
//   {
//     id: 1,
//     name: "Earth",
//     value: "earth",
//     description: "Gravity: 1g",
//     g: 1,
//     gravity: 9.807,
//     radius: 6378137, // ? NOTE: This is the equatorial radius. Should we reduce this number?
//     mass: 5.98e24, // kg
//     rotationSpeed: 460, // m/s
//     axis: null, // TODO ? Do we want to tilt the planets? Might be more hassle than it is worth...or it might just be a single group rotation
//     stationaryOrbit: 35786, // km
//     hillSphere: 1471400, // km
//   },
//   {
//     id: 2,
//     name: "Mars",
//     value: "mars",
//     description: "Gravity: 0.376g",
//     g: 0.376,
//     gravity: 3.721,
//     radius: 3389439,
//     mass: 6.39e23,
//     rotationSpeed: 238, // m/s
//     axis: null,
//     stationaryOrbit: 17031, // km
//     hillSphere: 982700, // km
//   },
//   {
//     id: 3,
//     name: "Moon",
//     value: "moon",
//     description: "Gravity: 0.16g",
//     g: 0.16,
//     gravity: 1.62,
//     radius: 1737447,
//     mass: 7.34767309e22,
//     rotationSpeed: 4.7, // m/s // 10916701.4624 / 2333000 days in seconds
//     axis: null,
//     stationaryOrbit: 88441, // km
//     hillSphere: 66100, // km
//   },
// ];
