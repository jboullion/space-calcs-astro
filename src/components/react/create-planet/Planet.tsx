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

	// Calculate cloud properties based on atmosphere
	const clouds = atmosphere.clouds || {
		enabled: true,
		density: 0.8,
		coverage: 0.6,
		altitude: 0.2,
		speed: 1.0,
	};

	// Adjust cloud color based on atmospheric composition and temperature
	const getCloudColor = () => {
		if (atmosphere.temperature > 500) return '#FFE4B5'; // Yellowish for hot planets
		if (atmosphere.composition.co2 > 50) return '#E3D4B0'; // Slight yellow-brown for CO2-rich
		return '#FFFFFF'; // Default white clouds
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
							cloudSeed={atmosphere.cloudSeed || seed}
							cloudScale={1.0 + clouds.altitude * 5}
							cloudDensity={
								clouds.density *
								Math.min(1, atmosphere.pressure * 0.5)
							}
							cloudColor={clouds.color || '#FFFFFF'} // Use cloud color from properties
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
