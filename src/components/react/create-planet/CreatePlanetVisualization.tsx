import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { CreatePlanetVisualizationProps } from './types';
import Planet from './Planet';

export default function CreatePlanetVisualization({
	radius,
	waterLevel,
	roughness,
	seed,
	atmosphere,
}: CreatePlanetVisualizationProps) {
	const [isLoading, setIsLoading] = useState(true);

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

	// Handle loading state
	const handleSceneLoad = () => {
		setIsLoading(false);
	};

	return (
		<div
			className="p-2 rounded border mb-5 position-relative"
			style={{ height: '600px' }}
		>
			{isLoading && (
				<div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center">
					<i className="fas fa-cog fa-spin mb-0 h1"></i>
				</div>
			)}
			<Canvas
				camera={{ position: [0, 0, cameraDistance], fov: 45 }}
				shadows
				onCreated={handleSceneLoad}
			>
				<ambientLight intensity={0.5} />
				<directionalLight
					position={[10, 10, 5]}
					intensity={2}
					castShadow
				/>
				<pointLight position={[-10, -10, -5]} intensity={0.5} />

				<Planet
					radius={radius}
					waterLevel={waterLevel}
					roughness={roughness}
					seed={seed}
					atmosphere={atmosphere}
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
