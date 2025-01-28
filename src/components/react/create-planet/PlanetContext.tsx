import React, { createContext, useContext, useState } from 'react';
import type { AtmosphereProperties } from './types';

interface PlanetContextType {
	// Core planet parameters
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

const PlanetContext = createContext<PlanetContextType | undefined>(undefined);

export function PlanetProvider({ children }: { children: React.ReactNode }) {
	// Core planet parameters
	const [radius, setRadius] = useState(6371); // Default to Earth's radius
	const [density, setDensity] = useState(5500); // Default Earth-like density
	const [waterLevel, setWaterLevel] = useState(0);
	const [roughness, setRoughness] = useState(0.5);
	const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000000));
	const [atmosphere, setAtmosphere] = useState<AtmosphereProperties>({
		pressure: 1.0, // Earth-like defaults
		temperature: 288,
		composition: {
			n2: 78,
			o2: 21,
			co2: 0.04,
			ch4: 0.01,
			h2o: 0.96,
			other: 0.01,
		},
		cloudSeed: Math.floor(Math.random() * 1000000),
	});

	const value = {
		radius,
		setRadius,
		density,
		setDensity,
		waterLevel,
		setWaterLevel,
		roughness,
		setRoughness,
		seed,
		setSeed,
		atmosphere,
		setAtmosphere,
	};

	return (
		<PlanetContext.Provider value={value}>
			{children}
		</PlanetContext.Provider>
	);
}

export function usePlanet() {
	const context = useContext(PlanetContext);
	if (context === undefined) {
		throw new Error('usePlanet must be used within a PlanetProvider');
	}
	return context;
}
