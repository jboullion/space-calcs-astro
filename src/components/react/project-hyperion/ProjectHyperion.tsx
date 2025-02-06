import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { Scene } from './components/Scene/Scene';
import TabbedStationControls from './components/UI/TabbedStationControls';
import FullscreenButton from './components/UI/FullscreenButton';

export default function ProjectHyperion() {
	const camera = useMemo(() => {
		const fov = 60;
		const aspect = window.innerWidth / window.innerHeight;
		const near = 0.1;
		const far = 1000;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.set(5, 5, 5);
		return camera;
	}, []);

	return (
		<div
			className="app mb-5"
			style={{ width: '100%', height: '700px', position: 'relative' }}
		>
			<Canvas
				shadows
				camera={camera}
				gl={{
					antialias: true,
					logarithmicDepthBuffer: true,
				}}
			>
				<Scene camera={camera} />
			</Canvas>
			<TabbedStationControls />
			<FullscreenButton />
		</div>
	);
}
