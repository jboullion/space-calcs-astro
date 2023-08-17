export type SpaceElevatorForm = {
    planetRadius: number;
    planetDensity: number;
    planetRotation: number;
    planetGravity?: number;
    planetMass: number; // kg
    carSpeed: number; // The speed of the car in m/s
    payloadMass: number; // The amount of mass the elevator can carry
    material: SEMaterial;
    safetyFactor: number;
    counterweightMass: number;
};

export type SEMaterial = {
    name: string;
    value: string;
    yieldStress: number;
    tensileStrength: number; //Mpa
    density: number; // kg/m3
    youngsModulus: number;
    poissonRatio: number;
};
