export interface IRocketPerformanceForm {
	massFlowRate: number; // Mass flow rate in kg/s
	baseExhaustVelocity: number; // Exhaust velocity in m/s
	gravity: number; // Standard gravity (usually 9.81 m/s²)
	selectedEngineId: string; // Selected example engine ID

	ambientPressure: number; // Ambient pressure in kPa
	expansionRatio: number; // Expansion ratio
	chamberPressure: number; // Chamber pressure in MPa
	mixtureRatio: number; // Mixture ratio
	combustionEfficiency: number; // Combustion efficiency
}

export interface IExampleEngine {
	id: string;
	name: string;
	massFlowRate: number;
	baseExhaustVelocity: number;
	specificImpulse: number;
	chamberPressure: number;
	ambientPressure: number;
	expansionRatio: number;
	mixtureRatio: number;
	combustionEfficiency: number;
	propellantType: 'kerolox' | 'hydrolox' | 'methalox';
}

export const exampleEngines = [
	{
		id: 'rd-180',
		name: 'RD-180 (Kerosene/LOX)',
		massFlowRate: 1200,
		baseExhaustVelocity: 3290,
		specificImpulse: 338,
		chamberPressure: 25.7,
		expansionRatio: 36.4,
		mixtureRatio: 2.72, // Typical for Kerosene/LOX
		combustionEfficiency: 96,
		propellantType: 'kerolox',
	},
	{
		id: 'rs-25',
		name: 'RS-25 (LH2/LOX)',
		massFlowRate: 468,
		baseExhaustVelocity: 4465,
		specificImpulse: 452,
		chamberPressure: 20.64,
		expansionRatio: 69,
		mixtureRatio: 6.03, // Higher for LH2/LOX engines
		combustionEfficiency: 97.5,
		propellantType: 'hydrolox',
	},
	{
		id: 'raptor',
		name: 'Raptor (CH4/LOX)',
		massFlowRate: 615,
		baseExhaustVelocity: 3570,
		specificImpulse: 363,
		chamberPressure: 30,
		expansionRatio: 40,
		mixtureRatio: 3.6, // Optimized for Methane/LOX
		combustionEfficiency: 96.5,
		propellantType: 'methalox',
	},
];
