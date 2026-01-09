import { create } from 'zustand';
import { EndcapType, EnvironmentMaps } from '../types/station';
import type { StationStore } from '../types/station';
import { CameraType } from '../types/camera';

export const useStationStore = create<StationStore>((set) => ({
	radius: 1000,
	length: 2000,
	hillsCount: 3,
	hillHeight: 200,
	hillRatio: 0.5,
	endcapType: EndcapType.Flat,
	lightIntensity: 3,
	lightFalloff: 2,
	lightPosition: 0,
	lightColor: '#ffff80',
	ambientLightIntensity: 0.2,
	ambientLightColor: '#ffffff',
	stationColor: '#3f9b0b', // Default green color
	endcapColor: '#87CEEB', // Default sky blue
	hillColor: '#8B4513', // Default brown
	environmentMap: EnvironmentMaps[0],
	cameraType: CameraType.Orbit,
	cameraFOV: 60,
	showWireframe: false,
	wireframeColor: '#ffffff',
	wireframeOpacity: 0.1,
	setStationColor: (color: string) => set({ stationColor: color }),
	setEndcapColor: (color: string) => set({ endcapColor: color }),
	setHillColor: (color: string) => set({ hillColor: color }),
	setRadius: (radius: number) => set({ radius }),
	setLength: (length: number) => set({ length }),
	setHillsCount: (count: number) => set({ hillsCount: count }),
	setHillHeight: (height: number) => set({ hillHeight: height }),
	setHillRatio: (ratio: number) => set({ hillRatio: ratio }),
	setEndcapType: (type: EndcapType) => set({ endcapType: type }),
	setLightIntensity: (intensity: number) =>
		set({ lightIntensity: intensity }),
	setLightFalloff: (falloff: number) => set({ lightFalloff: falloff }),
	setLightPosition: (position: number) => set({ lightPosition: position }),
	setLightColor: (color: string) => set({ lightColor: color }),
	setAmbientLightIntensity: (intensity: number) =>
		set({ ambientLightIntensity: intensity }),
	setAmbientLightColor: (color: string) => set({ ambientLightColor: color }),
	setEnvironmentMap: (map) => set({ environmentMap: map }),
	setCameraType: (type: CameraType) => set({ cameraType: type }),
	setCameraFOV: (fov: number) => set({ cameraFOV: fov }),
	setShowWireframe: (show: boolean) => set({ showWireframe: show }),
	setWireframeColor: (color: string) => set({ wireframeColor: color }),
	setWireframeOpacity: (opacity: number) =>
		set({ wireframeOpacity: opacity }),
}));
