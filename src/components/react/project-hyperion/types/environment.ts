import { Vector3, Euler } from "three";

export interface HillProps {
  position: Vector3;
  rotation: Euler;
  height: number;
  length: number;
  color: string;
  ratio: number;
}

export interface HillsManagerProps {
  count: number;
  stationRadius: number;
  stationLength: number;
  hillHeight: number;
  hillRatio: number;
  hillColor: string;
}

export interface TreeProps {
  position: Vector3;
  rotation: Euler;
}

export interface TreesManagerProps {
  stationRadius: number;
  stationLength: number;
}
