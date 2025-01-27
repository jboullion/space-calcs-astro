import { useFrame } from '@react-three/fiber';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { generatePlanetTextures } from './functions';
import type { PlanetProps } from './types';

export default function Planet({
	radius,
	waterLevel,
	roughness,
	seed,
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
