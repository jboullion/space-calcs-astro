export interface AtmosphericEntryForm {
  entryVelocity: number;  // m/s
  entryAngle: number;     // degrees
  vehicleMass: number;    // kg
  dragCoefficient: number;
  crossSectionalArea: number;  // m²
  noseRadius: number;     // m
  initialAltitude: number;  // km
}
