export type SpaceElevatorForm = {
  planetRadius: number;
  planetDensity: number;
  planetRotation: number;
  planetGravity?: number;
  planetMass?: number;
  carSpeed: number; // The speed of the car in m/s
  payloadMass?: number; // The amount of mass the elevator can carry
  latitude?: number; // Where along the equator the elevator is located
};

// export type OrbitLocations = {
//   id: number;
//   name: string;
//   value: string;
//   description: string;
//   g: number;
//   gravity: number;
//   radius: number;
//   mass: number;
//   rotationSpeed: number;
//   axis: null;
//   stationaryOrbit: number;
//   hillSphere: number;
// };

// export const locations: OrbitLocations[] = [
//   {
//     id: 1,
//     name: "Earth",
//     value: "earth",
//     description: "Gravity: 1g",
//     g: 1,
//     gravity: 9.807,
//     radius: 6378137, // ? NOTE: This is the equatorial radius. Should we reduce this number?
//     mass: 5.98e24, // kg
//     rotationSpeed: 460, // m/s
//     axis: null, // TODO ? Do we want to tilt the planets? Might be more hassle than it is worth...or it might just be a single group rotation
//     stationaryOrbit: 35786, // km
//     hillSphere: 1471400, // km
//   },
//   {
//     id: 2,
//     name: "Mars",
//     value: "mars",
//     description: "Gravity: 0.376g",
//     g: 0.376,
//     gravity: 3.721,
//     radius: 3389439,
//     mass: 6.39e23,
//     rotationSpeed: 238, // m/s
//     axis: null,
//     stationaryOrbit: 17031, // km
//     hillSphere: 982700, // km
//   },
//   {
//     id: 3,
//     name: "Moon",
//     value: "moon",
//     description: "Gravity: 0.16g",
//     g: 0.16,
//     gravity: 1.62,
//     radius: 1737447,
//     mass: 7.34767309e22,
//     rotationSpeed: 4.7, // m/s // 10916701.4624 / 2333000 days in seconds
//     axis: null,
//     stationaryOrbit: 88441, // km
//     hillSphere: 66100, // km
//   },
// ];
