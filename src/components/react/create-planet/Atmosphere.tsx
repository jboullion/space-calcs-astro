import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { AtmosphereProperties } from './types';

interface AtmosphereProps {
	radius: number;
	atmosphere: AtmosphereProperties;
}

export default function Atmosphere({ radius, atmosphere }: AtmosphereProps) {
	const atmosphereRef = useRef<THREE.Mesh>(null);
	const cloudsRef = useRef<THREE.Mesh>(null);

	// Generate cloud texture with larger formations
	const cloudTexture = useMemo(() => {
		const size = 1024; // Increased size for more detail
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d')!;
		const imageData = ctx.createImageData(size, size);

		// Create multiple layers of noise for more realistic clouds
		const createNoiseLayer = (scale: number, threshold: number) => {
			const noise = new Array(size * size).fill(0);

			// Generate base large-scale variation
			for (let y = 0; y < size; y += scale) {
				for (let x = 0; x < size; x += scale) {
					const value = Math.random();
					const baseIndex =
						Math.floor(y / scale) * Math.ceil(size / scale) +
						Math.floor(x / scale);
					noise[baseIndex] = value;
				}
			}

			// Interpolate values
			for (let y = 0; y < size; y++) {
				for (let x = 0; x < size; x++) {
					const x1 = Math.floor(x / scale) * scale;
					const y1 = Math.floor(y / scale) * scale;
					const x2 = Math.min(x1 + scale, size - 1);
					const y2 = Math.min(y1 + scale, size - 1);

					const valueX1Y1 =
						noise[
							Math.floor(y1 / scale) * Math.ceil(size / scale) +
								Math.floor(x1 / scale)
						];
					const valueX2Y1 =
						noise[
							Math.floor(y1 / scale) * Math.ceil(size / scale) +
								Math.floor(x2 / scale)
						];
					const valueX1Y2 =
						noise[
							Math.floor(y2 / scale) * Math.ceil(size / scale) +
								Math.floor(x1 / scale)
						];
					const valueX2Y2 =
						noise[
							Math.floor(y2 / scale) * Math.ceil(size / scale) +
								Math.floor(x2 / scale)
						];

					const fracX = (x - x1) / scale;
					const fracY = (y - y1) / scale;

					const value =
						valueX1Y1 * (1 - fracX) * (1 - fracY) +
						valueX2Y1 * fracX * (1 - fracY) +
						valueX1Y2 * (1 - fracX) * fracY +
						valueX2Y2 * fracX * fracY;

					const i = y * size + x;
					noise[i] = value > threshold ? value : 0;
				}
			}
			return noise;
		};

		// Create multiple layers of clouds with different scales
		const baseLayer = createNoiseLayer(64, 0.3); // Large formations
		const detailLayer = createNoiseLayer(32, 0.4); // Medium details
		const fineLayer = createNoiseLayer(16, 0.5); // Fine details

		// Combine layers and apply water content scaling
		const waterContent = atmosphere.composition.h2o / 100;
		const cloudCoverage = Math.min(1, waterContent * 5); // Scale water content to coverage

		for (let i = 0; i < size * size; i++) {
			const baseValue = baseLayer[i] * 0.6;
			const detailValue = detailLayer[i] * 0.3;
			const fineValue = fineLayer[i] * 0.1;

			const combined =
				(baseValue + detailValue + fineValue) * cloudCoverage;

			const pixelIndex = i * 4;
			imageData.data[pixelIndex] = 255; // R
			imageData.data[pixelIndex + 1] = 255; // G
			imageData.data[pixelIndex + 2] = 255; // B
			imageData.data[pixelIndex + 3] = Math.min(255, combined * 255); // A
		}

		ctx.putImageData(imageData, 0, 0);
		const texture = new THREE.CanvasTexture(canvas);
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		return texture;
	}, [atmosphere.composition.h2o]);

	// Rotate clouds slowly
	useFrame(({ clock }) => {
		if (cloudsRef.current) {
			cloudsRef.current.rotation.y = clock.getElapsedTime() * 0.02; // Slowed down rotation
		}
	});

	// Calculate atmosphere properties
	const atmosphereScale = 1 + Math.log10(atmosphere.pressure + 1) * 0.1;
	const atmosphereOpacity = Math.min(0.5, atmosphere.pressure * 0.1);
	const visualRadius = Math.max(2, Math.log10(radius + 1) * 2);

	return (
		<>
			{/* Inner atmosphere layer */}
			<mesh ref={atmosphereRef}>
				<sphereGeometry
					args={[visualRadius * atmosphereScale, 64, 64]}
				/>
				<meshPhysicalMaterial
					color={getAtmosphereColor(atmosphere)}
					transparent={true}
					opacity={atmosphereOpacity}
					depthWrite={false}
					side={THREE.FrontSide}
					blending={THREE.NormalBlending}
					transmission={0.95 - atmosphereOpacity * 0.5}
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
					color={getAtmosphereColor(atmosphere)}
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

			{/* Cloud layer */}
			{atmosphere.composition.h2o > 0 && (
				<mesh ref={cloudsRef}>
					<sphereGeometry
						args={[
							visualRadius * (1 + atmosphereScale * 0.02),
							64,
							64,
						]}
					/>
					<meshPhysicalMaterial
						map={cloudTexture}
						transparent={true}
						opacity={0.8}
						depthWrite={false}
						side={THREE.FrontSide}
						blending={THREE.NormalBlending}
						transmission={0.6}
						thickness={0.5}
						roughness={1}
						ior={1.0}
						alphaMap={cloudTexture}
					/>
				</mesh>
			)}
		</>
	);
}

// Helper function to calculate atmosphere color
function getAtmosphereColor(atmosphere: AtmosphereProperties) {
	const n2Color = new THREE.Color(0.2, 0.3, 0.8); // Nitrogen scatters blue
	const o2Color = new THREE.Color(0.2, 0.5, 1.0); // Oxygen scatters blue more strongly
	const co2Color = new THREE.Color(0.6, 0.4, 0.2); // CO2 scatters more red/brown
	const h2oColor = new THREE.Color(0.3, 0.3, 0.3); // Water vapor adds white/gray

	const color = new THREE.Color();
	color.add(n2Color.multiplyScalar(atmosphere.composition.n2 / 100));
	color.add(o2Color.multiplyScalar(atmosphere.composition.o2 / 100));
	color.add(co2Color.multiplyScalar(atmosphere.composition.co2 / 100));
	color.add(h2oColor.multiplyScalar(atmosphere.composition.h2o / 100));

	return color;
}
