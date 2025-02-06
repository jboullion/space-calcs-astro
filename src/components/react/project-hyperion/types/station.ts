import { CameraType } from "./camera";

export interface StationStore {
  radius: number;
  length: number;
  hillsCount: number;
  hillHeight: number;
  hillRatio: number;
  endcapType: EndcapType;
  lightIntensity: number;
  lightFalloff: number;
  lightPosition: number;
  lightColor: string;
  ambientLightIntensity: number;
  ambientLightColor: string;
  environmentMap: EnvironmentMap;
  stationColor: string;
  endcapColor: string;
  hillColor: string;
  cameraType: CameraType;
  cameraFOV: number;
  showWireframe: boolean;
  wireframeColor: string;
  wireframeOpacity: number;
  setStationColor: (color: string) => void;
  setEndcapColor: (color: string) => void;
  setHillColor: (color: string) => void;
  setRadius: (radius: number) => void;
  setLength: (length: number) => void;
  setHillsCount: (count: number) => void;
  setHillHeight: (height: number) => void;
  setHillRatio: (ratio: number) => void;
  setEndcapType: (type: EndcapType) => void;
  setLightIntensity: (intensity: number) => void;
  setLightPosition: (position: number) => void;
  setLightColor: (color: string) => void;
  setLightFalloff: (falloff: number) => void;
  setEnvironmentMap: (map: EnvironmentMap) => void;
  setAmbientLightIntensity: (intensity: number) => void;
  setAmbientLightColor: (color: string) => void;
  setCameraType: (type: CameraType) => void;
  setCameraFOV: (fov: number) => void;
  setShowWireframe: (show: boolean) => void;
  setWireframeColor: (color: string) => void;
  setWireframeOpacity: (opacity: number) => void;
}

export interface EnvironmentMap {
  name: string;
  preset: EnvironmentMapPreset;
}

export type EnvironmentMapPreset =
  | "apartment"
  | "city"
  | "dawn"
  | "forest"
  | "lobby"
  | "night"
  | "park"
  | "studio"
  | "sunset"
  | "warehouse"
  | undefined;

export const EnvironmentMaps: EnvironmentMap[] = [
  { name: "Apartment", preset: "apartment" },
  { name: "City", preset: "city" },
  { name: "Dawn", preset: "dawn" },
  { name: "Forest", preset: "forest" },
  { name: "Lobby", preset: "lobby" },
  { name: "Night", preset: "night" },
  { name: "Park", preset: "park" },
  { name: "Studio", preset: "studio" },
  { name: "Sunset", preset: "sunset" },
  { name: "Warehouse", preset: "warehouse" },
];

export interface StationEndcapsProps {
  radius: number;
  stationLength: number;
  endcapType: EndcapType;
  color: string;
}

export enum EndcapType {
  None = "none",
  Flat = "flat",
  Spherical = "spherical",
}

export interface EndcapProps {
  radius: number;
  position: "start" | "end";
  stationLength: number;
  color: string;
}

export interface CoreLightingProps {
  stationRadius: number;
  stationLength: number;
}

export interface LightSphereProps extends CoreLightingProps {
  position?: [number, number, number];
  color?: string;
  intensity?: number;
  size?: number;
  falloff?: number;
}

export interface StationCoreLightingProps {
  stationRadius: number;
  stationLength: number;
}
