export type SolarEnergyForm = {
  starRadius: number; // Solar radii
  starTemperature: number; // K
  planetOrbit: number; // AU
  atmosphereAbsorption: number; // 0-X% Earth atmosphere
  solarPanelEfficiency: number; // 0-100% of light reflected
};
