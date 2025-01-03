import * as THREE from 'three';
import type { IHyperionFormData } from '../types';

export function usePlayerModel() {
	const playerMesh = new THREE.Mesh(
		new THREE.CapsuleGeometry(0.0004, 0.002, 2, 16), // 0.8m wide, 2m tall
		new THREE.MeshPhongMaterial({ color: 0x00ff00 }),
	);

	const playerObject = new THREE.Object3D();
	playerObject.add(playerMesh);

	const updatePlayerPosition = (formData: IHyperionFormData) => {
		// Get the direction from center to player (gravity direction)
		const directionToCenter = playerObject.position
			.clone()
			.setY(0)
			.normalize()
			.multiplyScalar(-1);

		// Rotate player to align with "gravity"
		const upVector = new THREE.Vector3(0, 1, 0);
		playerMesh.quaternion.setFromUnitVectors(upVector, directionToCenter);

		// Ensure player stays at correct radius
		const horizontalPosition = new THREE.Vector2(
			playerObject.position.x,
			playerObject.position.z,
		);
		const currentRadius = horizontalPosition.length();

		if (currentRadius !== formData.structure.radius) {
			const angle = Math.atan2(
				playerObject.position.z,
				playerObject.position.x,
			);
			playerObject.position.x =
				Math.cos(angle) * formData.structure.radius;
			playerObject.position.z =
				Math.sin(angle) * formData.structure.radius;
		}
	};

	return {
		playerMesh,
		playerObject,
		updatePlayerPosition,
	};
}
