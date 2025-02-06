import type { CameraControlsProps } from '../../types/camera';
import { useControls } from 'leva';

export function CameraControls({ initialSettings }: CameraControlsProps) {
	return useControls('Camera Settings', {
		distance: {
			value: initialSettings.distance,
			min: 1,
			max: 20,
			step: 0.5,
			label: 'Camera Distance',
		},
		height: {
			value: initialSettings.height,
			min: 0,
			max: 10,
			step: 0.5,
			label: 'Base Height',
		},
		heightOffset: {
			value: initialSettings.heightOffset,
			min: 0,
			max: 5,
			step: 0.5,
			label: 'Height Offset',
		},
		rotationSpeed: {
			value: initialSettings.rotationSpeed,
			min: 0.001,
			max: 0.01,
			step: 0.001,
			label: 'Rotation Speed',
		},
		minPolarAngle: {
			value: initialSettings.minPolarAngle,
			min: -Math.PI / 2,
			max: Math.PI / 2,
			step: 0.1,
			label: 'Min Polar Angle',
		},
		maxPolarAngle: {
			value: initialSettings.maxPolarAngle,
			min: 0,
			max: Math.PI,
			step: 0.1,
			label: 'Max Polar Angle',
		},
		smoothing: {
			value: initialSettings.smoothing,
			min: 0.01,
			max: 1,
			step: 0.01,
			label: 'Smoothing',
		},
	});
}
