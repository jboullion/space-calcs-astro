import { useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { PerspectiveCamera } from 'three';
import { useStationStore } from '../../hooks/useStationStore';

interface OrbitCameraProps {
	camera: PerspectiveCamera;
}

export function OrbitCamera({ camera }: OrbitCameraProps) {
	const { radius, length } = useStationStore();

	// Configure OrbitControls for the scale of the station
	useEffect(() => {
		if (camera) {
			// Set initial camera position for a good view of the station
			camera.position.set(radius * 0.75, radius * 0.75, length * 0.5);
			camera.lookAt(0, 0, 0);
		}
	}, [camera, radius, length]);

	return (
		<OrbitControls
			camera={camera}
			makeDefault
			enableDamping
			dampingFactor={0.05}
			minDistance={10}
			maxDistance={Math.max(radius * 2, length)}
			// Limit vertical rotation to prevent disorientation
			minPolarAngle={Math.PI * 0.1}
			maxPolarAngle={Math.PI * 0.9}
			// Smooth touch response
			rotateSpeed={0.5}
			zoomSpeed={0.5}
			panSpeed={0.5}
		/>
	);
}
