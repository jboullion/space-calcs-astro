export interface ONeillCylinderForm {
  structure: {
    radius: number; // km
    cylinderLength: number; // km
    surfaceGravity: number; // G
    internalPressure: number; // kpa
    internalTemperature?: number; // K
    airMix: AtmosphereComposition;
    material: StationMaterial;
    safetyFactor: number;
    shellWallThickness: number; // m
    minShieldingShellMass: number; // kg/m2
    internalStructureMass: number; // kg/m2
    caps: "flat" | "convex" | "concave";
  };
  internal: {
    roofHeight: number; // m
    levels: number;
    floorMaterial: StationMaterial;
  };
  land: {
    urbanDensity: number; // %
    agriculturalDensity: number; // %
    industrialDensity: number; // %
    // unusedDensity: number; // % calculated
    urbanDensityExample: PopulationDensity;
  };
  diet: {};
}

export type AtmosphereComposition = {
  name: string;
  value?: string;
  M: number; // pa
  P: number; // pa O2
  O2: number; // %
  N2: number; // %
  CO2: number; // %
  Ar: number; // %
  H2O: number; // %
  molarMass: number; // kg/mol
};

export const atmosphereCompositions: AtmosphereComposition[] = [
  {
    name: "Std Air Mix",
    value: "stdAirMix",
    M: 101000,
    P: 21210,
    O2: 21.0,
    N2: 78.0,
    CO2: 0.04,
    Ar: 0.96,
    H2O: 0.0,
    molarMass: 0.029,
  },
  {
    name: "Adjusted O2",
    value: "adjustedO2",
    M: 50000,
    P: 10500,
    O2: 42.42,
    N2: 56.58,
    CO2: 0.04,
    Ar: 0.96,
    H2O: 0.0,
    molarMass: 0.0298,
  },
  {
    name: "1500 eq",
    value: "1500eq",
    M: 85000,
    P: 17850,
    O2: 24.95,
    N2: 74.05,
    CO2: 0.04,
    Ar: 0.96,
    H2O: 0.0,
    molarMass: 0.029,
  },
  //   3500 eq	65,000 pa	13650	32.63%	66.37%	0.96%	0.04%	0.0294
  // 5500 eq	50,000 pa	10500	42.42%	56.58%	0.96%	0.04%	0.0298
  // Armstrong	6,180 pa	1297.8	100.00%	0	0.96%	0.04%	0.0324
  {
    name: "3500 eq",
    value: "3500eq",
    M: 65000,
    P: 13650,
    O2: 32.63,
    N2: 66.37,
    CO2: 0.04,
    Ar: 0.96,
    H2O: 0.0,
    molarMass: 0.0294,
  },
  {
    name: "5500 eq",
    value: "5500eq",
    M: 50000,
    P: 10500,
    O2: 42.42,
    N2: 56.58,
    CO2: 0.04,
    Ar: 0.96,
    H2O: 0.0,
    molarMass: 0.0298,
  },
  {
    name: "Armstrong",
    value: "armstrong",
    M: 6180,
    P: 1297.8,
    O2: 99.0,
    N2: 0.0,
    CO2: 0.04,
    Ar: 0.96,
    H2O: 0.0,
    molarMass: 0.0324,
  },
];

export type StationMaterial = {
  name: string;
  value?: string;
  yieldStress: number;
  tensileStrength: number;
  density: number;
  youngsModulus: number;
  possionRatio: number;
};

