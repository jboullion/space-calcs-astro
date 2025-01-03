// useHyperionScene.ts
import { ref } from 'vue';
import * as THREE from 'three';
import type { IHyperionFormData } from '../types';

export function useHyperionScene(canvasId: string) {
	const loading = ref(true);
	const isLocked = ref(false);

	// Movement state
	const moveState = {
		forward: false,
		backward: false,
		left: false,
		right: false,
		speed: 0.005, // km/s
		velocity: new THREE.Vector3(),
		direction: new THREE.Vector3(),
		cameraAngle: 0, // Track camera rotation around player
		cameraHeight: 0.004, // 4m above player
		cameraDistance: 0.01, // 10m behind player
	};

	// Three.js setup
	const three = {
		canvas: null as HTMLElement | null,
		renderer: null as THREE.WebGLRenderer | null,
		scene: new THREE.Scene(),
		camera: new THREE.PerspectiveCamera(),
		cylinder: new THREE.Mesh(),
		clock: new THREE.Clock(),
	};

	// Player setup
	const playerObject = new THREE.Object3D();
	const playerMesh = new THREE.Mesh(
		new THREE.CapsuleGeometry(0.0004, 0.002, 2, 16), // 0.8m wide, 2m tall
		new THREE.MeshPhongMaterial({ color: 0x00ff00 }),
	);
	playerObject.add(playerMesh);

	const setupScene = (formData: IHyperionFormData) => {
		if (loading.value) return;

		three.scene = new THREE.Scene();
		three.clock = new THREE.Clock();

		// Setup renderer
		three.renderer = new THREE.WebGLRenderer({
			antialias: true,
			logarithmicDepthBuffer: true,
		});
		three.canvas = document.getElementById(canvasId);

		if (!three.canvas) return;

		three.canvas.appendChild(three.renderer.domElement);
		updateRenderSize();

		// Camera setup
		three.camera = new THREE.PerspectiveCamera(
			60,
			three.canvas.getBoundingClientRect().width / 500,
			0.001,
			10000,
		);

		// Add player to scene
		three.scene.add(playerObject);

		// Initial player position
		playerObject.position.set(formData.structure.radius, 0, 0);
		updatePlayerOrientation();
		updateCameraPosition();

		setupLights();
		setupMouseControls();

		return three;
	};

	const setupLights = () => {
		three.scene.add(new THREE.AmbientLight(0x404040));
		const light = new THREE.DirectionalLight(0xffffff, 0.5);
		three.scene.add(light);
	};

	const setupMouseControls = () => {
		if (!three.canvas) return;

		three.canvas.addEventListener('mousemove', (event) => {
			if (!isLocked.value) return;

			// Update camera angle based on mouse movement
			moveState.cameraAngle -= event.movementX * 0.002;
			moveState.cameraHeight = Math.max(
				0.002,
				Math.min(
					0.01,
					moveState.cameraHeight - event.movementY * 0.0001,
				),
			);

			updateCameraPosition();
		});

		three.canvas.addEventListener('click', () => {
			if (!isLocked.value) {
				three.canvas?.requestPointerLock();
				isLocked.value = true;
			}
		});

		document.addEventListener('pointerlockchange', () => {
			isLocked.value = document.pointerLockElement === three.canvas;
		});
	};

	const updatePlayerOrientation = () => {
		// Get the direction from center to player (gravity direction)
		const directionToCenter = playerObject.position
			.clone()
			.normalize()
			.multiplyScalar(-1);

		// Rotate player to align with "gravity"
		const upVector = new THREE.Vector3(0, 1, 0);
		playerMesh.quaternion.setFromUnitVectors(upVector, directionToCenter);
	};

	const updateCameraPosition = () => {
		if (!three.camera) return;

		// Calculate camera position relative to player
		const playerRadius = playerObject.position.length();
		const playerAngle = Math.atan2(
			playerObject.position.z,
			playerObject.position.x,
		);

		// Position camera behind player based on camera angle
		const cameraAngle = playerAngle + moveState.cameraAngle;
		three.camera.position.set(
			(playerRadius + moveState.cameraDistance) * Math.cos(cameraAngle),
			playerObject.position.y + moveState.cameraHeight,
			(playerRadius + moveState.cameraDistance) * Math.sin(cameraAngle),
		);

		// Look at player
		three.camera.lookAt(playerObject.position);
	};

	const updateMovement = (formData: IHyperionFormData) => {
		if (!isLocked.value) return;

		const delta = three.clock.getDelta();

		// Calculate movement direction relative to camera angle
		const forwardDir = new THREE.Vector3(
			-Math.sin(moveState.cameraAngle),
			0,
			Math.cos(moveState.cameraAngle),
		);
		const rightDir = new THREE.Vector3(
			Math.cos(moveState.cameraAngle),
			0,
			Math.sin(moveState.cameraAngle),
		);

		// Update velocity
		moveState.velocity.x -= moveState.velocity.x * 10.0 * delta;
		moveState.velocity.z -= moveState.velocity.z * 10.0 * delta;

		// Apply movement
		const moveVector = new THREE.Vector3();

		if (moveState.forward) moveVector.add(forwardDir);
		if (moveState.backward) moveVector.sub(forwardDir);
		if (moveState.right) moveVector.add(rightDir);
		if (moveState.left) moveVector.sub(rightDir);

		if (moveVector.length() > 0) {
			moveVector.normalize();
			playerObject.position.add(
				moveVector.multiplyScalar(moveState.speed * delta),
			);

			// Keep player at correct radius
			const currentRadius = playerObject.position.length();
			playerObject.position
				.normalize()
				.multiplyScalar(formData.structure.radius);
		}

		// Update orientations
		updatePlayerOrientation();
		updateCameraPosition();
	};

	const updateRenderSize = () => {
		if (!three.canvas || !three.renderer || !three.camera) return;

		const width = three.canvas.getBoundingClientRect().width;
		const height = width * 0.75;

		three.camera.aspect = width / height;
		three.camera.updateProjectionMatrix();

		three.renderer.setSize(width, height, false);
		three.canvas.style.height = `${height}px`;
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		switch (event.code) {
			case 'ArrowUp':
			case 'KeyW':
				moveState.forward = true;
				break;
			case 'ArrowDown':
			case 'KeyS':
				moveState.backward = true;
				break;
			case 'ArrowLeft':
			case 'KeyA':
				moveState.left = true;
				break;
			case 'ArrowRight':
			case 'KeyD':
				moveState.right = true;
				break;
		}
	};

	const handleKeyUp = (event: KeyboardEvent) => {
		switch (event.code) {
			case 'ArrowUp':
			case 'KeyW':
				moveState.forward = false;
				break;
			case 'ArrowDown':
			case 'KeyS':
				moveState.backward = false;
				break;
			case 'ArrowLeft':
			case 'KeyA':
				moveState.left = false;
				break;
			case 'ArrowRight':
			case 'KeyD':
				moveState.right = false;
				break;
		}
	};

	return {
		three,
		loading,
		isLocked,
		moveState,
		playerObject,
		setupScene,
		updateRenderSize,
		updateMovement,
		handleKeyDown,
		handleKeyUp,
	};
}
