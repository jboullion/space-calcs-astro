import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useImpact } from './AsteroidImpactContext';
import Asteroid from './objects/Asteroid';
import TargetBody from './objects/TargetBody';
import ImpactEffects from './objects/ImpactEffects';

export default function AsteroidImpactVisualization() {
	const [isLoading, setIsLoading] = useState(true);
	const { asteroid, targetBody, impactParams } = useImpact();

	// Calculate appropriate camera distance based on the larger of the two bodies
	const cameraDistance = useMemo(() => {
		const largerDiameter = Math.max(asteroid.diameter, targetBody.diameter);
		const visualDiameter = Math.max(2, Math.log10(largerDiameter + 1) * 2);

		// Use basic trigonometry to calculate required distance
		// We want the scene to take up about 75% of the view height
		const fov = 45; // degrees
		const halfFov = (fov / 2) * (Math.PI / 180); // convert to radians
		const distance = (visualDiameter * 1.5) / Math.tan(halfFov);
		return Math.max(20, distance); // Ensure minimum distance of 20
	}, [asteroid.diameter, targetBody.diameter]);

	// Calculate relative positions based on impact parameters
	const positions = useMemo(() => {
		// Convert impact angle to radians
		const angleRad = (impactParams.angle * Math.PI) / 180;

		// Position asteroid and target for visualization
		const asteroidPos = [
			Math.sin(angleRad) * cameraDistance * 0.5,
			Math.cos(angleRad) * cameraDistance * 0.5,
			0,
		];
		const targetPos = [0, 0, 0]; // Target at center

		return { asteroidPos, targetPos };
	}, [impactParams.angle, cameraDistance]);

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

				<Asteroid
					diameter={asteroid.diameter}
					position={positions.asteroidPos}
				/>

				<TargetBody
					diameter={targetBody.diameter}
					type={targetBody.type}
					hasAtmosphere={targetBody.hasAtmosphere}
					position={positions.targetPos}
				/>

				<ImpactEffects
					asteroid={asteroid}
					targetBody={targetBody}
					impactParams={impactParams}
					position={positions.targetPos}
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
