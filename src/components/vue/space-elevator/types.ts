export type SpaceElevatorForm = {
    planetRadius: number;
    planetDensity: number;
    planetRotation: number;
    planetGravity?: number;
    planetMass?: number;
    carSpeed: number; // The speed of the car in m/s
    payloadMass?: number; // The amount of mass the elevator can carry
    latitude?: number; // Where along the equator the elevator is located
    material: SEMaterial;
    safetyFactor: number;
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
