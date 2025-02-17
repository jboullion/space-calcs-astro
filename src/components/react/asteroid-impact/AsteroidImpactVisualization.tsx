import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useImpact } from './AsteroidImpactContext';
import Asteroid from './objects/Asteroid';
import TargetBody from './objects/TargetBody';
import ImpactEffects from './objects/ImpactEffects';

export default function AsteroidImpactVisualization() {
	const [isLoading, setIsLoading] = useState(true);
	const [isPlaying, setIsPlaying] = useState(false);
	const [animationProgress, setAnimationProgress] = useState(0);
	const { asteroid, targetBody, impactParams } = useImpact();

	// Calculate appropriate scale for bodies based on their sizes
	const visualScales = useMemo(() => {
		const largerDiameter = Math.max(asteroid.diameter, targetBody.diameter);
		const visualScale = Math.max(2, Math.log10(largerDiameter + 1) * 2);
		return {
			camera: visualScale * 4, // Increased camera distance for wider view
			spacing: visualScale * 1.5, // Reduced spacing between bodies
		};
	}, [asteroid.diameter, targetBody.diameter]);

	// Calculate positions for asteroid and target body
	const positions = useMemo(() => {
		const spacing = visualScales.spacing;
		return {
			asteroid: [-spacing, 0, 0], // Left side
			target: [spacing, 0, 0], // Right side
			impact: [0, 0, 0], // Center for impact
		};
	}, [visualScales.spacing]);

	// Calculate current asteroid position based on animation progress
	const currentAsteroidPosition = useMemo(() => {
		if (!isPlaying) return positions.asteroid;

		// Calculate the target point on the planet's surface
		const targetRadius = Math.max(0.1, Math.log10(targetBody.diameter + 1));
		const impactPoint = [
			positions.target[0] - targetRadius, // X coordinate just at planet's surface
			positions.target[1], // Same Y
			positions.target[2], // Same Z
		];

		return positions.asteroid.map(
			(start, i) => start + (impactPoint[i] - start) * animationProgress,
		);
	}, [positions, isPlaying, animationProgress, targetBody.diameter]);

	useEffect(() => {
		// Add play button
		const playButton = document.createElement('button');
		const updateButtonState = () => {
			if (isPlaying) {
				playButton.textContent = 'Impacting...';
				playButton.disabled = true;
			} else {
				playButton.textContent = 'Play Impact';
				if (animationProgress >= 1) {
					playButton.textContent = 'Replay Impact';
				}
				playButton.disabled = false;
			}
		};

		playButton.className = 'btn btn-primary';
		playButton.onclick = () => {
			setIsPlaying(true);
			setAnimationProgress(0);
		};

		updateButtonState();

		const observer = new MutationObserver(updateButtonState);
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
				camera={{
					position: [0, 0, visualScales.camera],
					fov: 50,
					near: 0.1,
					far: 1000,
				}}
				shadows
				onCreated={handleSceneLoad}
			>
				<ambientLight intensity={0.5} />
				<directionalLight
					position={[10, 0, 0]}
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
					position={positions.target}
				/>

				<ImpactEffects
					asteroid={asteroid}
					targetBody={targetBody}
					impactParams={impactParams}
					position={positions.impact}
					isPlaying={isPlaying}
					setIsPlaying={setIsPlaying}
					animationProgress={animationProgress}
					setAnimationProgress={setAnimationProgress}
				/>
			</Canvas>
		</div>
	);
}
