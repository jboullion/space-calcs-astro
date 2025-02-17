import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { determineWaterPhase, generatePlanetTextures } from './functions';
import type { PlanetProps } from './types';
import Atmosphere from './Atmosphere';
import CloudLayer from './CloudLayer';
import IceLayer from './IceLayer';

export default function Planet({
	radius,
	waterLevel,
	roughness,
	seed,
	atmosphere,
	surfaceColors,
	surfaceTemp,
}: PlanetProps) {
	const planetRef = useRef<THREE.Mesh>(null);
	const waterRef = useRef<THREE.Mesh>(null);

	// Generate textures with the current seed
	const textures = useMemo(() => {
		const maps = generatePlanetTextures(
			512,
			roughness,
			surfaceColors,
			seed,
		);
		Object.values(maps).forEach((texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		});
		return maps;
	}, [roughness, seed, surfaceColors]);

	// Calculate cloud properties based on atmosphere
	const clouds = atmosphere?.clouds || {
		enabled: true,
		density: 0.8,
		coverage: 0.6,
		altitude: 0.2,
		speed: 1.0,
		color: '#FFFFFF',
		cloudSeed: Math.floor(Math.random() * 1000000),
	};

	const planetDimensions = useMemo(() => {
		const visualRadius = Math.max(2, Math.log10(radius + 1) * 2);
		const waterRadius = visualRadius * (1 + waterLevel * 0.001);
		const maxSurfaceHeight = visualRadius * (1 + roughness * 0.04);
		const effectiveSurfaceRadius = Math.max(waterRadius, maxSurfaceHeight);
		const iceRadius = waterRadius * 1.002; // Ice layer slightly above water
		const cloudRadius = effectiveSurfaceRadius * 1.02; // Clouds above ice

		return {
			visualRadius,
			waterRadius,
			maxSurfaceHeight,
			effectiveSurfaceRadius,
			iceRadius,
			cloudRadius,
		};
	}, [radius, waterLevel, roughness]);

	const isFrozen = useMemo(() => {
		return surfaceTemp < 273.15 && waterLevel > 0;
	}, [surfaceTemp, waterLevel]);

	return (
		<>
			{/* Planet surface */}
			<mesh ref={planetRef}>
				<sphereGeometry
					args={[planetDimensions.visualRadius, 192, 192]}
				/>
				<meshStandardMaterial
					map={textures.colorMap}
					normalMap={textures.normalMap}
					normalScale={new THREE.Vector2(0.5, 0.5)}
					displacementMap={textures.heightMap}
					displacementScale={0.3}
					roughness={0.8}
					metalness={0.1}
				/>
			</mesh>

			{/* Water and ice layers */}
			{waterLevel > 0 && (
				<>
					{/* Original water layer */}
					<mesh ref={waterRef}>
						<sphereGeometry
							args={[planetDimensions.waterRadius, 192, 192]}
						/>
						<meshPhysicalMaterial
							color="#006994"
							transparent={true}
							opacity={Math.max(
								0,
								0.6 / (1 + (atmosphere?.pressure || 0) * 0.2),
							)}
							roughness={0.1}
							metalness={0.1}
							clearcoat={1.0}
							clearcoatRoughness={0.1}
							ior={1.333}
							transmission={Math.max(
								0.1,
								0.5 / (1 + (atmosphere?.pressure || 0) * 0.2),
							)}
							thickness={1}
						/>
					</mesh>

					{isFrozen && (
						<IceLayer
							maxSurfaceHeight={planetDimensions.maxSurfaceHeight}
							waterLevel={waterLevel}
							temperature={surfaceTemp}
						/>
					)}
				</>
			)}

			{/* Cloud and Atmosphere layers */}
			{atmosphere?.pressure && atmosphere.pressure > 0 && (
				<>
					{/* Only show clouds if we have enough atmosphere and water vapor */}
					{clouds.enabled && atmosphere.composition.h2o > 0 && (
						<>
							<CloudLayer
								key={`cloud-layer-${isFrozen}`}
								radius={radius}
								effectiveSurfaceRadius={
									planetDimensions.effectiveSurfaceRadius
								}
								cloudSeed={clouds.cloudSeed}
								cloudDensity={clouds.density}
								cloudColor={clouds?.color || '#FFFFFF'}
								rotationSpeed={clouds.speed}
								layerType="puffy"
							/>

							{/* <CloudLayer
								radius={radius}
								effectiveSurfaceRadius={effectiveSurfaceRadius}
								cloudSeed={clouds.cloudSeed}
								cloudDensity={clouds.density * 0.25}
								cloudColor={clouds.color || '#FFFFFF'}
								rotationSpeed={clouds.speed * 0.5}
								layerType="stratus"
								stratusDetail={5.0}
							/> */}
						</>
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
