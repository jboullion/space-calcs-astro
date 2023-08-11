import type { Units } from '../forms/types';

export interface IStarTravelForm {
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
}
