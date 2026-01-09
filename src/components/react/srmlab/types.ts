// Type definitions for SRM Simulator

export interface GrainSegment {
	id: string;
	type: 'bates' | 'finocyl';
	length: number; // m
	outerRadius: number; // m (Ro)
	innerRadius: number; // m (Ri)
	inhibitEnds: boolean;
	// Finocyl specific
	finCount?: number; // Nf
	finDepth?: number; // m
	finThickness?: number; // m
}

export interface PropellantData {
	name: string;
	density: number; // kg/m³
	a: number; // Burn rate coefficient
	n: number; // Pressure exponent
	gamma: number; // Specific heat ratio
	Tc: number; // Chamber temperature (K)
	M: number; // Molar mass (kg/mol)
	Pmin?: number; // Pa
	Pmax?: number; // Pa
	description?: string;
}

export interface NozzleConfig {
	mode: 'manual' | 'auto';
	throatDiameter: number; // m
	exitDiameter: number; // m
	Cd: number; // Discharge coefficient
	ambientPressure: number; // Pa
	// Auto mode
	targetPressure?: number; // Pa
	targetExpansion?: number;
}

export interface MotorConfig {
	caseInnerDiameter: number; // m
	freeVolume: number; // m³
	grainStack: GrainSegment[];
	propellant: PropellantData;
	nozzle: NozzleConfig;
}

export interface SimulationOutput {
	t: number[]; // Time array
	Pc: number[]; // Chamber pressure
	F: number[]; // Thrust
	Ab: number[]; // Burn area
	Kn: number[]; // Kn ratio
	// Summary metrics
	totalImpulse?: number;
	averageThrust?: number;
	peakThrust?: number;
	burnTime?: number;
	peakPressure?: number;
	averagePressure?: number;
	deliveredIsp?: number;
	propellantMass?: number;
	volumeLoading?: number;
	initialKn?: number;
	peakKn?: number;
	portToThroatRatio?: number;
	peakMassFlux?: number; // Throat mass flux (kg/m²/s)
	peakPortMassFlux?: number; // Port mass flux (kg/m²/s)
	designation?: string; // NAR/TRA motor class
}
