import type { TreeProps } from '../../types/environment';
import { useMemo } from 'react';

export function Tree({ position, rotation }: TreeProps) {
	// Generate stable random dimensions using memoization
	const dimensions = useMemo(() => {
		return {
			height: 10 + Math.random() * 20,
			width: 5 + Math.random() * 10,
		};
	}, []); // Empty dependency array means these values will be stable across rerenders

	return (
		<group position={position} rotation={rotation}>
			<mesh
				position={[0, 0, dimensions.height / 4]}
				rotation={[Math.PI / 2, 0, 0]}
				receiveShadow
				castShadow
			>
				<cylinderGeometry
					args={[
						dimensions.width / 6,
						dimensions.width / 4,
						dimensions.height / 2,
					]}
				/>
				<meshStandardMaterial color="#8B4513" envMapIntensity={0.2} />
			</mesh>

			<mesh
				position={[0, 0, dimensions.height / 1.5]}
				rotation={[Math.PI / 2, 0, 0]}
				receiveShadow
				castShadow
			>
				<coneGeometry
					args={[dimensions.width / 2, dimensions.height, 8]}
				/>
				<meshStandardMaterial color="#228B22" envMapIntensity={0.2} />
			</mesh>
		</group>
	);
}
