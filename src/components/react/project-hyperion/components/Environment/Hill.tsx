import { useStationStore } from '../../hooks/useStationStore';
import type { HillProps } from '../../types/environment';
import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, DoubleSide } from 'three';

function createTrapezoidGeometry(
	baseWidth: number,
	topWidth: number,
	height: number,
	depth: number,
) {
	const halfBaseWidth = baseWidth / 2;
	const halfTopWidth = topWidth / 2;
	const halfDepth = depth / 2;

	const vertices = new Float32Array([
		// Bottom face
		-halfBaseWidth,
		0,
		-halfDepth,
		halfBaseWidth,
		0,
		-halfDepth,
		halfBaseWidth,
		0,
		halfDepth,
		-halfBaseWidth,
		0,
		halfDepth,

		// Top face
		-halfTopWidth,
		height,
		-halfDepth,
		halfTopWidth,
		height,
		-halfDepth,
		halfTopWidth,
		height,
		halfDepth,
		-halfTopWidth,
		height,
		halfDepth,
	]);

	const indices = [
		// Bottom
		0, 1, 2, 0, 2, 3,
		// Top
		4, 5, 6, 4, 6, 7,
		// Front
		0, 1, 5, 0, 5, 4,
		// Back
		2, 3, 7, 2, 7, 6,
		// Left
		0, 3, 7, 0, 7, 4,
		// Right
		1, 2, 6, 1, 6, 5,
	];

	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	return geometry;
}

export function Hill({
	position,
	rotation,
	height,
	length,
	color,
	ratio,
}: HillProps) {
	const baseWidth = height * 2;
	const topWidth = baseWidth * ratio;
	const geometry = useMemo(
		() => createTrapezoidGeometry(baseWidth, topWidth, height, length),
		[baseWidth, topWidth, height, length],
	);

	const { showWireframe, wireframeColor, wireframeOpacity } =
		useStationStore();

	const wireframeGeometry = useMemo(
		() => createTrapezoidGeometry(baseWidth, topWidth, height, length),
		[baseWidth, topWidth, height, length],
	);

	return (
		<>
			<mesh position={position} rotation={rotation}>
				<primitive object={geometry} />
				<meshStandardMaterial
					color={color}
					side={DoubleSide}
					envMapIntensity={0.2}
				/>
			</mesh>

			{showWireframe && (
				<mesh position={position} rotation={rotation}>
					<primitive object={wireframeGeometry} />
					<meshBasicMaterial
						color={wireframeColor}
						wireframe={true}
						transparent={true}
						opacity={wireframeOpacity}
					/>
				</mesh>
			)}
		</>
	);
}
