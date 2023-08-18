import type { Units } from '../forms/types';

export interface IFlyWheelForm {
    geometry: WheelGeometry;
    mass: number;
    radius: number;
    rpm: number;
    material: WheelMaterial;
    roundTripEfficiency?: number;
    powerDraw?: number;
}

export type WheelGeometry = {
    name: string;
    value: string;
    k: number;
};

export type WheelMaterial = {
    name: string;
    value: string;
    yieldStress: number;
    tensileStrength: number; //Mpa
    density: number; // kg/m3
    youngsModulus: number;
    poissonRatio: number;
};
