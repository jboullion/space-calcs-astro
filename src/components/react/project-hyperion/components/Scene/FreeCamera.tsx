import { useEffect, useRef } from 'react';
import { PerspectiveCamera, Vector3, Euler } from 'three';
import { useFrame } from '@react-three/fiber';
import { usePlayerControls } from '../../hooks/usePlayerControls';

interface FreeCameraProps {
	camera: PerspectiveCamera;
}

const MOVEMENT_SPEED = 100;
const SPRINT_MULTIPLIER = 5;
const ROTATION_SPEED = 0.003;

export function FreeCamera({ camera }: FreeCameraProps) {
	const {
		moveForward,
		moveBackward,
		moveLeft,
		moveRight,
		mouseX,
		mouseY,
		sprint,
	} = usePlayerControls();

	const rotation = useRef(new Euler(0, 0, 0, 'YXZ'));
	const velocity = useRef(new Vector3());
	const direction = useRef(new Vector3());

	// Set initial position
	useEffect(() => {
		if (camera) {
			camera.position.set(0, 100, 500);
			camera.rotation.set(0, 0, 0);
		}

		// Cleanup pointer lock when component unmounts
		return () => {
			if (document.pointerLockElement === document.body) {
				document.exitPointerLock();
			}
		};
	}, [camera]);

	useFrame((_, delta) => {
		if (!camera) return;

		// Update rotation based on mouse movement
		if (Math.abs(mouseX) > 0.01 || Math.abs(mouseY) > 0.01) {
			rotation.current.y -= mouseX * ROTATION_SPEED;
			rotation.current.x = Math.max(
				-Math.PI / 2,
				Math.min(
					Math.PI / 2,
					rotation.current.x - mouseY * ROTATION_SPEED,
				),
			);
			camera.rotation.copy(rotation.current);
		}

		// Calculate movement direction
		direction.current.set(0, 0, 0);

		if (moveForward) direction.current.z -= 1;
		if (moveBackward) direction.current.z += 1;
		if (moveLeft) direction.current.x -= 1;
		if (moveRight) direction.current.x += 1;

		// Normalize direction and apply movement
		if (direction.current.lengthSq() > 0) {
			direction.current.normalize();

			// Calculate velocity based on camera's rotation
			velocity.current.copy(direction.current);
			velocity.current.applyEuler(rotation.current);

			// Apply speed and delta time
			const currentSpeed = sprint
				? MOVEMENT_SPEED * SPRINT_MULTIPLIER
				: MOVEMENT_SPEED;
			velocity.current.multiplyScalar(currentSpeed * delta);

			// Update camera position
			camera.position.add(velocity.current);
		}
	});

	// We don't need to render anything, this component only handles camera controls
	return null;
}
