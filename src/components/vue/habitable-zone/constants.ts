export type HabitableZoneForm = {
  starMass: number; // Solar masses
  starAge: number; // Gyr
  starType: StarType; // M, K, G, F, A, B, O
  starRadius: number; // Solar radii
  starTemperature: number; // K
  //starLuminosity: number; // Solar luminosities
  planetOrbit: number; // AU
  planetAlbedo: number; // 0-100% of light reflected
  planetAtmosphere: number; // 0-X% Earth atmosphere
};

export type StarType = { value: string; name: string };

export const bolometricCorrection = [
  {
    starType: "M",
    value: -2,
  },
  {
    starType: "K",
    value: -0.8,
  },
  {
    starType: "G",
    value: -0.4,
  },
  {
    starType: "F",
    value: -0.15,
  },
  {
    starType: "A",
    value: -0.3,
  },
  {
    starType: "B",
    value: -2,
  },
];
