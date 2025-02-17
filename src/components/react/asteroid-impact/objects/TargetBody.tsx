import { useMemo } from 'react';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import Earth from './TargetBodyEarth';

export interface TargetBodyProps {
	diameter: number;
	type: 'planet' | 'asteroid';
	hasAtmosphere: boolean;
	position: number[];
	isEarth?: boolean;
}

export default function TargetBody({
	diameter,
	type,
	hasAtmosphere,
	position,
	isEarth = true, // Default to Earth for planets
}: TargetBodyProps) {
	// If this is Earth, use the Earth component
	if (type === 'planet' && isEarth) {
		return <Earth diameter={diameter} position={position} />;
	}

	// For other bodies, use the existing implementation
	const visualSize = useMemo(() => {
		return Math.max(0.1, Math.log10(diameter + 1));
	}, [diameter]);

	const bodyMaterial = useMemo(() => {
		if (type === 'planet') {
			return new THREE.MeshStandardMaterial({
				color: '#4B6F44',
				roughness: 0.7,
				metalness: 0.1,
			});
		} else {
			return new THREE.MeshStandardMaterial({
				color: '#8B7355',
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
