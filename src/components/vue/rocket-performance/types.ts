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
		mixtureRatio: 2.72,
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
		mixtureRatio: 6.03,
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
		mixtureRatio: 3.6,
		combustionEfficiency: 96.5,
		propellantType: 'methalox',
	},
	{
		id: 'merlin',
		name: 'Merlin 1D (Kerosene/LOX)',
		massFlowRate: 236,
		baseExhaustVelocity: 3150,
		specificImpulse: 311,
		chamberPressure: 9.7,
		expansionRatio: 16,
		mixtureRatio: 2.34,
		combustionEfficiency: 97.5,
		propellantType: 'kerolox',
	},
	{
		id: 'be4',
		name: 'BE-4 (CH4/LOX)',
		massFlowRate: 650,
		baseExhaustVelocity: 3530,
		specificImpulse: 360,
		chamberPressure: 13.4,
		expansionRatio: 35,
		mixtureRatio: 3.6,
		combustionEfficiency: 96,
		propellantType: 'methalox',
	},
	{
		id: 'j2',
		name: 'J-2 (LH2/LOX)',
		massFlowRate: 232,
		baseExhaustVelocity: 4120,
		specificImpulse: 420,
		chamberPressure: 5.26,
		expansionRatio: 27.5,
		mixtureRatio: 5.5,
		combustionEfficiency: 96,
		propellantType: 'hydrolox',
	},
	{
		id: 'rd191',
		name: 'RD-191 (Kerosene/LOX)',
		massFlowRate: 595,
		baseExhaustVelocity: 3250,
		specificImpulse: 337,
		chamberPressure: 25.8,
		expansionRatio: 37,
		mixtureRatio: 2.72,
		combustionEfficiency: 97,
		propellantType: 'kerolox',
	},
	{
		id: 'le7a',
		name: 'LE-7A (LH2/LOX)',
		massFlowRate: 556,
		baseExhaustVelocity: 4340,
		specificImpulse: 440,
		chamberPressure: 12.1,
		expansionRatio: 52,
		mixtureRatio: 6.0,
		combustionEfficiency: 97,
		propellantType: 'hydrolox',
	},
	{
		id: 'vulcain',
		name: 'Vulcain 2 (LH2/LOX)',
		massFlowRate: 320,
		baseExhaustVelocity: 4300,
		specificImpulse: 432,
		chamberPressure: 11.7,
		expansionRatio: 60,
		mixtureRatio: 6.1,
		combustionEfficiency: 96.5,
		propellantType: 'hydrolox',
	},
	{
		id: 'rd0120',
		name: 'RD-0120 (LH2/LOX)',
		massFlowRate: 481,
		baseExhaustVelocity: 4460,
		specificImpulse: 455,
		chamberPressure: 21.8,
		expansionRatio: 85.7,
		mixtureRatio: 6.0,
		combustionEfficiency: 97.5,
		propellantType: 'hydrolox',
	},
];
