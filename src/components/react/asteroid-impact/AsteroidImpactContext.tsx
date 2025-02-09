import React, { createContext, useContext, useState } from 'react';

export interface Asteroid {
	diameter: number; // in meters
	density: number; // in kg/m³
	composition: string;
}

export interface TargetBody {
	type: 'planet' | 'asteroid';
	diameter: number; // in meters
	density: number; // in kg/m³
	hasAtmosphere: boolean;
	atmosphereDensity?: number;
	surfaceType?: 'rock' | 'ice' | 'water';
}

export interface ImpactParameters {
	velocity: number; // in m/s
	angle: number; // in degrees
	altitude?: number; // in meters, for atmospheric entry
}

export interface ImpactContextType {
	asteroid: Asteroid;
	setAsteroid: (asteroid: Asteroid) => void;
	targetBody: TargetBody;
	setTargetBody: (target: TargetBody) => void;
	impactParams: ImpactParameters;
	setImpactParams: (params: ImpactParameters) => void;
}

export const defaultAsteroid: Asteroid = {
	diameter: 1000, // 1 km diameter
	density: 3000, // Average asteroid density
	composition: 'rock',
};

export const defaultTarget: TargetBody = {
	type: 'planet',
	diameter: 12742000, // Earth diameter in meters
	density: 5514, // Earth's average density
	hasAtmosphere: true,
	atmosphereDensity: 1.225, // Earth's atmosphere at sea level
	surfaceType: 'rock',
};

export const defaultImpactParams: ImpactParameters = {
	velocity: 20000, // 20 km/s
	angle: 45, // 45 degrees
	altitude: 100000, // 100 km
};

export const ImpactContext = createContext<ImpactContextType | undefined>(
	undefined,
);

export function AsteroidImpactProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [asteroid, setAsteroid] = useState<Asteroid>(defaultAsteroid);
	const [targetBody, setTargetBody] = useState<TargetBody>(defaultTarget);
	const [impactParams, setImpactParams] =
		useState<ImpactParameters>(defaultImpactParams);

	return (
		<ImpactContext.Provider
			value={{
				asteroid,
				setAsteroid,
				targetBody,
				setTargetBody,
				impactParams,
				setImpactParams,
			}}
		>
			{children}
		</ImpactContext.Provider>
	);
}

export function useImpact() {
	const context = useContext(ImpactContext);
	if (context === undefined) {
		throw new Error('useImpact must be used within an ImpactProvider');
	}
	return context;
}
