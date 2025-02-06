import { PerspectiveCamera } from 'three';

export interface CameraSettings {
	distance: number;
	height: number;
	heightOffset: number;
	rotationSpeed: number;
	minPolarAngle: number;

	maxPolarAngle: number;
	smoothing: number;
}

export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
	distance: 8,
	height: 8,
	heightOffset: 4,
	rotationSpeed: 0.003,
	minPolarAngle: -Math.PI / 2,
	maxPolarAngle: Math.PI / 2,
	smoothing: 0.1,
};

export interface CameraControlsProps {
	initialSettings: CameraSettings;
}

export interface CameraControlsUIProps {
	initialSettings: CameraSettings;
}

export interface ThirdPersonCameraProps {
	target: React.RefObject<THREE.Group>;
	camera: PerspectiveCamera;
}

export enum CameraType {
	// FirstPerson = "First Person",
	ThirdPerson = 'Third Person',
	Orbit = 'Orbit',
	FreeMove = 'Free Move',
}
