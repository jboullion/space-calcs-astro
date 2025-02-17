import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

export interface EarthProps {
	diameter: number;
	position: number[];
	rotationSpeed?: number;
}

export default function Earth({
	diameter,
	position,
	rotationSpeed = 0.001,
}: EarthProps) {
	const earthRef = useRef();
	const cloudsRef = useRef();

	// Scale the visual size logarithmically
	const visualSize = useMemo(() => {
		return Math.max(0.1, Math.log10(diameter + 1));
	}, [diameter]);

	// Create Earth's materials with textures
	const earthMaterial = useMemo(() => {
		const loader = new THREE.TextureLoader();
		const earthTexture = loader.load('/textures/2k_earth_daymap.jpg');
		earthTexture.wrapS = earthTexture.wrapT = THREE.RepeatWrapping;

		return new THREE.MeshStandardMaterial({
			map: earthTexture,
			roughness: 0.7,
			metalness: 0.1,
		});
	}, []);

	// Create clouds material with texture and transparency
	const cloudsMaterial = useMemo(() => {
		const loader = new THREE.TextureLoader();
		const cloudsTexture = loader.load('/textures/2k_earth_clouds.jpg');
		cloudsTexture.wrapS = cloudsTexture.wrapT = THREE.RepeatWrapping;

		return new THREE.MeshStandardMaterial({
			map: cloudsTexture,
			transparent: true,
			opacity: 0.4,
			depthWrite: false,
		});
	}, []);

	// Create atmosphere material
	const atmosphereMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			color: '#ADD8E6',
			transparent: true,
			opacity: 0.2,
			side: THREE.BackSide,
		});
	}, []);

	// Animate rotation
	useFrame((state, delta) => {
		if (earthRef.current) {
			earthRef.current.rotation.y += rotationSpeed;
		}
		if (cloudsRef.current) {
			cloudsRef.current.rotation.y += rotationSpeed * 1.1; // Clouds rotate slightly faster
		}
	});

	return (
		<group position={position as [number, number, number]}>
			{/* Earth sphere */}
			<mesh ref={earthRef}>
				<sphereGeometry args={[visualSize, 64, 64]} />
				<primitive object={earthMaterial} attach="material" />
			</mesh>

			{/* Clouds layer */}
			<mesh ref={cloudsRef}>
				<sphereGeometry args={[visualSize * 1.02, 64, 64]} />
				<primitive object={cloudsMaterial} attach="material" />
			</mesh>

			{/* Atmosphere glow */}
			<mesh>
				<sphereGeometry args={[visualSize * 1.1, 64, 64]} />
				<primitive object={atmosphereMaterial} attach="material" />
			</mesh>
		</group>
	);
}
