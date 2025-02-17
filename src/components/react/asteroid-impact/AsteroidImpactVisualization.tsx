import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useImpact } from './AsteroidImpactContext';
import Asteroid from './objects/Asteroid';
import TargetBody from './objects/TargetBody';
import ImpactEffects from './objects/ImpactEffects';

export default function AsteroidImpactVisualization() {
	const [isLoading, setIsLoading] = useState(true);
	const [isPlaying, setIsPlaying] = useState(false);
	const [animationProgress, setAnimationProgress] = useState(0);
	const { asteroid, targetBody, impactParams } = useImpact();

	// Calculate appropriate camera distance based on the larger of the two bodies
	const cameraDistance = useMemo(() => {
		const largerDiameter = Math.max(asteroid.diameter, targetBody.diameter);
		const visualDiameter = Math.max(2, Math.log10(largerDiameter + 1) * 2);
		const fov = 45;
		const halfFov = (fov / 2) * (Math.PI / 180);
		const distance = (visualDiameter * 1.5) / Math.tan(halfFov);
		return Math.max(20, distance);
	}, [asteroid.diameter, targetBody.diameter]);

	// Calculate initial and final asteroid positions
	const positions = useMemo(() => {
		const angleRad = (impactParams.angle * Math.PI) / 180;
		const startDistance = cameraDistance * 0.5;
		const startPos = [
			Math.sin(angleRad) * startDistance,
			Math.cos(angleRad) * startDistance,
			0,
		];
		const endPos = [0, 0, 0]; // Target at center
		return { startPos, endPos };
	}, [impactParams.angle, cameraDistance]);

	// Calculate current asteroid position based on animation progress
	const currentAsteroidPosition = useMemo(() => {
		if (!isPlaying) return positions.startPos;

		const progress = Math.min(animationProgress * 2, 1); // First half of animation
		return positions.startPos.map(
			(start, i) => start + (positions.endPos[i] - start) * progress,
		);
	}, [positions, isPlaying, animationProgress]);

	useEffect(() => {
		// Add play button
		const playButton = document.createElement('button');
		const updateButtonState = () => {
			if (isPlaying) {
				playButton.textContent = 'Impacting...';
				playButton.disabled = true;
			} else {
				playButton.textContent =
					animationProgress >= 1 ? 'Replay Impact' : 'Play Impact';
				playButton.disabled = false;
			}
		};

		playButton.className = 'btn btn-primary';
		playButton.onclick = () => {
			setIsPlaying(true);
			setAnimationProgress(0);
		};

		// Initial button state
		updateButtonState();

		// Update button state when animation state changes
		const observer = new MutationObserver(() => {
			updateButtonState();
		});

		const container = document.querySelector('#asteroid-impact__results');
		if (container) {
			container.appendChild(playButton);
			observer.observe(playButton, { attributes: true, childList: true });

			return () => {
				observer.disconnect();
				container.removeChild(playButton);
			};
		}
	}, [isPlaying, animationProgress]);

	const handleSceneLoad = () => {
		setIsLoading(false);
	};

	return (
		<div
			className="rounded border mb-3 position-relative"
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
					position={currentAsteroidPosition}
				/>

				<TargetBody
					diameter={targetBody.diameter}
					type={targetBody.type}
					hasAtmosphere={targetBody.hasAtmosphere}
					position={[0, 0, 0]}
				/>

				<ImpactEffects
					asteroid={asteroid}
					targetBody={targetBody}
					impactParams={impactParams}
					position={[0, 0, 0]}
					isPlaying={isPlaying}
					setIsPlaying={setIsPlaying}
					animationProgress={animationProgress}
					setAnimationProgress={setAnimationProgress}
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
