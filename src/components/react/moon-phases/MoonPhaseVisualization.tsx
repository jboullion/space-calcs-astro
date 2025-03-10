import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import { useMoonPhase } from './MoonPhaseContext';
import * as THREE from 'three';

// Moon component
const Moon = ({ position }: { position: [number, number, number] }) => {
	const moonRef = useRef<THREE.Mesh>(null);
	const moonTexture = useTexture('/textures/2k_moon.jpg');

	useFrame(() => {
		if (moonRef.current) {
			// Add subtle rotation for the moon
			moonRef.current.rotation.y += 0.001;
		}
	});

	return (
		<mesh ref={moonRef} position={position}>
			<sphereGeometry args={[1, 32, 32]} />
			<meshStandardMaterial map={moonTexture} />
		</mesh>
	);
};

// Earth component
const Earth = () => {
	const earthRef = useRef<THREE.Mesh>(null);
	const earthTexture = useTexture('/textures/2k_earth_daymap.jpg');
	const cloudsTexture = useTexture('/textures/2k_earth_clouds.jpg');

	useFrame(() => {
		if (earthRef.current) {
			// Rotation of Earth
			earthRef.current.rotation.y += 0.002;
		}
	});

	return (
		<group>
			{/* Earth sphere */}
			<mesh ref={earthRef}>
				<sphereGeometry args={[2, 32, 32]} />
				<meshStandardMaterial map={earthTexture} />
			</mesh>

			{/* Cloud layer */}
			<mesh scale={[1.01, 1.01, 1.01]}>
				<sphereGeometry args={[2, 32, 32]} />
				<meshStandardMaterial
					map={cloudsTexture}
					transparent={true}
					opacity={0.4}
					depthWrite={false}
				/>
			</mesh>
		</group>
	);
};

// Sun component
const Sun = ({ show }: { show: boolean }) => {
	if (!show) return null;

	return (
		<mesh position={[30, 0, 0]}>
			<sphereGeometry args={[5, 32, 32]} />
			<meshBasicMaterial color="#FDB813" />
			<pointLight intensity={1.5} distance={100} decay={2} />
		</mesh>
	);
};

// Main system component with animation
const MoonEarthSystem = () => {
	const { moonPosition, showSun } = useMoonPhase();
	const groupRef = useRef<THREE.Group>(null);

	// Convert moonPosition to the format required by the Moon component
	const moonPos: [number, number, number] = [
		moonPosition.x,
		moonPosition.y,
		moonPosition.z,
	];

	return (
		<group ref={groupRef}>
			<Earth />
			<Moon position={moonPos} />
			<Sun show={showSun} />
		</group>
	);
};

// Main visualization component
export default function MoonPhaseVisualization() {
	const [isLoading, setIsLoading] = useState(true);

	const handleSceneLoad = () => {
		setIsLoading(false);
	};

	return (
		<div
			className="p-2 rounded border mb-5 position-relative"
			style={{ height: '600px' }}
		>
			{isLoading && (
				<div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center">
					<i className="fas fa-cog fa-spin mb-0 h1"></i>
				</div>
			)}
			<Canvas
				camera={{ position: [0, 10, 15], fov: 45 }}
				shadows
				onCreated={handleSceneLoad}
			>
				<ambientLight intensity={0.2} />

				<MoonEarthSystem />

				<OrbitControls
					enableZoom={true}
					enablePan={true}
					enableRotate={true}
					autoRotate={false}
					minDistance={7}
					maxDistance={30}
				/>
			</Canvas>
		</div>
	);
}
