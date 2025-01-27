export interface PlanetProps {
	radius: number;
	waterLevel: number;
	roughness: number;
	seed: number;
}

export interface CreatePlanetVisualizationProps {
	radius: number;
	waterLevel: number;
	roughness: number;
	seed: number;
}

export interface CreatePlanetFormProps {
	radius: number;
	density: number;
	waterLevel: number;
	roughness: number;
	seed: number;
	onRadiusChange: (value: number) => void;
	onDensityChange: (value: number) => void;
	onWaterLevelChange: (value: number) => void;
	onRoughnessChange: (value: number) => void;
	onSeedChange: (value: number) => void;
}
