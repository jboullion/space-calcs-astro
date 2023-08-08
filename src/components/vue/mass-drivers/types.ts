import type { Units } from '../forms/types';

export interface IMassDriverForm {
    bodyRadius: number; // m
    bodyRadiusUnit: Units;
    bodyDensity: number; // Would it be easier to use gravity? g/cm³
    acceleration: number; // g or m/s^2
    accelerationUnit: Units;
    exitVelocity: number;
    exitVelocityUnit: Units;
    payloadMass: number;
    payloadMassUnit: Units;
}
