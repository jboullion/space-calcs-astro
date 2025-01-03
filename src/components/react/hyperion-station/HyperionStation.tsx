import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { Mesh } from 'three';

interface StationConfigFormProps {
	radius: number;
	length: number;
	onRadiusChange: (value: number) => void;
	onLengthChange: (value: number) => void;
}

const StationConfigForm: React.FC<StationConfigFormProps> = ({
	radius,
	length,
	onRadiusChange,
	onLengthChange,
}) => {
	return (
		<div className="bg-gray-800 p-4 rounded-lg mb-4">
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label htmlFor="radius" className="block text-white mb-2">
						Station Radius (meters)
					</label>
					<input
						type="range"
						id="radius"
						min="5"
						max="50"
						value={radius}
						onChange={(e) => onRadiusChange(Number(e.target.value))}
						className="w-full"
					/>
					<span className="text-white">{radius}m</span>
				</div>
				<div>
					<label htmlFor="length" className="block text-white mb-2">
						Station Length (meters)
					</label>
					<input
						type="range"
						id="length"
						min="10"
						max="100"
						value={length}
						onChange={(e) => onLengthChange(Number(e.target.value))}
						className="w-full"
					/>
					<span className="text-white">{length}m</span>
				</div>
			</div>
		</div>
	);
};

const CylinderStation: React.FC<{ radius: number; length: number }> = ({
	radius,
	length,
}) => {
	const meshRef = useRef<Mesh>(null);

	return (
		<mesh ref={meshRef} position={[0, 0, 0]}>
			<cylinderGeometry args={[radius, radius, length, 32, 1, true]} />
			<meshStandardMaterial
				color="#444444"
				metalness={0.8}
				roughness={0.2}
				side={2}
			/>
		</mesh>
	);
};

const Scene: React.FC<{ radius: number; length: number }> = ({
	radius,
	length,
}) => {
	return (
		<>
			{/* Single ambient light for basic illumination */}
			<ambientLight intensity={1} />

			{/* Add camera positioned at the station wall */}
			<PerspectiveCamera
				makeDefault
				position={[radius * 0.9, 0, 0]}
				fov={75}
			/>

			{/* Add orbit controls with restricted movement */}
			<OrbitControls
				enableZoom={true}
				enablePan={true}
				enableRotate={true}
				minDistance={1}
				maxDistance={radius * 0.95}
			/>

			{/* Add the space station */}
			<CylinderStation radius={radius} length={length} />
		</>
	);
};

const HyperionStation: React.FC = () => {
	const [radius, setRadius] = useState(10);
	const [length, setLength] = useState(30);

	return (
		<div className="w-full">
			<StationConfigForm
				radius={radius}
				length={length}
				onRadiusChange={setRadius}
				onLengthChange={setLength}
			/>
			<div className="h-[600px] w-full bg-black rounded-lg overflow-hidden">
				<Canvas>
					<Scene radius={radius} length={length} />
				</Canvas>
			</div>
		</div>
	);
};

export default HyperionStation;
