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

export interface CloudProperties {
	enabled?: boolean;
	density: number; // 0-1, controls cloud thickness
	coverage: number; // 0-1, controls amount of cloud cover
	altitude: number; // 0.01-0.1, controls cloud layer height
	speed: number; // 0-5, controls cloud movement speed
	color?: string; // hex color code
}

export interface AtmosphereProperties {
	pressure: number; // in atmospheres
	temperature: number; // in Kelvin
	customColor?: string; // hex color code
	cloudSeed?: number; // random seed for cloud generation
	fullOpacity?: boolean; // whether to allow full opacity
	clouds?: CloudProperties;
	composition: {
		n2: number; // percentage
		o2: number; // percentage
		co2: number; // percentage
		ch4: number; // percentage
		h2o: number; // percentage
		other: number; // percentage
	};
}

export interface PlanetContextType {
	radius: number;
	setRadius: (value: number) => void;
	density: number;
	setDensity: (value: number) => void;
	waterLevel: number;
	setWaterLevel: (value: number) => void;

	roughness: number;
	setRoughness: (value: number) => void;
	seed: number;
	setSeed: (value: number) => void;
	atmosphere: AtmosphereProperties;
	setAtmosphere: (value: AtmosphereProperties) => void;
}
