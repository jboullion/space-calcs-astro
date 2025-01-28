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
	const cloudsRef = useRef<THREE.Mesh>(null);
	const seed = atmosphere.cloudSeed || Math.floor(Math.random() * 1000000);

	// Generate cloud texture with larger formations
	const cloudTexture = useMemo(() => {
		const size = 1024;
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d')!;
		const imageData = ctx.createImageData(size, size);

		class Random {
			private seed: number;
			constructor(seed: number) {
				this.seed = seed;
			}
			next(): number {
				this.seed = (this.seed * 16807) % 2147483647;
				return (this.seed - 1) / 2147483646;
			}
		}

		const random = new Random(seed);

		// Generate base noise
		const noise = new Array(size * size).fill(0);
		const octaves = 6;
		const persistence = 0.5;

		for (let octave = 0; octave < octaves; octave++) {
			const frequency = Math.pow(2, octave);
			const amplitude = Math.pow(persistence, octave);

			for (let y = 0; y < size; y++) {
				for (let x = 0; x < size; x++) {
					const sampleX = (x * frequency) / size;
					const sampleY = (y * frequency) / size;

					// Simple value noise
					const value = random.next() * amplitude;
					const index = y * size + x;
					noise[index] += value;
				}
			}
		}

		// Normalize and apply contrast
		const contrast = 2;
		const brightness = 0.3;

		if (waterLevel >= 1) {
			for (let i = 0; i < size * size; i++) {
				let value = noise[i] / octaves;

				// Apply contrast and brightness
				value = (value - 0.5) * contrast + 0.5 + brightness;
				value = Math.max(0, Math.min(1, value));

				// Apply water level influence
				const cloudDensity = Math.min(1, (waterLevel / 100) * 2);
				value *= cloudDensity;

				// Sharp cutoff for cloud edges
				const threshold = 0.4;
				value = value > threshold ? value : 0;

				const pixelIndex = i * 4;
				imageData.data[pixelIndex] = 255; // R
				imageData.data[pixelIndex + 1] = 255; // G
				imageData.data[pixelIndex + 2] = 255; // B
				imageData.data[pixelIndex + 3] = value * 255; // A
			}
		}

		ctx.putImageData(imageData, 0, 0);
		const texture = new THREE.CanvasTexture(canvas);
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		return texture;
	}, [atmosphere.cloudSeed, waterLevel, seed]);

	// Rotate clouds slowly
	useFrame(({ clock }) => {
		if (cloudsRef.current) {
			cloudsRef.current.rotation.y = clock.getElapsedTime() * 0.02;
		}
	});

	const visualRadius = Math.max(2, Math.log10(radius + 1) * 2);
	const atmosphereScale = 1 + Math.log10(atmosphere.pressure + 1) * 0.1;
	const atmosphereOpacity = atmosphere.fullOpacity
		? Math.min(1, atmosphere.pressure * 0.2)
		: Math.min(0.5, atmosphere.pressure * 0.1);
	const atmosphereColor = new THREE.Color(
		atmosphere.customColor || '#88AAFF',
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

			{/* Cloud layer */}
			{waterLevel >= 1 && (
				<mesh ref={cloudsRef}>
					<sphereGeometry
						args={[
							visualRadius * (1 + atmosphereScale * 0.03),
							64,
							64,
						]}
					/>
					<meshBasicMaterial
						color="#ffffff"
						map={cloudTexture}
						transparent={true}
						opacity={1}
						depthWrite={true}
						side={THREE.FrontSide}
						alphaMap={cloudTexture}
						alphaTest={0.2}
					/>
				</mesh>
			)}
		</>
	);
}
