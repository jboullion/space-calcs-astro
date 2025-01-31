import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { AtmosphereProperties } from './types';

interface AtmosphereProps {
	radius: number;
	atmosphere: AtmosphereProperties;
	waterLevel: number;
}

export default function Atmosphere({
	radius,
	atmosphere,
	waterLevel,
}: AtmosphereProps) {
	const atmosphereRef = useRef<THREE.Mesh>(null);

	const visualRadius = Math.max(2, Math.log10(radius + 1) * 2);
	const atmosphereScale = 1 + Math.log10(atmosphere.pressure + 1) * 0.1;
	const atmosphereColor = new THREE.Color(
		atmosphere.customColor || '#88AAFF',
	);

	// Calculate opacity factor based on gas composition
	const opacityFactors = {
		n2: 0.1, // Nitrogen is mostly transparent
		o2: 0.1, // Oxygen is mostly transparent
		co2: 0.4, // CO2 contributes more to opacity
		ch4: 0.4, // Methane has some opacity
		h2o: 0.6, // Water vapor contributes significantly
		other: 0.8,
	};

	// Calculate weighted opacity based on composition
	const compositionOpacity = Object.entries(atmosphere.composition).reduce(
		(sum, [gas, percentage]) => {
			return (
				sum +
				(opacityFactors[gas as keyof typeof opacityFactors] *
					percentage) /
					100
			);
		},
		0,
	);

	// Calculate final opacity considering both pressure and composition
	const atmosphereOpacity = Math.min(
		1,
		atmosphere.pressure * 0.1 * compositionOpacity,
	);

	// Transmission now factors in composition
	const transmission = Number(
		(0.98 / (1 + atmosphere.pressure * 0.15 * compositionOpacity)).toFixed(
			3,
		),
	);

	return (
		<>
			{/* Inner atmosphere layer */}
			<mesh ref={atmosphereRef}>
				<sphereGeometry
					args={[visualRadius * atmosphereScale, 64, 64]}
				/>
				<meshPhysicalMaterial
					color={atmosphereColor}
					transparent={true}
					opacity={atmosphereOpacity}
					depthWrite={false}
					side={THREE.FrontSide}
					blending={THREE.NormalBlending}
					transmission={transmission}
					thickness={2}
					roughness={1}
					ior={1.1}
				/>
			</mesh>

			{/* Outer atmosphere glow */}
			<mesh>
				<sphereGeometry
					args={[visualRadius * (atmosphereScale + 0.05), 64, 64]}
				/>
				<meshPhysicalMaterial
					color={atmosphereColor}
					transparent={true}
					opacity={atmosphereOpacity * 0.5}
					depthWrite={false}
					side={THREE.BackSide}
					blending={THREE.AdditiveBlending}
					transmission={0.99}
					thickness={1}
					roughness={1}
					ior={1.0}
				/>
			</mesh>
		</>
	);
}
