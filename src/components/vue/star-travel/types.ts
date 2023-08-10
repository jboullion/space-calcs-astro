import type { Units } from '../forms/types';

export interface IStarTravelForm {
    distance: number; // ly
    acceleration: number; // g or m/s^2
    accelerationUnit: Units;
    topSpeed: number;
    topSpeedUnit: Units;
    deceleration: number; // g or m/s^2
    decelerationUnit: Units;
    // bodyRadius: number; // m
    // bodyRadiusUnit: Units;
    // bodyDensity: number; // Would it be easier to use gravity? g/cm³
    // acceleration: number; // g or m/s^2
    // accelerationUnit: Units;
    // exitVelocity: number;
    // exitVelocityUnit: Units;
    // payloadMass: number;
    // payloadMassUnit: Units;
}
