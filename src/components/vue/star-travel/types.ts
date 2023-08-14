import type { Units } from '../forms/types';

export interface IStarTravelForm {
    exampleLocation: StarLocation;
    distance: number; // ly
    // startingVelocity: number; // c or m/s^2
    // startingVelocityUnit: Units;
    acceleration: number; // g or m/s^2
    accelerationUnit: Units;
    maxVelocity: number;
    maxVelocityUnit: Units;
    deceleration: number; // g or m/s^2
    decelerationUnit: Units;
    // finalVelocity: number; // c or m/s^2
    // finalVelocityUnit: Units;
    shipMass: number;
    shipMassUnit: Units;
    //fuelEfficiency: number; // Mass -> Energy (MJ) ?
    exampleEngine: EngineType;
}

export type StarLocation = {
    name: string;
    value: string;
    distance: number; // ly
};

export type StarTravelResults = {
    travelTime: number; // years
    accelTime: number; // ly
    decelTime: number; // g or m/s^2
    totalDistance: number; // ly
    accelDistance: number;
    decelDistance: number; // g or m/s^2
    // timeMaxVelocity: number;
    //fuelEfficiency: number; // Mass -> Energy (MJ) ?
};

export type EngineType = {
    name: string;
    value: string;
    acceleration: number; // g or m/s^2
    maxVelocity: number;
    deceleration: number; // g or m/s^2
    fuelEfficiency: number; // Mass -> Energy (MJ) ?
};
