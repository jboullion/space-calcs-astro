export interface ISpecificImpulseForm {
	massFlowRate: number; // Mass flow rate in kg/s
	exhaustVelocity: number; // Exhaust velocity in m/s
	gravity: number; // Standard gravity (usually 9.81 m/s²)
	selectedEngineId: string; // Selected example engine ID
}

export interface IExampleEngine {
	id: string;
	name: string;
	massFlowRate: number;
	exhaustVelocity: number;
	specificImpulse: number;
}

export const exampleEngines: IExampleEngine[] = [
	{
		id: 'rd-180',
		name: 'RD-180 (Kerosene/LOX)',
		massFlowRate: 1200,
		exhaustVelocity: 3290,
		specificImpulse: 338,
	},
	{
		id: 'rs-25',
		name: 'RS-25 (LH2/LOX)',
		massFlowRate: 468,
		exhaustVelocity: 4465,
		specificImpulse: 452,
	},
	{
		id: 'raptor',
		name: 'Raptor (CH4/LOX)',
		massFlowRate: 615,
		exhaustVelocity: 3570,
		specificImpulse: 363,
	},
];
