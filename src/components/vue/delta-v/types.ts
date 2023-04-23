//Create a type for the form data
export type DeltaVForm = {
  //location: null;
  pause: boolean;
  payloadMass: number;
  rocketMass: number;
  fuelMass: number;
  fuelType: null;
  engine: Engine;
  exhaustVelocity: number;
  seaLevelVelocity: number;
  specificImpulse: number;
  seaLevelSpecificImpulse: number;
  firstStageFuel: number;
  firstStageMass: number;
  //startLocation: null;
  showMap: boolean;
  showC3: boolean;
  twoStage: boolean;
  reusable: boolean;
  aerobrake: boolean;
  refill: boolean;
};

export type Destination = {
  name: string;
  deltaV: number;
  percent: number;
  aerobrake?: boolean;
};

export type Engine = {
  name: string;
  value: string;
  ispVacuum: number;
  ispSeaLevel: number;
};
