import type { Cap } from "./constants";

export interface ONeillCylinderForm {
  structure: Structure;
  internal: InternalFloors;
  landUse: LandUse;
  diet: {};
}

export type Structure = {
  radius: number; // km
  cylinderLength: number; // km
  surfaceGravity: number; // G
  internalPressure: number; // kpa
  internalTemperature: number; // C
  airMix: AtmosphereComposition;
  material: StationMaterial;
  safetyFactor: number;
  shellWallThickness: number; // m
  minShieldingShellMass: number; // kg/m2
  internalStructureMass: number; // kg/m2
  caps: Cap; //"flat" | "convex" | "concave"
};

export type InternalFloors = {
  levelHeight: number; // m
  levels: number;
  floorMaterial: StationMaterial;
};

export type LandUse = {
  urbanDensity: number; // %
  agriculturalDensity: number; // %
  industrialDensity: number; // %
  // unusedDensity: number; // % calculated
  urbanDensityExample: PopulationDensity;
};

export type AtmosphereComposition = {
  name: string;
  value?: string;
  M: number; // pa
  P: number; // pa O2
  // O2: number; // %
  // N2: number; // %
  CO2: number; // %
  Ar: number; // %
  H2O: number; // %
  molarMass: number; // kg/mol
};

export type StationMaterial = {
  name: string;
  value?: string;
  yieldStress: number;
  tensileStrength: number; //Mpa
  density: number; // kg/m3
  youngsModulus: number;
  poissonRatio: number;
};

export type PopulationDensity = {
  name: string;
  value?: string;
  popKm2: number;
  // popM2: number; // TODO: Setup conversion rather than hard code?
  // popAcre: number; // TODO: Setup conversion rather than hard code?
};
