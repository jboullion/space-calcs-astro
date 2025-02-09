import { useMemo } from 'react';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

export interface AsteroidProps {
	diameter: number;
	position: number[];
}

export default function Asteroid({ diameter, position }: AsteroidProps) {
	// Scale the visual size logarithmically to handle wide range of sizes
	const visualSize = useMemo(() => {
		return Math.max(0.1, Math.log10(diameter + 1));
	}, [diameter]);

	// Create a rough, rocky texture for the asteroid
	const asteroidMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			color: '#8B7355',
			roughness: 0.9,
			metalness: 0.1,
		});
	}, []);

	return (
		<group position={position as [number, number, number]}>
			<Sphere args={[visualSize, 32, 32]} material={asteroidMaterial} />
		</group>
	);
}
