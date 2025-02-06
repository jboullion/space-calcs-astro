import type {
	CoreLightingProps,
	LightSphereProps,
	StationCoreLightingProps,
} from '../../types/station';
import { useEffect, useRef } from 'react';
import { PointLight } from 'three';
import { useStationStore } from '../../hooks/useStationStore';

export function CoreCylinder({
	stationRadius,
	stationLength,
}: CoreLightingProps) {
	const coreRadius = stationRadius / 100;

	return (
		<mesh rotation={[Math.PI / 2, 0, 0]}>
			<cylinderGeometry
				args={[coreRadius, coreRadius, stationLength, 16]}
			/>
			<meshStandardMaterial
				color="#444444"
				metalness={0.8}
				roughness={0.2}
			/>
		</mesh>
	);
}

export function LightSphere({
	stationRadius,
	stationLength,
	position = [0, 0, 0],
	color = '#ffff80',
	intensity = 1,
	size = 20,
	falloff = 1,
}: LightSphereProps) {
	const lightRef = useRef<PointLight>(null);

	// Configure shadow camera after the light is created
	useEffect(() => {
		if (lightRef.current) {
			const maxDimension = Math.max(stationRadius, stationLength);

			const light = lightRef.current;
			light.shadow.mapSize.width = 2048;
			light.shadow.mapSize.height = 2048;
			light.shadow.camera.near = maxDimension / 2;
			light.shadow.camera.far = maxDimension * 2;
			light.shadow.bias = -0.001;
			light.shadow.radius = 1;
			light.shadow.normalBias = 0.02;
		}
	}, [stationLength]);

	return (
		<group position={position}>
			{/* Glowing sphere */}
			<mesh>
				<sphereGeometry args={[size, 32, 32]} />
				<meshStandardMaterial
					color={color}
					emissive={color}
					emissiveIntensity={intensity * 2}
					toneMapped={false}
					envMapIntensity={0.2}
				/>
			</mesh>

			{/* Main point light */}
			{/* <pointLight
        color={color}
        intensity={intensity * 500000}
        distance={stationRadius * 2}
        decay={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.001}
        shadow-radius={10}
        shadow-blurSamples={20}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[
            -stationRadius,
            stationRadius,
            stationRadius,
            -stationRadius,
            0.1,
            stationLength,
          ]}
        />
      </pointLight> */}

			<pointLight
				ref={lightRef}
				color={color}
				intensity={intensity * 100000}
				distance={stationRadius * 2}
				decay={falloff}
				castShadow
			/>

			{/* <pointLight
        color={color}
        intensity={intensity * 100000}
        distance={stationRadius * 2.5}
        decay={2}
        castShadow
        shadow-mapSize={[4096, 4096]} // Increased resolution
        shadow-bias={-0.0001} // Reduced bias for better detail
        shadow-radius={4} // Reduced for sharper shadows
        shadow-blurSamples={30} // Increased samples for smoother edges
        shadow-normalBias={0.02} // Added normal bias to prevent artifacts
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[
            -stationRadius * 1.5,
            stationRadius * 1.5,
            stationRadius * 1.5,
            -stationRadius * 1.5,
            0.1,
            stationLength * 1.5,
          ]}
        />
      </pointLight> */}

			{/* Secondary fill lights */}
			{/* <pointLight
        color={color}
        intensity={intensity * 20000}
        distance={stationRadius}
        decay={3}
        position={[0, 0, stationLength / 4]}
      />
      <pointLight
        color={color}
        intensity={intensity * 20000}
        distance={stationRadius}
        decay={3}
        position={[0, 0, -stationLength / 4]}
      /> */}
		</group>
	);
}

export function StationCoreLighting({
	stationRadius,
	stationLength,
}: StationCoreLightingProps) {
	const { lightPosition, lightColor, lightIntensity, lightFalloff } =
		useStationStore();

	return (
		<group>
			<CoreCylinder
				stationRadius={stationRadius}
				stationLength={stationLength}
			/>

			<LightSphere
				stationRadius={stationRadius}
				stationLength={stationLength}
				position={[0, 0, lightPosition]}
				color={lightColor}
				intensity={lightIntensity}
				size={stationRadius / 25}
				falloff={lightFalloff}
			/>
		</group>
	);
}
