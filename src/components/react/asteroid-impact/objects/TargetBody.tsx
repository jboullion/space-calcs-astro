import { useMemo } from 'react';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

export interface TargetBodyProps {
	diameter: number;
	type: 'planet' | 'asteroid';
	hasAtmosphere: boolean;
	position: number[];
}

export default function TargetBody({
	diameter,
	type,
	hasAtmosphere,
	position,
}: TargetBodyProps) {
	// Scale the visual size logarithmically
	const visualSize = useMemo(() => {
		return Math.max(0.1, Math.log10(diameter + 1));
	}, [diameter]);

	// Create materials based on body type
	const bodyMaterial = useMemo(() => {
		if (type === 'planet') {
			return new THREE.MeshStandardMaterial({
				color: '#4B6F44', // Earth-like color
				roughness: 0.7,
				metalness: 0.1,
			});
		} else {
			return new THREE.MeshStandardMaterial({
				color: '#8B7355', // Asteroid-like color
				roughness: 0.9,
				metalness: 0.1,
			});
		}
	}, [type]);

	const atmosphereMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			color: '#ADD8E6',
			transparent: true,
			opacity: 0.2,
		});
	}, []);

	return (
		<group position={position as [number, number, number]}>
			<Sphere args={[visualSize, 32, 32]} material={bodyMaterial} />
			{hasAtmosphere && (
				<Sphere
					args={[visualSize * 1.1, 32, 32]}
					material={atmosphereMaterial}
				/>
			)}
		</group>
	);
}