export const materials: StationMaterial[] = [
  {
    name: "Unobtanium",
    value: "unobtanium",
    yieldStress: 1000000,
    tensileStrength: 1000000,
    density: 1000,
    youngsModulus: 1000000,
    possionRatio: 0.001,
  },
  {
    name: "Aluminium Alloy (T6)",
    value: "aluminium",
    yieldStress: 480,
    tensileStrength: 530,
    density: 2700,
    youngsModulus: 82,
    possionRatio: 0.35,
  },
  {
    name: "Nickel Alloy",
    value: "nickel",
    yieldStress: 1100,
    tensileStrength: 1200,
    density: 8830,
    youngsModulus: 220,
    possionRatio: 0.291,
  },
  {
    name: "Low C steel",
    value: "lowCsteel",
    yieldStress: 395,
    tensileStrength: 580,
    density: 7800,
    youngsModulus: 217,
    possionRatio: 0.27,
  },
  {
    name: "Medium C steel",
    value: "mediumCsteel",
    yieldStress: 900,
    tensileStrength: 1200,
    density: 7800,
    youngsModulus: 217,
    possionRatio: 0.31,
  },
  {
    name: "High C steel",
    value: "highCsteel",
    yieldStress: 1155,
    tensileStrength: 1200,
    density: 7800,
    youngsModulus: 217,
    possionRatio: 0.3,
  },
  {
    name: "Titanium",
    value: "titanium",
    yieldStress: 1245,
    tensileStrength: 1620,
    density: 4600,
    youngsModulus: 120,
    possionRatio: 0.32,
  },
  {
    name: "Silica Glass",
    value: "silicaGlass",
    yieldStress: 1600,
    tensileStrength: 155,
    density: 2220,
    youngsModulus: 74,
    possionRatio: 0.2,
  },
  {
    name: "Glass Ceramic",
    value: "glassCeramic",
    yieldStress: 2100,
    tensileStrength: 177,
    density: 2800,
    youngsModulus: 110,
    possionRatio: 0.2,
  },
  {
    name: "Granite",
    value: "granite",
    yieldStress: 248,
    tensileStrength: 17,
    density: 3000,
    youngsModulus: 21,
    possionRatio: 0.3,
  },
  {
    name: "Concrete",
    value: "concrete",
    yieldStress: 60,
    tensileStrength: 5,
    density: 2600,
    youngsModulus: 21,
    possionRatio: 0.3,
  },
  {
    name: "Nylon",
    value: "nylon",
    yieldStress: 94,
    tensileStrength: 165,
    density: 1140,
    youngsModulus: 3.2,
    possionRatio: 0.4,
  },
  {
    name: "Carbon Fibre",
    value: "carbonFibre",
    yieldStress: 0,
    tensileStrength: 1600,
    density: 2000,
    youngsModulus: 0.74,
    possionRatio: 0.28,
  },
  {
    name: "Kevlar",
    value: "kevlar",
    yieldStress: 0,
    tensileStrength: 3000,
    density: 1440,
    youngsModulus: 112,
    possionRatio: 0.36,
  },
  {
    name: "Graphene",
    value: "graphene",
    yieldStress: 0,
    tensileStrength: 130000,
    density: 2270,
    youngsModulus: 1000,
    possionRatio: 0.19,
  },
  {
    name: "Soil",
    value: "soil",
    yieldStress: 0,
    tensileStrength: 0,
    density: 1500,
    youngsModulus: 0,
    possionRatio: 0,
  },
  {
    name: "Polyethylene",
    value: "polyethylene",
    yieldStress: 29,
    tensileStrength: 30,
    density: 920,
    youngsModulus: 0.8,
    possionRatio: 0.45,
  },
];

export type PopulationDensity = {
  name: string;
  popKm2: number;
  // popM2: number; // TODO: Setup conversion rather than hard code?
  // popAcre: number; // TODO: Setup conversion rather than hard code?
};

export const populationDensityExamples: PopulationDensity[] = [
  {
    name: "New York",
    popKm2: 1800,
  },
  {
    name: "Kowloon",
    popKm2: 43000,
  },
  {
    name: "Manhattan",
    popKm2: 28000,
  },
  {
    name: "Singapore",
    popKm2: 10500,
  },
  {
    name: "London",
    popKm2: 5800,
  },
  {
    name: "Paris",
    popKm2: 3900,
  },
  {
    name: "Melbourne",
    popKm2: 516,
  },
];

// TODO: What is this?
function convertSurfaceForce(material: Material, airPressure: number): number {
  return (material.tensileStrength * 1000000) / airPressure;
}
