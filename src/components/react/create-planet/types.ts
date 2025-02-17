export interface PlanetProps {
	radius: number;
	waterLevel: number;
	roughness: number;
	seed: number;
	atmosphere: AtmosphereProperties | null;
	surfaceColors: SurfaceColors;
}

export interface CreatePlanetVisualizationProps {
	radius: number;
	waterLevel: number;
	roughness: number;
	seed: number;
	atmosphere: AtmosphereProperties;
	planetType: string;
	surfaceColors: SurfaceColors;
}

export interface CreatePlanetFormProps {
	radius: number;
	density: number;
	waterLevel: number;
	roughness: number;
	seed: number;
	atmosphere: AtmosphereProperties;
	surfaceColors: SurfaceColors;
	onRadiusChange: (value: number) => void;
	onDensityChange: (value: number) => void;
	onWaterLevelChange: (value: number) => void;
	onRoughnessChange: (value: number) => void;
	onSeedChange: (value: number) => void;
	onAtmosphereChange: (value: AtmosphereProperties) => void;
	onSurfaceColorsChange: (value: SurfaceColors) => void;
}

export interface CloudProperties {
	enabled?: boolean;
	density: number; // 0-1, controls cloud thickness
	coverage: number; // 0-1, controls amount of cloud cover
	altitude: number; // 0.01-0.1, controls cloud layer height
	speed: number; // 0-5, controls cloud movement speed
	color: string; // hex color code
	cloudSeed: number; // random seed for cloud generation
}

export interface AtmosphereProperties {
	pressure: number; // in atmospheres
	temperature: number; // in Kelvin
	customColor?: string; // hex color code
	fullOpacity?: boolean; // whether to allow full opacity
	clouds: CloudProperties;
	composition: {
		n2: number; // percentage
		o2: number; // percentage
		co2: number; // percentage
		ch4: number; // percentage
		h2o: number; // percentage
		other: number; // percentage
	};
	gasGiantVisuals?: GasGiantVisuals;
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
	planetType: string;
	setPlanetType: (value: string) => void;
	surfaceColors: SurfaceColors;
	setSurfaceColors: (value: SurfaceColors) => void;
}

export type PlanetType =
	| 'custom'
	| 'dwarf_planet'
	| 'terrestrial'
	| 'super_earth'
	| 'ice_giant'
	| 'gas_giant';

export interface GasGiantVisuals {
	bandCount: number;
	rotationSpeed: number;
	bandColors: string[];
	bandBlending: number;
}

export interface SurfaceColors {
	lowland: string; // For areas with low elevation (valleys)
	midland: string; // For medium elevation areas
	highland: string; // For high elevation areas (mountains)
	base: string; // Base color for the planet's surface
}
