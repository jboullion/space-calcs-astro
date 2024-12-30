import { ref, type ComputedRef } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { animation } from '../constants';
//import { usePhysicsParticleSystem } from './usePhysicsParticleSystem';
//import { useStationLighting } from './useStationLighting';

export function useThreeScene(
	canvasId: string,
	stationWidth: ComputedRef<number>,
	rotationSpeed: ComputedRef<number>,
	radius: ComputedRef<number>,
) {
	const three = {
		canvas: null as HTMLElement | null,
		renderer: null as THREE.WebGLRenderer | null,
		scene: new THREE.Scene(),
		camera: new THREE.PerspectiveCamera(),
		controls: null as OrbitControls | null,
		station: new THREE.Mesh(),
		floors: new THREE.Group(),
		group: new THREE.Group(),
	};

	// const { initParticles, updateParticles, removeParticles } =
	// 	usePhysicsParticleSystem(three.group, stationWidth, radius);

	// const { initLights, updateLights, removeLights } = useStationLighting(
	// 	three.group,
	// 	stationWidth,
	// );

	let prevTick = 0;
	let animationFrameId: number;

	const calculateOptimalCameraDistance = (): number => {
		// Calculate the diagonal of the cylinder for better view
		const cylinderDiagonal = Math.sqrt(
			Math.pow(stationWidth.value, 2) + Math.pow(radius.value * 2, 2),
		);

		// Add some padding (1.5x) to ensure the entire structure is visible
		return cylinderDiagonal * 1.5;
	};

	const setupThreeJS = () => {
		three.scene = new THREE.Scene();
		three.group = new THREE.Group();
		three.floors = new THREE.Group();

		// Renderer
		three.renderer = new THREE.WebGLRenderer({
			antialias: true,
			logarithmicDepthBuffer: true,
		});

		three.canvas = document.getElementById(canvasId);
		if (!three.canvas) return;

		three.canvas.appendChild(three.renderer.domElement);

		// Initial size
		updateRenderSize();

		// Camera setup with dynamic distance
		const cameraDistance = calculateOptimalCameraDistance();
		three.camera = new THREE.PerspectiveCamera(
			45,
			three.canvas.getBoundingClientRect().width / 500,
			0.1,
			cameraDistance * 50,
		);

		// Position camera at an angle for better initial view
		three.camera.position.set(
			cameraDistance * 0.7, // X position for slight offset
			cameraDistance * 0.3, // Y position for elevation
			cameraDistance * 0.7, // Z position
		);

		// Look at the center of the cylinder
		three.camera.lookAt(new THREE.Vector3(0, 0, -stationWidth.value / 2));

		// Controls
		three.controls = new OrbitControls(
			three.camera,
			three.renderer.domElement,
		);
		three.controls.maxDistance = cameraDistance * 2;
		three.controls.minDistance = cameraDistance * 0.1;
		three.controls.enableDamping = true;
		three.controls.dampingFactor = 0.05;

		// Lights
		three.scene.add(new THREE.AmbientLight(0x404040));
		const light = new THREE.DirectionalLight(0xffffff, 0.5);
		three.scene.add(light);

		three.scene.add(three.group);
		prevTick = 0;
	};

	const updateRenderSize = () => {
		if (!three.canvas || !three.renderer || !three.camera) return;

		const width = three.canvas.getBoundingClientRect().width;
		const height = width * 0.75;

		// Update camera
		three.camera.aspect = width / height;
		three.camera.updateProjectionMatrix();

		// Update renderer
		three.renderer.setSize(width, height, false);
		three.canvas.style.height = `${height}px`;
	};

	const updateCameraPosition = () => {
		if (!three.camera || !three.controls) return;

		const newDistance = calculateOptimalCameraDistance();

		// Update controls limits
		three.controls.maxDistance = newDistance * 2;
		three.controls.minDistance = newDistance * 0.3;

		// Only update camera position if it's beyond the new limits
		const currentDistance = three.camera.position.length();
		if (
			currentDistance > newDistance * 2 ||
			currentDistance < newDistance * 0.3
		) {
			const direction = three.camera.position.normalize();
			three.camera.position.copy(direction.multiplyScalar(newDistance));
			three.camera.lookAt(
				new THREE.Vector3(0, 0, -stationWidth.value / 2),
			);
		}
	};

	let lastTime = 0;
	const animate = (currentTime: number) => {
		if (!three.renderer || !three.controls) return;

		const deltaTime = (currentTime - lastTime) / 1000;
		lastTime = currentTime;

		animationFrameId = requestAnimationFrame(animate);
		// updateParticles(deltaTime); // Pass deltaTime for physics calculations
		// updateLights();

		three.controls.update();
		three.renderer.render(three.scene, three.camera);

		const now = Math.round(
			(animation.FPS * window.performance.now()) / 1000,
		);
		if (now === prevTick) return;

		prevTick = now;
		three.group.rotation.z += rotationSpeed.value;
	};

	return {
		three,
		setupThreeJS,
		updateRenderSize,
		updateCameraPosition,
		animate,
	};
}
