import { physicsConstants, roundToDecimal } from "../utils";

export function calcSpinRads(radius: number, gravity: number) {
  const radiusM = radius * 1000;

  const result = Math.sqrt((gravity * physicsConstants.g) / radiusM);

  return roundToDecimal(result, 4);
}

export function calcG_Accel(radius: number, spinRads: number) {
  const radiusM = radius * 1000;

  return Math.pow(spinRads, 2) * radiusM;
}
