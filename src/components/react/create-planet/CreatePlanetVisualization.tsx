import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetProps {
	radius: number;
	waterLevel: number;
	roughness: number;
}

function generatePlanetTextures(size: number, roughness: number) {
	// Helper function to create a canvas
	const createCanvas = () => {
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		return canvas;
	};

	// Create canvases for different texture maps
	const heightCanvas = createCanvas();
	const normalCanvas = createCanvas();
	const colorCanvas = createCanvas();

	const heightCtx = heightCanvas.getContext('2d')!;
	const normalCtx = normalCanvas.getContext('2d')!;
	const colorCtx = colorCanvas.getContext('2d')!;

	const heightData = heightCtx.createImageData(size, size);
	const normalData = normalCtx.createImageData(size, size);
	const colorData = colorCtx.createImageData(size, size);

	// Generate base terrain noise
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const phi = (y / size) * Math.PI;
			const theta = (x / size) * 2 * Math.PI;

			// Use multiple frequency octaves for more natural terrain
			const nx = Math.sin(phi) * Math.cos(theta);
			const ny = Math.sin(phi) * Math.sin(theta);
			const nz = Math.cos(phi);

			let height = 0;
			let frequency = 1;
			let amplitude = 1;
			const octaves = 4;

			for (let o = 0; o < octaves; o++) {
				height +=
					(Math.cos(nx * frequency * 6 + ny * frequency * 5) +
						Math.sin(ny * frequency * 4 + nz * frequency * 5) +
						Math.cos(nz * frequency * 5 + nx * frequency * 4)) *
					amplitude;
				frequency *= 2;
				amplitude *= 0.5;
			}

			height = ((height / octaves) * 0.5 + 0.5) * roughness;

			// Calculate normal map
			const i = (y * size + x) * 4;

			// Height map
			heightData.data[i] = height * 255;
			heightData.data[i + 1] = height * 255;
			heightData.data[i + 2] = height * 255;
			heightData.data[i + 3] = 255;

			// Color map - vary between different terrain colors based on height
			const baseColor = {
				r: 139, // Base brown
				g: 69,
				b: 19,
			};

			const mountainColor = {
				r: 169,
				g: 169,
				b: 169,
			};

			const lowlandColor = {
				r: 160,
				g: 82,
				b: 45,
			};

			// Interpolate between colors based on height
			const color =
				height < 0.4
					? lowlandColor
					: height > 0.7
					? mountainColor
					: baseColor;

			colorData.data[i] = color.r;
			colorData.data[i + 1] = color.g;
			colorData.data[i + 2] = color.b;
			colorData.data[i + 3] = 255;

			// Normal map calculation
			const s = 1 / size;
			const hu = heightData.data[(y * size + ((x + 1) % size)) * 4] / 255;
			const hd =
				heightData.data[(y * size + ((x - 1 + size) % size)) * 4] / 255;
			const hr = heightData.data[(((y + 1) % size) * size + x) * 4] / 255;
			const hl =
				heightData.data[(((y - 1 + size) % size) * size + x) * 4] / 255;

			const normal = new THREE.Vector3(
				(hu - hd) * roughness * 2,
				(hr - hl) * roughness * 2,
				1,
			).normalize();

			normalData.data[i] = (normal.x * 0.5 + 0.5) * 255;
			normalData.data[i + 1] = (normal.y * 0.5 + 0.5) * 255;
			normalData.data[i + 2] = normal.z * 255;
			normalData.data[i + 3] = 255;
		}
	}

	heightCtx.putImageData(heightData, 0, 0);
	normalCtx.putImageData(normalData, 0, 0);
	colorCtx.putImageData(colorData, 0, 0);

	return {
		heightMap: new THREE.CanvasTexture(heightCanvas),
		normalMap: new THREE.CanvasTexture(normalCanvas),
		colorMap: new THREE.CanvasTexture(colorCanvas),
	};
}

function Planet({ radius, waterLevel, roughness }: PlanetProps) {
	const planetRef = useRef<THREE.Mesh>(null);
	const waterRef = useRef<THREE.Mesh>(null);

	// Generate textures
	const textures = useMemo(() => {
		const maps = generatePlanetTextures(512, roughness);
		Object.values(maps).forEach((texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		});
		return maps;
	}, [roughness]);

	// Rotation animation
	useFrame((state, delta) => {
		if (planetRef.current) {
			planetRef.current.rotation.y += delta * 0.1;
		}
	});

	const visualRadius = Math.max(2, Math.log10(radius + 1) * 2);

	return (
		<>
			{/* Planet surface */}
			<mesh ref={planetRef}>
				<sphereGeometry args={[visualRadius, 192, 192]} />
				<meshStandardMaterial
					map={textures.colorMap}
					normalMap={textures.normalMap}
					normalScale={new THREE.Vector2(1, 1)}
					displacementMap={textures.heightMap}
					displacementScale={0.3}
					roughness={0.8}
					metalness={0.1}
				/>
			</mesh>

			{/* Water layer */}
			{waterLevel > 0 && (
				<mesh ref={waterRef}>
					<sphereGeometry
						args={[
							visualRadius * (1 + waterLevel * 0.001),
							192,
							192,
						]}
					/>
					<meshPhysicalMaterial
						color="#006994"
						transparent={true}
						opacity={0.6}
						roughness={0.1}
						metalness={0.1}
						clearcoat={1.0}
						clearcoatRoughness={0.1}
						ior={1.333}
						transmission={0.5}
						thickness={1}
					/>
				</mesh>
			)}
		</>
	);
}

interface CreatePlanetVisualizationProps {
	radius: number;
	waterLevel: number;
	roughness: number;
}

export default function CreatePlanetVisualization({
	radius,
	waterLevel,
	roughness,
}: CreatePlanetVisualizationProps) {
	// Calculate camera distance based on planet radius to ensure it's always in view
	const cameraDistance = useMemo(() => {
		const visualRadius = Math.max(2, Math.log10(radius + 1) * 2);
		// Use basic trigonometry to calculate required distance
		// We want the planet to take up about 75% of the view height
		const fov = 45; // degrees
		const halfFov = (fov / 2) * (Math.PI / 180); // convert to radians
		const distance = (visualRadius * 1.5) / Math.tan(halfFov);
		return Math.max(20, distance); // Ensure minimum distance of 20
	}, [radius]);

	return (
		<div className="p-2 rounded border mb-5" style={{ height: '600px' }}>
			<Canvas
				camera={{ position: [0, 0, cameraDistance], fov: 45 }}
				shadows
			>
				<ambientLight intensity={0.3} />
				<directionalLight
					position={[10, 10, 5]}
					intensity={1.5}
					castShadow
				/>
				<pointLight position={[-10, -10, -5]} intensity={0.5} />

				<Planet
					radius={radius}
					waterLevel={waterLevel}
					roughness={roughness}
				/>

				<OrbitControls
					enableZoom={true}
					enablePan={true}
					enableRotate={true}
					autoRotate={false}
					autoRotateSpeed={0.5}
					minDistance={cameraDistance * 0.5}
					maxDistance={cameraDistance * 2}
				/>
			</Canvas>
		</div>
	);
}
