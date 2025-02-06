import { useMemo } from 'react';
import { Vector3, Euler } from 'three';
import { Hill } from './Hill';
import type { HillsManagerProps } from '../../types/environment';

function generateHillPositions(count: number) {
	const positions: { position: Vector3; rotation: Euler }[] = [];

	for (let i = 0; i < count; i++) {
		const angle = (i / count) * Math.PI * 2;
		// Store normalized positions that will be scaled later
		const x = Math.cos(angle);
		const y = Math.sin(angle);
		const rotation = new Euler(0, 0, angle + Math.PI / 2);

		positions.push({
			position: new Vector3(x, y, 0),
			rotation: rotation,
		});
	}
	return positions;
}

export function HillsManager({
	count,
	stationRadius,
	stationLength,
	hillHeight,
	hillRatio,
	hillColor,
}: HillsManagerProps) {
	const basePositions = useMemo(() => generateHillPositions(count), [count]);

	const scaledPositions = useMemo(() => {
		return basePositions.map(({ position, rotation }) => ({
			position: position.clone().multiplyScalar(stationRadius),
			rotation,
		}));
	}, [basePositions, stationRadius]);

	return (
		<>
			{scaledPositions.map(({ position, rotation }, index) => (
				<Hill
					key={`hill-${index}`}
					position={position}
					rotation={rotation}
					height={hillHeight}
					length={stationLength}
					color={hillColor}
					ratio={hillRatio}
				/>
			))}
		</>
	);
}
