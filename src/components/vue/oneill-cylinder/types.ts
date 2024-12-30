import type { Cap } from './constants';

export type IONeillTabs =
	| 'structureTab'
	| 'internalFloors'
	| 'movementOptions'
	| 'population'
	| 'landUse';

export interface ONeillCylinderForm {
	structure: IStructure;
	internal: IInternalFloors;
	landUse: ILandUse;
	movementOptions: IMovementOptions;
	population: IPopulation;
}

export type IStructure = {
	radius: number; // km
	cylinderLength: number; // km
	surfaceGravity: number; // G
	internalPressure: number; // kpa
	internalTemperature: number; // C
	airMix: IAtmosphereComposition;
	material: IStationMaterial;
	safetyFactor: number;
	shellWallThickness: number; // m
	minShieldingShellMass: number; // kg/m2
	internalStructureMass: number; // kg/m2
	caps: Cap; //"flat" | "convex" | "concave"
};

export type IInternalFloors = {
	levelHeight: number; // m
	levels: number;
	floorMaterial: IStationMaterial;
};

export type ILandUse = {
	urbanDensity: number; // %
	agriculturalDensity: number; // %
	industrialDensity: number; // %
	// unusedDensity: number; // % calculated
	urbanDensityExample: IPopulationDensity;
};

export type IMovementOptions = {
	movementType: 'fixed' | 'rotating';
	rotationSpeed: number; // rpm
	rotationDirection: 'clockwise' | 'counterclockwise';
};

export type IPopulation = {
	populationDensity: IPopulationDensity;
	population: number;
};

export type IAtmosphereComposition = {
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

export type IStationMaterial = {
	name: string;
	value?: string;
	yieldStress: number;
	tensileStrength: number; //Mpa
	density: number; // kg/m3
	youngsModulus: number;
	poissonRatio: number;
};

export type IPopulationDensity = {
	name: string;
	value?: string;
	popKm2: number;
	// popM2: number; // TODO: Setup conversion rather than hard code?
	// popAcre: number; // TODO: Setup conversion rather than hard code?
};
