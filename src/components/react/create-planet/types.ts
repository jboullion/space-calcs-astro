export interface PlanetProps {
	radius: number;
	waterLevel: number;
	roughness: number;
	seed: number;
	atmosphere: AtmosphereProperties;
}

export interface CreatePlanetVisualizationProps {
	radius: number;
	waterLevel: number;
	roughness: number;
	seed: number;
	atmosphere: AtmosphereProperties;
}

export interface CreatePlanetFormProps {
	radius: number;
	density: number;
	waterLevel: number;
	roughness: number;
	seed: number;
	atmosphere: AtmosphereProperties;
	onRadiusChange: (value: number) => void;
	onDensityChange: (value: number) => void;
	onWaterLevelChange: (value: number) => void;
	onRoughnessChange: (value: number) => void;
	onSeedChange: (value: number) => void;
	onAtmosphereChange: (value: AtmosphereProperties) => void;
}

export interface AtmosphereProperties {
	pressure: number; // in atmospheres
	temperature: number; // in Kelvin
	composition: {
		n2: number; // percentage
		o2: number; // percentage
		co2: number; // percentage
		h2o: number; // percentage
		other: number; // percentage
	};
}
