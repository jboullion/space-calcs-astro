import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { usePlayerControls } from '../../hooks/usePlayerControls';
import { DEFAULT_CAMERA_SETTINGS } from '../../types/camera';
import type { ThirdPersonCameraProps } from '../../types/camera';

export function ThirdPersonCamera({ target, camera }: ThirdPersonCameraProps) {
	const cameraVisualizationRef = useRef<THREE.Mesh>(null);
	const { mouseX, mouseY } = usePlayerControls();

	const angles = useRef({
		azimuthal: Math.PI,
		polar: Math.PI / 6,
	});

	const currentPosition = useRef(new Vector3());
	const currentLookAt = useRef(new Vector3());

	// Get settings directly from Leva controls
	const settings = { ...DEFAULT_CAMERA_SETTINGS }; //CameraControls({ initialSettings: DEFAULT_CAMERA_SETTINGS });

	useFrame(() => {
		if (!target.current) return;

		// Only update angles if there's actual mouse movement
		if (Math.abs(mouseX) > 0.01 || Math.abs(mouseY) > 0.01) {
			angles.current.azimuthal -= mouseX * settings.rotationSpeed;
			angles.current.polar = Math.max(
				settings.minPolarAngle,
				Math.min(
					settings.maxPolarAngle,
					angles.current.polar + mouseY * settings.rotationSpeed,
				),
			);
		}

		// Calculate camera position relative to target
		const targetPos = target.current.position;
		const offset = new Vector3(
			-settings.distance *
				Math.sin(angles.current.azimuthal) *
				Math.cos(angles.current.polar),
			(settings.height + settings.heightOffset) *
				Math.sin(angles.current.polar),
			-settings.distance *
				Math.cos(angles.current.azimuthal) *
				Math.cos(angles.current.polar),
		);

		// Update camera position
		const idealPosition = new Vector3().addVectors(targetPos, offset);
		currentPosition.current.lerp(idealPosition, settings.smoothing);
		camera.position.copy(currentPosition.current);

		// Update look-at point (above player)
		const idealLookAt = new Vector3(
			targetPos.x,
			targetPos.y + settings.heightOffset,
			targetPos.z,
		);
		currentLookAt.current.lerp(idealLookAt, settings.smoothing);
		camera.lookAt(currentLookAt.current);

		// Update visualization sphere position
		if (cameraVisualizationRef.current) {
			cameraVisualizationRef.current.position.copy(camera.position);
		}
	});

	return (
		<mesh ref={cameraVisualizationRef}>
			<sphereGeometry args={[0.2, 16, 16]} />
			<meshStandardMaterial color="red" />
		</mesh>
	);
}
