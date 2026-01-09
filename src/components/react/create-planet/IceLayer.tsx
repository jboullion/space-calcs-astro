import { useRef } from 'react';
import * as THREE from 'three';

interface IceLayerProps {
	maxSurfaceHeight: number;
	waterLevel: number;
	temperature: number;
}

export default function IceLayer({
	maxSurfaceHeight,
	waterLevel,
	temperature,
}: IceLayerProps) {
	// Position ice layer slightly above water but below clouds
	const iceRadius = maxSurfaceHeight * 1.01;

	return (
		<mesh>
			<sphereGeometry args={[iceRadius, 192, 192]} />
			<meshStandardMaterial
				color="#FFFFFF"
				transparent={true}
				opacity={0.5}
			/>
		</mesh>
	);
}
