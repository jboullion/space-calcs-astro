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

export const PLANET_PRESETS = {
	earth: {
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
		},
	},
	jupiter: {
		radius: 69911,
		density: 1326,
		atmosphere: 100,
		waterLevel: 0,
		atmosphereColor: '#C88B3A',
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
			density: 1.0, // Dense cloud system
			coverage: 0.9, // High coverage
			altitude: 0.05, // Higher cloud layer
			speed: 2.0, // Faster rotation for gas giant
			color: '#E3D4B0',
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
			density: 0.3, // Thin clouds
			coverage: 0.2, // Low coverage
			altitude: 0.03, // Similar height to Earth
			speed: 0.8, // Slower rotation
			color: '#FFFFFF',
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
			density: 1.0, // Very dense clouds
			coverage: 1.0, // Complete coverage
			altitude: 0.04, // Higher cloud layer
			speed: 1.5, // Faster rotation
			color: '#FFE4B5',
		},
	},
};
