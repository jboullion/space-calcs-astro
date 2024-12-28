import { ref, type ComputedRef } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { animation } from '../constants';

export function useThreeScene(
	canvasId: string,
	stationWidth: ComputedRef<number>,
	rotationSpeed: ComputedRef<number>,
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

	let prevTick = 0;
	let animationFrameId: number;

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

		// Camera
		const cameraDistance = stationWidth.value;
		three.camera = new THREE.PerspectiveCamera(
			45,
			three.canvas.getBoundingClientRect().width / 500,
			0.1,
			cameraDistance * 5,
		);

		three.camera.position.z = cameraDistance;

		// Controls
		three.controls = new OrbitControls(
			three.camera,
			three.renderer.domElement,
		);
		three.controls.maxDistance = cameraDistance * 4;
		three.controls.minDistance = cameraDistance / 2;

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
		three.renderer.setSize(width, height, false); // false to avoid setting style
		three.canvas.style.height = `${height}px`;
	};

	const animate = () => {
		if (!three.renderer || !three.controls) return;

		animationFrameId = requestAnimationFrame(animate);

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
		animate,
	};
}
