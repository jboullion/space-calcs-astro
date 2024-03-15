/**
 * Chat GPT Starter composable
 */
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

interface ThreeOptions {
	width: number;
	height: number;
}

export default function useThreeJS(
	options: ThreeOptions = {
		width: window.innerWidth,
		height: window.innerHeight,
	},
) {
	const container = ref<HTMLDivElement | null>(null);
	const renderer = ref<THREE.WebGLRenderer | null>(null);
	const scene = ref<THREE.Scene | null>(null);
	const camera = ref<THREE.PerspectiveCamera | null>(null);

	const animation = {
		prevTick: 0,
		complete: false,
		FPS: 24,
	};

	onMounted(() => {
		// Initialize Three.js components
		init(options);
		// Render the scene
		animate();
		// Listen to resize events
		window.addEventListener('resize', onResize);
	});

	onUnmounted(() => {
		// Clean up when component is unmounted
		if (renderer.value) {
			renderer.value.dispose();
		}
		window.removeEventListener('resize', onResize);
	});

	function init(options: ThreeOptions) {
		// Create renderer
		renderer.value = new THREE.WebGLRenderer();
		renderer.value.setSize(options.width, options.height);
		container.value!.appendChild(renderer.value.domElement);

		// Create scene
		scene.value = new THREE.Scene();

		// Create camera
		const fov = 75;
		const aspect = options.width / options.height;
		const near = 0.1;
		const far = 1000;
		camera.value = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.value.position.z = 5;

		// Create and add objects to the scene
		const geometry = new THREE.BoxGeometry();
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		const cube = new THREE.Mesh(geometry, material);
		scene.value.add(cube);
	}

	function animate() {
		requestAnimationFrame(animate);
		// Update any animations or other dynamic components here

		const now = Math.round(
			(animation.FPS * window.performance.now()) / 1000,
		);

		if (now == animation.prevTick) return;
		animation.prevTick = now;

		if (renderer.value && scene.value && camera.value) {
			renderer.value.render(scene.value, camera.value);
		}
	}

	// Resize handler
	function onResize() {
		if (renderer.value && camera.value) {
			const width = container.value!.clientWidth;
			const height = container.value!.clientHeight;
			renderer.value.setSize(width, height);
			camera.value.aspect = width / height;
			camera.value.updateProjectionMatrix();
		}
	}

	return { container };
}

/**
 * Old code of mine from the transfer-window component to create a composable for Three.js
 */

// import { throttle } from '../../../utils/utils';
// import { onMounted, onUnmounted, ref } from 'vue';
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import type { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// const loading = ref(true);
// const textureDir = '/textures/';

// const three = {
// 	canvas: null as HTMLElement | HTMLCanvasElement | null,
// 	renderer: null as THREE.WebGLRenderer | null,
// 	scene: new THREE.Scene(),
// 	labelRenderer: null as CSS2DRenderer | null,
// 	renderOrder: 0,
// 	camera: new THREE.PerspectiveCamera(),
// 	controls: null as OrbitControls | null,
// 	// stats: null, // used for debugging
// 	// gui: null, // used for debugging
// 	// raycaster: null,
// 	// mouse: null,
// 	// minMovement: null as THREE.Vector3 | null,
// 	// maxMovement: null as THREE.Vector3 | null,
// };

// const debouncedResize = throttle(updateRenderSize, 32);

// function updateRenderSize() {
// 	if (!three.canvas) return;
// 	if (!three.renderer) return;

// 	const width = three.canvas.getBoundingClientRect().width;
// 	const height = width * 0.75;

// 	// Update aspect ratio
// 	three.camera.aspect = width / height;

// 	// Update the camera's projection matrix
// 	three.camera.updateProjectionMatrix();

// 	three.renderer.setSize(width, height);
// 	three.canvas.style.paddingTop = `0px`;
// }

// function setupThreeJS() {
// 	three.scene = new THREE.Scene();

// 	// Renderer
// 	three.renderer = new THREE.WebGLRenderer({
// 		antialias: true,
// 		logarithmicDepthBuffer: true,
// 	}); // { alpha: true }
// 	three.canvas = document.getElementById('transfer-window-canvas');

// 	if (!three.canvas) return;

// 	three.canvas.appendChild(three.renderer.domElement);

// 	updateRenderSize();
// 	setupCamera();

// 	// three.labelRenderer = new CSS2DRenderer();

// 	// three.labelRenderer.setSize(width, height);
// 	// three.labelRenderer.domElement.style.position = 'absolute';
// 	// three.labelRenderer.domElement.style.top = '0px';
// 	// three.labelRenderer.domElement.style.pointerEvents = 'none';
// 	// three.canvas.appendChild(three.labelRenderer.domElement);

// 	// Lights
// 	three.scene.add(new THREE.AmbientLight(0x404040));

// 	// TODO: Possibly create a point light for the sun
// 	//const light = new THREE.DirectionalLight(0xffffff, 0.5);
// 	//three.scene.add(light);

// 	// // GUI
// 	// this.three.gui = new dat.GUI( { autoPlace: false } );
// 	// this.three.canvas.appendChild(this.three.gui.domElement);
// }

// function setupCamera() {
// 	if (!three.renderer) return;

// 	// Camera
// 	const cameraPositionDistance = AUtoDistance * 2.5;
// 	const cameraZoomDistance = AUtoDistance * 100;

// 	let rendererSize = new THREE.Vector2();
// 	three.renderer.getSize(rendererSize);
// 	three.camera = new THREE.PerspectiveCamera(
// 		45,
// 		rendererSize.width / rendererSize.height,
// 		0.1,
// 		cameraZoomDistance * 2,
// 	);

// 	three.camera.position.z = cameraPositionDistance;
// 	three.camera.position.y -= cameraPositionDistance;
// 	three.camera.lookAt(0, 0, 0);

// 	// this.three.controls.enableZoom = false;

// 	// Controls
// 	three.controls = new OrbitControls(three.camera, three.renderer.domElement);
// 	// three.controls.enableDamping = true;
// 	// three.controls.dampingFactor = 0.05;
// 	three.controls.maxDistance = cameraZoomDistance;
// 	three.controls.minDistance = 100;
// }

// export function useResize() {
//     onMounted(() => {
//         window.addEventListener('resize', debouncedResize);
//     });

//     onUnmounted(() => {
//         window.removeEventListener('resize', debouncedResize);
//     });
// }
