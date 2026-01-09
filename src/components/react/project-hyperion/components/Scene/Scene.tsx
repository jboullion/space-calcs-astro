import { Player } from '../../components/Player/Player';
import { Station } from '../../components/Station/Station';
import { useEffect } from 'react';
import { useStationStore } from '../../hooks/useStationStore';
import { useThree } from '@react-three/fiber';
import type { SceneProps } from '../../types/scene';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { CameraType } from '../../types/camera';
import { OrbitCamera } from './OrbitCamera';
import { FreeCamera } from './FreeCamera';

export function Scene({ camera }: SceneProps) {
	const {
		radius,
		length,
		ambientLightIntensity,
		ambientLightColor,
		cameraFOV,
		cameraType,
	} = useStationStore();
	const { gl } = useThree();

	// Update camera FOV when it changes in the store
	useEffect(() => {
		if (camera) {
			camera.fov = cameraFOV;
			camera.updateProjectionMatrix();
		}
	}, [camera, cameraFOV]);

	// Configure camera for large scale environment
	useEffect(() => {
		if (camera && gl) {
			camera.near = 0.1;
			const maxDimension = Math.max(radius, length);
			camera.far = maxDimension * 2.5;
			camera.updateProjectionMatrix();

			gl.capabilities.logarithmicDepthBuffer = true;
			gl.setPixelRatio(window.devicePixelRatio);
			gl.outputColorSpace = 'srgb';
		}
	}, [camera, gl, radius, length]);

	return (
		<>
			{/* Ambient and hemisphere lights */}
			<ambientLight
				intensity={ambientLightIntensity}
				color={ambientLightColor}
			/>
			<hemisphereLight
				args={['#4466aa', '#000000', 0.2]}
				position={[0, 1, 0]}
			/>

			{/* Post-processing effects */}
			<EffectComposer>
				<Bloom
					intensity={1.5}
					luminanceThreshold={0.6}
					luminanceSmoothing={0.9}
					mipmapBlur
					radius={0.8}
				/>
			</EffectComposer>

			{/* Station */}
			<Station />

			{/* Camera Controls */}
			{cameraType === CameraType.ThirdPerson ? (
				<Player camera={camera} />
			) : cameraType === CameraType.FreeMove ? (
				<FreeCamera camera={camera} />
			) : (
				<OrbitCamera camera={camera} />
			)}
		</>
	);
}
