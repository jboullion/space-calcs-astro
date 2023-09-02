import type { WheelGeometry, WheelMaterial } from './types';

export const flyWheelGeometry: WheelGeometry[] = [
    {
        name: 'Tire',
        value: 'tire',
        k: 1,
    },
    {
        name: 'Disk',
        value: 'disk',
        k: 0.606,
    },
    {
        name: 'Donut',
        value: 'donut',
        k: 0.3,
    },
    {
        name: 'Sphere',
        value: 'sphere',
        k: 2 / 5,
    },
    {
        name: 'Thin Rim',
        value: 'thin-rim',
        k: 0.5,
    },
    {
        name: 'Radial Rod',
        value: 'radial-rod',
        k: 1 / 3,
    },
    // circular brush - k = 1/3 ?? Do we add this geometry?s
    {
        name: 'Hollow Sphere',
        value: 'hollow-sphere',
        k: 2 / 3,
    },
    {
        name: 'Rectangular Rod',
        value: 'rectangular-rod',
        k: 0.5,
    },
];

export const materials: WheelMaterial[] = [
    {
        name: 'Aluminium Alloy (T6)',
        value: 'aluminium',
        yieldStress: 480,
        tensileStrength: 530,
        density: 2.7,
        youngsModulus: 82,
        poissonRatio: 0.35,
    },
    {
        name: 'High C steel',
        value: 'highCsteel',
        yieldStress: 1155,
        tensileStrength: 1200,
        density: 7.8,
        youngsModulus: 217,
        poissonRatio: 0.3,
    },
    {
        name: 'Titanium',
        value: 'titanium',
        yieldStress: 1245,
        tensileStrength: 1620,
        density: 4.6,
        youngsModulus: 120,
        poissonRatio: 0.32,
    },
    {
        name: 'Concrete',
        value: 'concrete',
        yieldStress: 60,
        tensileStrength: 5,
        density: 2.6,
        youngsModulus: 21,
        poissonRatio: 0.3,
    },
    {
        name: 'Nylon',
        value: 'nylon',
        yieldStress: 94,
        tensileStrength: 165,
        density: 1.14,
        youngsModulus: 3.2,
        poissonRatio: 0.4,
    },

    {
        name: 'Kevlar',
        value: 'kevlar',
        yieldStress: 0,
        tensileStrength: 3000,
        density: 1.44,
        youngsModulus: 112,
        poissonRatio: 0.36,
    },
    {
        name: 'Carbon Fibre',
        value: 'carbonFibre',
        yieldStress: 0,
        tensileStrength: 1600,
        density: 1.8,
        youngsModulus: 0.74,
        poissonRatio: 0.28,
    },
    {
        name: 'Carbon Nanotubes',
        value: 'carbonNanotubes',
        yieldStress: 0,
        tensileStrength: 63000,
        density: 2.26,
        youngsModulus: 800,
        poissonRatio: 0.2,
    },
    {
        name: 'Graphene',
        value: 'graphene',
        yieldStress: 0,
        tensileStrength: 130000,
        density: 2.267,
        youngsModulus: 1000,
        poissonRatio: 0.19,
    },
    {
        name: 'Unobtanium',
        value: 'unobtanium',
        yieldStress: 1000000,
        tensileStrength: 1000000,
        density: 1.0,
        youngsModulus: 1000000,
        poissonRatio: 0.001,
    },
];
