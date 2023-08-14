import { physicsConstants } from '../utils';
import type { EngineType, StarLocation } from './types';

export const travelLocations: StarLocation[] = [
    {
        name: 'Alpha Centauri',
        value: 'Alpha Centauri',
        distance: 4.367,
    },
    {
        name: 'Betelgeuse',
        value: 'Betelgeuse',
        distance: 642.5,
    },
    {
        name: 'Milky Way Center',
        value: 'Milky Way Center',
        distance: 26000,
    },
    {
        name: 'Andromeda Galaxy',
        value: 'Andromeda Galaxy',
        distance: 2537000,
    },
];

export const exampleEngines: EngineType[] = [
    {
        name: 'Chemical Rocket',
        value: 'Chemical Rocket',
        acceleration: 9.81,
        maxVelocity: 50000,
        deceleration: 9.81,
        fuelEfficiency: 0.0001,
    },
    {
        name: 'Nuclear Thermal Rocket',
        value: 'Nuclear Thermal Rocket',
        acceleration: 9.81,
        maxVelocity: physicsConstants.c * 0.05,
        deceleration: 9.81,
        fuelEfficiency: 0.001,
    },
    {
        name: 'Nuclear Pulse Rocket',
        value: 'Nuclear Pulse Rocket',
        acceleration: 9.81,
        maxVelocity: physicsConstants.c * 0.05,
        deceleration: 9.81,
        fuelEfficiency: 0.001,
    },
    {
        name: 'Solar Sail',
        value: 'Solar Sail',
        acceleration: 0.00058,
        maxVelocity: physicsConstants.c * 0.1,
        deceleration: 0.00058,
        fuelEfficiency: 1,
    },
    {
        name: 'Ion Drive',
        value: 'Ion Drive',
        acceleration: 0.001,
        maxVelocity: 88888,
        deceleration: 0.001,
        fuelEfficiency: 0.01,
    },
    {
        name: 'Fusion Drive',
        value: 'Fusion Drive',
        acceleration: 9.81,
        maxVelocity: physicsConstants.c * 0.2,
        deceleration: 9.81,
        fuelEfficiency: 0.05,
    },
    {
        name: 'Antimatter Drive',
        value: 'Antimatter Drive',
        acceleration: 9.81,
        maxVelocity: physicsConstants.c * 0.5,
        deceleration: 9.81,
        fuelEfficiency: 1,
    },
    {
        name: 'Warp Drive',
        value: 'Warp Drive',
        acceleration: physicsConstants.c,
        maxVelocity: physicsConstants.c * 10,
        deceleration: physicsConstants.c,
        fuelEfficiency: 1,
    },
    // {
    //     name: 'Jump Drive',
    //     value: 'Jump Drive',
    //     acceleration: 0.0001,
    //     maxVelocity: 0.0001,
    //     deceleration: 0.0001,
    //     fuelEfficiency: 0.0001,
    // },
    // {
    //     name: 'Hyperdrive',
    //     value: 'Hyperdrive',
    //     acceleration: 0.0001,
    //     maxVelocity: 0.0001,
    //     deceleration: 0.0001,
    //     fuelEfficiency: 0.0001,
    // },
    // {
    //     name: 'Alcubierre Drive',
    //     value: 'Alcubierre Drive',
    //     acceleration: 0.0001,
    //     maxVelocity: 0.0001,
    //     deceleration: 0.0001,
    //     fuelEfficiency: 0.0001,
    // },
    // {
    //     name: 'Stargate',
    //     value: 'Stargate',
    //     acceleration: 0.0001,
    //     maxVelocity: 0.0001,
    //     deceleration: 0.0001,
    //     fuelEfficiency: 0.0001,
    // },
];
