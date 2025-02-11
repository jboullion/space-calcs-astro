import type { AtmosphereProperties, PlanetType } from './types';

export const ATMOSPHERIC_CONSTANTS = {
	R: 8.314462618, // Universal gas constant in J/(mol·K)
	k: 1.380649e-23, // Boltzmann constant in J/K
	AVOGADRO: 6.02214076e23, // Avogadro constant in mol^-1
	MOLECULAR_MASSES: {
		// in g/mol
		N2: 28.014,
		O2: 31.999,
		CO2: 44.009,
		CH4: 16.043,
		H2O: 18.015,
		OTHER: 10.97, // Average for other gases
	},
};

export const PLANET_TYPES: { value: PlanetType; label: string }[] = [
	{ value: 'custom', label: 'Custom' },
	{ value: 'dwarf_planet', label: 'Dwarf Planet' },
	{ value: 'terrestrial', label: 'Terrestrial (Earth-like)' },
	{ value: 'super_earth', label: 'Super Earth' },
	{ value: 'ice_giant', label: 'Ice Giant (Neptune-like)' },
	{ value: 'gas_giant', label: 'Gas Giant (Jupiter-like)' },
];

export const PLANET_PRESETS = {
	asteroid: {
		radius: 500,
		density: 2000,
		atmosphere: 0,
		waterLevel: 0,
		atmosphereColor: '#88AAFF',
		composition: {
			n2: 0,
			o2: 0,
			co2: 0,
			ch4: 0,
			h2o: 0,
			other: 0,
		},
		temperature: 200,
		clouds: {
			enabled: false,
			density: 0,
			coverage: 0,
			altitude: 0,
			speed: 0,
			color: '#FFFFFF',
			cloudSeed: Math.random() * 100,
		},
		gasGiantVisuals: null,
	},
	dwarf_planet: {
		radius: 1200,
		density: 2200,
		atmosphere: 0,
		waterLevel: 0,
		atmosphereColor: '#88AAFF',
		composition: {
			n2: 0,
			o2: 0,
			co2: 0,
			ch4: 0,
			h2o: 0,
			other: 0,
		},
		temperature: 150,
		clouds: {
			enabled: false,
			density: 0,
			coverage: 0,
			altitude: 0,
			speed: 0,
			color: '#FFFFFF',
			cloudSeed: Math.random() * 100,
		},
	},
	terrestrial: {
		radius: 6371,
		density: 5500,
		atmosphere: 1,
		waterLevel: 2,
		atmosphereColor: '#88AAFF',
		composition: {
			n2: 78,
			o2: 21,
			co2: 0.04,
			ch4: 0.01,
			h2o: 0.96,
			other: 0.01,
		},
		temperature: 288,
		clouds: {
			enabled: true,
			density: 0.8,
			coverage: 0.6,
			altitude: 0.02,
			speed: 1.0,
			color: '#FFFFFF',
			cloudSeed: Math.random() * 100,
		},
	},
	super_earth: {
		radius: 12742, // Double Earth's radius
		density: 6000,
		atmosphere: 2,
		waterLevel: 3,
		atmosphereColor: '#88AAFF',
		composition: {
			n2: 75,
			o2: 23,
			co2: 0.1,
			ch4: 0.01,
			h2o: 1.5,
			other: 0.39,
		},
		temperature: 295,
		clouds: {
			enabled: true,
			density: 0.9,
			coverage: 0.7,
			altitude: 0.02,
			speed: 1.2,
			color: '#FFFFFF',
			cloudSeed: Math.random() * 100,
		},
	},
	ice_giant: {
		radius: 24622, // Similar to Neptune
		density: 1638,
		atmosphere: 50,
		waterLevel: 0,
		atmosphereColor: '#4169E1', // Royal Blue for atmosphere glow
		composition: {
			n2: 1.5,
			o2: 0,
			co2: 0,
			ch4: 2.3,
			h2o: 0.2,
			other: 96,
		},
		temperature: 72,
		clouds: {
			enabled: true,
			density: 0.95,
			coverage: 0.8,
			altitude: 0.04,
			speed: 1.8,
			color: '#87CEEB',
			cloudSeed: Math.random() * 100,
		},
		gasGiantVisuals: {
			bandCount: 8,
			rotationSpeed: 1.2,
			bandColors: [
				'#2E4B8A', // Dark blue
				'#3A5CA6',
				'#2E4B8A',
				'#4169E1',
				'#2E4B8A',
				'#3A5CA6',
				'#2E4B8A',
				'#4169E1',
			],
			bandBlending: 0.4,
		},
	},
	gas_giant: {
		radius: 69911,
		density: 1326,
		atmosphere: 100,
		waterLevel: 0,
		atmosphereColor: '#C88B3A', // Atmosphere glow color
		composition: {
			n2: 0.1,
			o2: 0,
			co2: 0,
			ch4: 0.3,
			h2o: 0.1,
			other: 99.5,
		},
		temperature: 165,
		clouds: {
			enabled: true,
			density: 1.0,
			coverage: 0.9,
			altitude: 0.05,
			speed: 2.0,
			color: '#E3D4B0',
			cloudSeed: Math.random() * 100,
		},
		gasGiantVisuals: {
			bandCount: 8,
			rotationSpeed: 1.0,
			bandColors: [
				'#A86920', // Dark brown
				'#C88B3A', // Light brown
				'#A86920',
				'#D89C4A', // Tan
				'#A86920',
				'#C88B3A',
				'#A86920',
				'#D89C4A',
			],
			bandBlending: 0.4,
		},
	},
	mars: {
		radius: 3389,
		density: 3900,
		atmosphere: 0.006,
		waterLevel: 0,
		atmosphereColor: '#C07158',
		composition: {
			n2: 2.7,
			o2: 0.13,
			co2: 95.3,
			ch4: 0,
			h2o: 0.03,
			other: 1.84,
		},
		temperature: 210,
		clouds: {
			enabled: true,
			density: 0.3,
			coverage: 0.2,
			altitude: 0.03,
			speed: 0.8,
			color: '#FFFFFF',
			cloudSeed: Math.random() * 100,
		},
	},
	venus: {
		radius: 6052,
		density: 5200,
		atmosphere: 92,
		waterLevel: 0,
		atmosphereColor: '#FFE4B5',
		composition: {
			n2: 3.5,
			o2: 0,
			co2: 96.5,
			ch4: 0,
			h2o: 0.002,
			other: 0.002,
		},
		temperature: 737,
		clouds: {
			enabled: true,
			density: 1.0,
			coverage: 1.0,
			altitude: 0.04,
			speed: 1.5,
			color: '#FFF5E1',
			cloudSeed: Math.random() * 100,
		},
	},
};
