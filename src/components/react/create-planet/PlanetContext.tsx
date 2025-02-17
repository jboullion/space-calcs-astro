import React, { createContext, useContext, useState } from 'react';
import type {
	AtmosphereProperties,
	PlanetContextType,
	SurfaceColors,
} from './types';

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
		clouds: {
			enabled: true,
			density: 0.8,
			coverage: 0.6,
			altitude: 0.02,
			speed: 1.0,
			color: '#FFFFFF',
			cloudSeed: Math.floor(Math.random() * 1000000),
		},
	});
	const [planetType, setPlanetType] = useState('terrestrial');
	const [surfaceColors, setSurfaceColors] = useState<SurfaceColors>({
		base: '#8B4513', // Saddle Brown
		lowland: '#A05A2C', // Sienna
		midland: '#8B4513', // Saddle Brown
		highland: '#A9A9A9', // Dark Gray
	});
	const [surfaceTemp, setSurfaceTemp] = useState(100); // Default to Earth's average surface temp in K

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
		planetType,
		setPlanetType,
		surfaceColors,
		setSurfaceColors,
		surfaceTemp,
		setSurfaceTemp,
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
