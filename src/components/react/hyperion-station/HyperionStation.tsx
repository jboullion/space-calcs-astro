import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

const BasicStation = () => {
	// Reference for the mesh to allow animations later
	const meshRef = useRef();

	return (
		<mesh ref={meshRef} position={[0, 0, 0]}>
			{/* Core module - cylindrical shape */}
			<cylinderGeometry args={[1, 1, 4, 32]} />
			<meshStandardMaterial
				color="#888888"
				metalness={0.8}
				roughness={0.2}
			/>
		</mesh>
	);
};

const HyperionStation = () => {
	return (
		<div className="w-full h-96">
			<Canvas>
				{/* Setup lighting */}
				<ambientLight intensity={0.5} />
				<pointLight position={[10, 10, 10]} intensity={1} />

				{/* Add camera */}
				<PerspectiveCamera makeDefault position={[0, 2, 10]} />

				{/* Add orbit controls for navigation */}
				<OrbitControls
					enableZoom={true}
					enablePan={true}
					enableRotate={true}
				/>

				{/* Add a grid helper for reference */}
				<gridHelper args={[20, 20]} />

				{/* Add the space station */}
				<BasicStation />
			</Canvas>
		</div>
	);
};

export default HyperionStation;
