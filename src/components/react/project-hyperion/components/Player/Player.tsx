import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh, Group } from 'three';
import { usePlayerControls } from '../../hooks/usePlayerControls';
import { ThirdPersonCamera } from '../../components/Scene/ThirdPersonCamera';
import { useStationStore } from '../../hooks/useStationStore';
import type { PlayerProps } from '../../types/player';

const WALK_SPEED = 15;
const SPRINT_MULTIPLIER = 3;
const SURFACE_OFFSET = 6;

export function Player({ camera }: PlayerProps) {
	const playerRef = useRef<Group>(null);
	const modelRef = useRef<Mesh>(null);
	const { moveForward, moveBackward, moveLeft, moveRight, sprint } =
		usePlayerControls();
	const { radius: STATION_RADIUS } = useStationStore();

	const moveDirection = useRef(new Vector3());
	const cameraDirection = useRef(new Vector3());
	const sideDirection = useRef(new Vector3());
	const upDirection = useRef(new Vector3());

	// Position player inside the cylinder initially
	// useEffect(() => {
	//   if (playerRef.current) {
	//     const pos = playerRef.current.position;
	//     pos.set(0, -(STATION_RADIUS - SURFACE_OFFSET), 0);
	//     updatePlayerOrientation(pos);
	//   }
	// }, [STATION_RADIUS]);

	useEffect(() => {
		if (playerRef.current) {
			const pos = playerRef.current.position;
			pos.set(0, -(STATION_RADIUS - SURFACE_OFFSET), 0);
			updatePlayerOrientation(pos);
		}

		// Cleanup pointer lock when component unmounts
		return () => {
			if (document.pointerLockElement === document.body) {
				document.exitPointerLock();
			}
		};
	}, [STATION_RADIUS]);

	const updatePlayerOrientation = (position: Vector3) => {
		if (!modelRef.current) return;

		// Calculate rotation to point directly toward the station's central axis
		// First rotate around Y to face center
		const yRotation = Math.atan2(-position.x, -position.y) + Math.PI / 2;
		// Then rotate around Z to align with the surface
		const zRotation = Math.atan2(position.y, position.x) + Math.PI / 2;

		// Reset rotation
		modelRef.current.rotation.set(0, 0, 0);

		// Apply rotations in correct order
		modelRef.current.rotateX(0); // Make capsule vertical
		modelRef.current.rotateY(yRotation); // Rotate to face center
		modelRef.current.rotateZ(-zRotation); // Align with surface
	};

	useFrame((_, delta) => {
		if (!playerRef.current || !camera) return;

		// Reset movement direction
		moveDirection.current.set(0, 0, 0);

		// Get camera's forward and right directions
		camera.getWorldDirection(cameraDirection.current);

		// Project camera direction onto cylinder surface
		const playerPos = playerRef.current.position;
		upDirection.current.copy(playerPos).setZ(0).normalize();

		// Calculate forward direction
		cameraDirection.current.projectOnPlane(upDirection.current);
		cameraDirection.current.normalize();

		// Calculate side direction
		sideDirection.current.crossVectors(
			upDirection.current,
			cameraDirection.current,
		);
		sideDirection.current.normalize();

		// Add movement based on input
		if (moveForward) {
			moveDirection.current.add(cameraDirection.current);
		}
		if (moveBackward) {
			moveDirection.current.sub(cameraDirection.current);
		}
		if (moveRight) {
			moveDirection.current.add(sideDirection.current);
		}
		if (moveLeft) {
			moveDirection.current.sub(sideDirection.current);
		}

		// Move player if there's input
		if (moveDirection.current.lengthSq() > 0) {
			moveDirection.current.normalize();

			// Apply speed based on sprint state
			const currentSpeed = sprint
				? WALK_SPEED * SPRINT_MULTIPLIER
				: WALK_SPEED;
			const velocity = moveDirection.current.multiplyScalar(
				currentSpeed * delta,
			);

			// Update position
			playerRef.current.position.add(velocity);

			// Project position onto cylinder surface
			const pos = playerRef.current.position;
			const xzLength = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
			if (xzLength !== 0) {
				const scale = (STATION_RADIUS - SURFACE_OFFSET) / xzLength;
				pos.x *= scale;
				pos.y *= scale;
			}

			// Update player orientation
			updatePlayerOrientation(playerRef.current.position);
		}
	});

	return (
		<>
			<group ref={playerRef}>
				<mesh
					ref={modelRef}
					position={[0, 0, 0]}
					castShadow
					receiveShadow
				>
					<capsuleGeometry args={[0.5, 2, 4, 8]} />
					<meshStandardMaterial
						color="#44aa88"
						envMapIntensity={0.2}
					/>
				</mesh>
			</group>

			<ThirdPersonCamera target={playerRef} camera={camera} />
		</>
	);
}
