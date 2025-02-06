import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { generatePlanetTextures } from './functions';
import type { PlanetProps } from './types';
import Atmosphere from './Atmosphere';
import CloudLayer from './CloudLayer';

export default function Planet({
	radius,
	waterLevel,
	roughness,
	seed,
	atmosphere,
}: PlanetProps) {
	const planetRef = useRef<THREE.Mesh>(null);
	const waterRef = useRef<THREE.Mesh>(null);

	// Generate textures with the current seed
	const textures = useMemo(() => {
		const maps = generatePlanetTextures(512, roughness, seed);
		Object.values(maps).forEach((texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		});
		return maps;
	}, [roughness, seed]);

	const visualRadius = Math.max(2, Math.log10(radius + 1) * 2);
	const waterRadius = visualRadius * (1 + waterLevel * 0.001);
	const maxSurfaceHeight = visualRadius * (1 + roughness * 0.04); // 0.3 matches the displacementScale in the planet material
	console.log({ waterRadius, maxSurfaceHeight });
	const effectiveSurfaceRadius = Math.max(waterRadius, maxSurfaceHeight);

	// Calculate cloud properties based on atmosphere
	const clouds = atmosphere.clouds || {
		enabled: true,
		density: 0.8,
		coverage: 0.6,
		altitude: 0.2,
		speed: 1.0,
	};

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
					<sphereGeometry args={[waterRadius, 192, 192]} />
					<meshPhysicalMaterial
						color="#006994"
						transparent={true}
						opacity={Math.max(
							0,
							0.6 / (1 + atmosphere.pressure * 0.2),
						)}
						roughness={0.1}
						metalness={0.1}
						clearcoat={1.0}
						clearcoatRoughness={0.1}
						ior={1.333}
						transmission={Math.max(
							0.1,
							0.5 / (1 + atmosphere.pressure * 0.2),
						)}
						thickness={1}
					/>
				</mesh>
			)}

			{/* Cloud and Atmosphere layers */}
			{atmosphere?.pressure > 0 && (
				<>
					{/* Only show clouds if we have enough atmosphere and water vapor */}
					{clouds.enabled && atmosphere.composition.h2o > 0 && (
						<CloudLayer
							radius={radius}
							effectiveSurfaceRadius={effectiveSurfaceRadius}
							cloudSeed={atmosphere.cloudSeed || seed}
							cloudAltitude={clouds.altitude}
							cloudDensity={
								clouds.density *
								Math.min(1, atmosphere.pressure * 0.5)
							}
							cloudColor={clouds.color || '#FFFFFF'}
							rotationSpeed={
								clouds.speed *
								Math.min(0.2, atmosphere.pressure * 0.02)
							}
						/>
					)}
					<Atmosphere
						radius={radius}
						atmosphere={atmosphere}
						waterLevel={waterLevel}
					/>
				</>
			)}
		</>
	);
}
