import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type {
	Asteroid,
	TargetBody,
	ImpactParameters,
} from '../AsteroidImpactContext';

export interface ImpactEffectsProps {
	asteroid: Asteroid;
	targetBody: TargetBody;
	impactParams: ImpactParameters;
	position: number[];
	isPlaying: boolean;
	setIsPlaying: (playing: boolean) => void;
	animationProgress: number;
	setAnimationProgress: (progress: number) => void;
}

export default function ImpactEffects({
	asteroid,
	targetBody,
	impactParams,
	position,
	isPlaying,
	setIsPlaying,
	animationProgress,
	setAnimationProgress,
}: ImpactEffectsProps) {
	// Calculate impact effects size
	const effectSize = useMemo(() => {
		const mass =
			(4 / 3) *
			Math.PI *
			Math.pow(asteroid.diameter / 2, 3) *
			asteroid.density;
		const energy = 0.5 * mass * Math.pow(impactParams.velocity, 2);
		const craterSize = Math.pow(energy, 1 / 3) * 0.1;
		return Math.max(0.5, Math.log10(craterSize + 1) * 2);
	}, [asteroid, impactParams]);

	// Calculate impact point on planet's surface
	const impactPoint = useMemo(() => {
		const targetRadius = Math.max(0.1, Math.log10(targetBody.diameter + 1));
		return [-targetRadius, 0, 0]; // Relative to planet center
	}, [targetBody.diameter]);

	// Create materials
	const fireballMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			color: '#FF4500',
			emissive: '#FF8C00',
			emissiveIntensity: 2,
			transparent: true,
			opacity: 0.8,
		});
	}, []);

	const craterMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			color: '#4A4A4A',
			roughness: 1,
			metalness: 0,
		});
	}, []);

	// Handle animation frame updates
	useFrame((state, delta) => {
		if (isPlaying && animationProgress < 1) {
			setAnimationProgress(Math.min(animationProgress + delta / 2, 1)); // 2 second animation
			if (animationProgress + delta / 2 >= 1) {
				setIsPlaying(false);
			}
		}
	});

	// Only show effects after asteroid reaches target
	const showEffects = isPlaying && animationProgress >= 0.98; // Show effects just before full contact
	const effectProgress = showEffects ? (animationProgress - 0.98) * 50 : 0; // Compress effect animation
	const currentEffectSize = effectSize * Math.pow(effectProgress, 0.5);
	const fireballOpacity =
		effectProgress < 0.8 ? 0.8 : 0.8 * (1 - (effectProgress - 0.8) / 0.2);

	// Position effects at the impact point
	const effectPosition = [
		position[0] + impactPoint[0],
		position[1] + impactPoint[1],
		position[2] + impactPoint[2],
	];

	return (
		<group position={effectPosition as [number, number, number]}>
			{showEffects && (
				<>
					{/* Expanding fireball */}
					<mesh>
						<sphereGeometry args={[currentEffectSize, 32, 32]} />
						<meshStandardMaterial
							{...fireballMaterial}
							opacity={fireballOpacity}
						/>
					</mesh>

					{/* Crater */}
					<mesh rotation={[0, 0, 0]}>
						<ringGeometry args={[0, currentEffectSize * 0.8, 32]} />
						<meshStandardMaterial
							{...craterMaterial}
							side={THREE.DoubleSide}
						/>
					</mesh>
				</>
			)}
		</group>
	);
}
