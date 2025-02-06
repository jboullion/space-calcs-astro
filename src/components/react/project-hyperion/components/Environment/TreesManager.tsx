import { useMemo, useRef } from 'react';
import { Vector3, Euler } from 'three';
import { Tree } from './Tree';
import type { TreesManagerProps } from '../../types/environment';

function generateTreePositions(
	count: number,
	stationRadius: number,
	stationLength: number,
	seed: number,
) {
	const positions: { position: Vector3; rotation: Euler }[] = [];
	const seededRandom = () => {
		seed = (seed * 16807) % 2147483647;
		return (seed - 1) / 2147483646;
	};

	for (let i = 0; i < count; i++) {
		const angle = (i / count) * Math.PI * 2;
		const z = (seededRandom() - 0.5) * stationLength;
		const y = (stationRadius - 1) * Math.cos(angle);
		const x = (stationRadius - 1) * Math.sin(angle);

		const yRotation = Math.atan2(-x, -y);
		const zRotation = -angle;
		const rotation = new Euler(-Math.PI / 2, yRotation, zRotation);

		positions.push({ position: new Vector3(x, y, z), rotation });
	}

	return positions;
}

export function TreesManager({
	stationRadius,
	stationLength,
}: TreesManagerProps) {
	const seedRef = useRef(123); // Stable seed for random generation
	const numTrees = Math.floor(stationRadius / 5 + stationLength / 5);

	const treeData = useMemo(
		() =>
			generateTreePositions(
				numTrees,
				stationRadius,
				stationLength,
				seedRef.current,
			),
		// Only regenerate if the number of trees changes
		[numTrees],
	);

	// Apply position scaling without regenerating trees
	const scaledTreeData = useMemo(() => {
		return treeData.map(({ position, rotation }) => {
			const scaledPos = position.clone();
			const scale =
				(stationRadius - 1) /
				Math.sqrt(
					scaledPos.x * scaledPos.x + scaledPos.y * scaledPos.y,
				);
			scaledPos.x *= scale;
			scaledPos.y *= scale;
			scaledPos.z =
				(scaledPos.z / Math.abs(scaledPos.z)) *
				(stationLength / 2) *
				(Math.abs(scaledPos.z) / (stationLength / 2));
			return { position: scaledPos, rotation };
		});
	}, [treeData, stationRadius, stationLength]);

	return (
		<>
			{scaledTreeData.map(({ position, rotation }, index) => (
				<Tree
					key={`tree-${index}`}
					position={position}
					rotation={rotation}
				/>
			))}
		</>
	);
}
