export type Vector3Tuple = [number, number, number];

export type OrbitalTime = {
	[name: string]: {
		[degree: number]: number;
	};
};

export type OrbitalVelocity = {
	[name: string]: {
		[degree: number]: {
			velocity: number;
			distance: number;
			time: number;
		};
	};
};

export type OrbitalPosition = {
	[name: string]: {
		[degree: number]: number[];
	};
};

export type OrbitalDegree = {
	[name: string]: number;
};

// A legacy type to make working with old systems easier
export type ScalarInput = {
	value: number;
	units: string;
	type: string;
};

export type VectorInput = {
	vector: number[];
	units: string;
	type: string;
};

export type TransferData = {
	maneuvers: Maneuver[];
	originPlanet: PlanetOrbit;
	destinationPlanet: PlanetOrbit;
	properName?: string;
	properNameTwo?: string;
	fromRadius: number;
	toRadius: number;
};

export type Maneuver = {
	name: string;
	title: string;
	deltaVee: number;
	hide?: boolean;
};

// Format ALL THE LOGGING DATA
export type FormatDataType = {
	pos: number[];
	vel: number[];
	TO: number;
	CO: number;
	TOGrav: number;
	COGrav: number;
	capTime: Date;
	depTime: Date;
	pos2: number[];
	vel2: number[];
	depVel: number[];
	arrVel: number[];
	predictedTime: number;
	tTime: number;
	timeDiff: number;
	a: number;
	misc: {
		p: number;
		highP: number;
		lowP: number;
		m: number;
		k: number;
		l: number;
		f: number[];
		g: number;
		fDot: number[];
		gDot: number[];
	};
	numTries: number;
	gravParam: number;
	dTime: number;
	deltaVee: number;
	originPlanet: PlanetOrbit;
	destinationPlanet: PlanetOrbit;
	rawDTime: number;
	rawTTime: number;
	index?: number;
	params?: {
		e: number;
		a: number;
		i: number;
		loAN: number;
		loPE: number;
	};
};

export type TransitWindow = {
	deltaVee: number;
	misc: any;
	filler: boolean;
};

export type PlanetOrbit = {
	name: string;
	value: string;
	loPE: number; // (Planets) Longitude of Periapsis
	aoPE?: number; // (Satellites) Argument of Periapsis
	loAN: number; // Longitude of Ascending Node
	e: number; // Orbital Eccentricity
	a: number; // Semi-major axis
	semiMinorAxis?: number; // Semi-minor axis
	i: number; // Orbital Inclination
	M?: number; // Mean Anomaly at epoch
	L: number; // (Planets) Mean Longitude at epoch
	r: number; // Radius of planet
	rL: number; // ...
	gravParam: number; // gravitational parameter
	colour: number; // Colour of planetary marker
	trackColour: number; // Colour of orbital track
	SOI: number; // Sphere of Influence
	center: string; // PLanetary body it is centered on
	rotation: number; // rotation period in days
	rotEpoch?: number; // Initial rotation at epoch
	epoch: Date; // Epoch of orbital elements
	epochDegree: number; // Degree at epoch
	axialTilt?: number[]; // Unit vector the north pole points towards
	satellite?: boolean; // If the planet is a satellite and not an actual planetary body (no surface mesh)
	tidallyLocked?: boolean; // If the planet is tidally locked to its parent
	satellites?: PlanetOrbit[]; // We may want to update this to SatelliteOrbit
	orbitMesh?: THREE.Group; // The orbital track
	planetMesh?: THREE.Mesh; // The planet mesh
	period: number; // Orbital period
	periodDays: number; // Orbital period in days
	previousDegree?: number; // The previous degree of the planet
	degreePercent?: number; // The percentage of the way through a degree of orbit
};

export interface ITransferWindowForm {
	origin: PlanetOrbit;
	destination: PlanetOrbit;
	originOrbit: number;
	destinationOrbit: number;
	aerobrake: boolean;
	// porkchop: boolean;
	departureToday: boolean;
	departureDateMin: Date;
	departureDateMax: Date;
}

export type TransferFormat = {
	pos: Vector3Tuple;
	vel: Vector3Tuple;
	TO: number;
	CO: number;
	TOGrav: number;
	COGrav: number;
	capTime: Date;
	depTime: Date;
	pos2: Vector3Tuple;
	vel2: Vector3Tuple;
	depVel: Vector3Tuple;
	arrVel: Vector3Tuple;
	predictedTime: number;
	tTime: number;
	timeDiff: string;
	a: number;
	misc: {
		p: number;
		highP: number;
		lowP: number;
		m: number;
		k: number;
		l: number;
		f: number[];
		g: number;
		fDot: number[];
		gDot: number[];
	};
	numTries: number;
	gravParam: number;
	dTime: number;
	deltaVee: number;
	originPlanet: PlanetOrbit;
	destinationPlanet: PlanetOrbit;
	rawDTime: number;
	rawTTime: number;
	index?: number;
};
