import React, { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetaryData {
	semiMajorAxis: number;
	orbitalPeriod: number;
	radius: number;
	color: string;
}

interface PlanetsData {
	[key: string]: PlanetaryData;
}

// Planetary data (semi-major axis in AU, orbital period in Earth years)
const PLANETARY_DATA: PlanetsData = {
	mercury: {
		semiMajorAxis: 0.387,
		orbitalPeriod: 0.24,
		radius: 0.383,
		color: '#A0522D',
	},
	venus: {
		semiMajorAxis: 0.723,
		orbitalPeriod: 0.615,
		radius: 0.949,
		color: '#DEB887',
	},
	earth: { semiMajorAxis: 1, orbitalPeriod: 1, radius: 1, color: '#4169E1' },
	mars: {
		semiMajorAxis: 1.524,
		orbitalPeriod: 1.88,
		radius: 0.532,
		color: '#CD5C5C',
	},
	jupiter: {
		semiMajorAxis: 5.203,
		orbitalPeriod: 11.86,
		radius: 11.21,
		color: '#DAA520',
	},
	saturn: {
		semiMajorAxis: 9.537,
		orbitalPeriod: 29.46,
		radius: 9.45,
		color: '#F4A460',
	},
};

// Scale factors to make visualization manageable
const ORBIT_SCALE = 20;
const PLANET_SCALE = 1;
const TIME_SCALE = 0.5; // Controls animation speed

interface PlanetProps {
	name: string;
	data: PlanetaryData;
	time: number;
}

const Planet: React.FC<PlanetProps> = ({ name, data, time }) => {
	const angle = (time / data.orbitalPeriod) * Math.PI * 2;
	const x = Math.cos(angle) * (data.semiMajorAxis * ORBIT_SCALE);
	const z = Math.sin(angle) * (data.semiMajorAxis * ORBIT_SCALE);

	return (
		<group position={[x, 0, z]}>
			<mesh>
				<sphereGeometry args={[data.radius * PLANET_SCALE, 32, 32]} />
				<meshStandardMaterial color={data.color} />
			</mesh>
		</group>
	);
};

interface OrbitProps {
	radius: number;
}

const Orbit: React.FC<OrbitProps> = ({ radius }) => {
	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]}>
			<ringGeometry args={[radius, radius + 0.1, 64]} />
			<meshBasicMaterial color="#666666" transparent opacity={0.3} />
		</mesh>
	);
};

const Sun: React.FC = () => {
	return (
		<mesh>
			<sphereGeometry args={[3, 32, 32]} />
			<meshBasicMaterial color="#FDB813" />
			<pointLight intensity={1.5} distance={1000} />
		</mesh>
	);
};

interface SolarSystemProps {
	initialDate?: Date;
}

const SolarSystem: React.FC<SolarSystemProps> = ({
	initialDate = new Date(),
}) => {
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [time, setTime] = useState<number>(0);

	useFrame((state, delta) => {
		if (isPlaying) {
			setTime((prev) => prev + delta * TIME_SCALE);
		}
	});

	return (
		<div className="h-screen w-full">
			<div className="absolute top-4 left-4 z-10">
				<button
					className="px-4 py-2 bg-blue-500 text-white rounded"
					onClick={() => setIsPlaying(!isPlaying)}
				>
					{isPlaying ? 'Pause' : 'Play'}
				</button>
			</div>
			<Canvas camera={{ position: [0, 50, 0], fov: 45 }}>
				<color attach="background" args={['#000000']} />
				<ambientLight intensity={0.1} />

				<Sun />

				{Object.entries(PLANETARY_DATA).map(([name, data]) => (
					<React.Fragment key={name}>
						<Orbit radius={data.semiMajorAxis * ORBIT_SCALE} />
						<Planet name={name} data={data} time={time} />
					</React.Fragment>
				))}

				<OrbitControls />
			</Canvas>
		</div>
	);
};

export default SolarSystem;
