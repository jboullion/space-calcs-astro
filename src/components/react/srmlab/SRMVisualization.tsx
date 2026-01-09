import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSRM } from './SRMContext';
import { useState } from 'react';
import type { GrainSegment } from './types';

interface GrainSegmentMeshProps {
	segment: GrainSegment;
	position: [number, number, number];
}

function GrainSegmentMesh({ segment, position }: GrainSegmentMeshProps) {
	const color = segment.type === 'finocyl' ? '#d4a574' : '#c9a573';

	return (
		<group position={position} rotation={[Math.PI / 2, 0, 0]}>
			{/* Outer cylinder */}
			<mesh castShadow>
				<cylinderGeometry
					args={[
						segment.outerRadius,
						segment.outerRadius,
						segment.length,
						32,
					]}
				/>
				<meshStandardMaterial
					color={color}
					opacity={0.85}
					transparent
				/>
			</mesh>

			{/* Inner port - only render if not Finocyl (fins extend from core) */}
			{segment.innerRadius > 0 && segment.type !== 'finocyl' && (
				<mesh>
					<cylinderGeometry
						args={[
							segment.innerRadius,
							segment.innerRadius,
							segment.length + 0.001,
							32,
						]}
					/>
					<meshStandardMaterial
						color="#1a1a1a"
						opacity={0.4}
						transparent
					/>
				</mesh>
			)}

			{/* Finocyl fins - render as solid slots from outer to inner */}
			{segment.type === 'finocyl' &&
				segment.finCount &&
				segment.finDepth && (
					<>
						{Array.from({ length: segment.finCount }).map(
							(_, i) => {
								const angle =
									(i * 2 * Math.PI) / (segment.finCount || 1);
								// Position fins to start at inner radius
								const finRadius =
									segment.innerRadius -
									(segment.finDepth || 0) / 2;
								return (
									<mesh
										key={i}
										position={[
											Math.cos(angle) * finRadius,
											0,
											Math.sin(angle) * finRadius,
										]}
										rotation={[0, angle, 0]}
									>
										<boxGeometry
											args={[
												segment.finThickness || 0.004,
												segment.length,
												segment.finDepth || 0.006,
											]}
										/>
										<meshStandardMaterial
											color={color}
											opacity={0.85}
											transparent
										/>
									</mesh>
								);
							},
						)}
					</>
				)}

			{/* End caps if not inhibited */}
			{!segment.inhibitEnds && (
				<>
					<mesh position={[0, segment.length / 2, 0]}>
						<ringGeometry
							args={[
								segment.innerRadius,
								segment.outerRadius,
								32,
							]}
						/>
						<meshStandardMaterial color={color} />
					</mesh>
					<mesh
						position={[0, -segment.length / 2, 0]}
						rotation={[Math.PI, 0, 0]}
					>
						<ringGeometry
							args={[
								segment.innerRadius,
								segment.outerRadius,
								32,
							]}
						/>
						<meshStandardMaterial color={color} />
					</mesh>
				</>
			)}
		</group>
	);
}
				

export default function SRMVisualization() {
	const { config } = useSRM();
	const [isLoading, setIsLoading] = useState(true);

	// Calculate positions for grain stack with gaps to prevent Z-fighting
	const GAP = 0.002; // 2mm gap between segments
	let zOffset = 0;
	const segments = config.grainStack.map((segment, index) => {
		const pos: [number, number, number] = [0, 0, zOffset];
		zOffset += segment.length + (index < config.grainStack.length - 1 ? GAP : 0);
		return { segment, position: pos };
	});

	// Calculate separator positions (between segments)
	const separators: number[] = [];
	let sepOffset = 0;
	config.grainStack.forEach((segment, index) => {
		sepOffset += segment.length;
		if (index < config.grainStack.length - 1) {
			separators.push(sepOffset + GAP / 2);
			sepOffset += GAP;
		}
	});

	const totalLength = zOffset || 0.1;

	return (
		<div
			className="p-2 rounded border mb-5 position-relative"
			style={{ height: '500px' }}
		>
			

			{config.grainStack.length === 0 ? (
				<div className="d-flex align-items-center justify-content-center h-100">
					<div className="text-center text-muted">
						<i className="fas fa-rocket fa-3x mb-3"></i>
						<p className="mb-0">
							Add grain segments to see 3D preview
						</p>
					</div>
				</div>
			) : (
				<Canvas
					camera={{
						position: [
							totalLength * 1.5,
							totalLength * 1.5,
							totalLength * 1.5,
						],
						fov: 50,
					near: 0.001,
					far: 1000,
				}}
				gl={{
					logarithmicDepthBuffer: true,
					antialias: true,
				}}
				onCreated={() => setIsLoading(false)}
			>
				<ambientLight intensity={0.6} />
				<directionalLight
					position={[10, 10, 5]}
					intensity={1}
					castShadow
				/>
				<pointLight position={[-10, -10, -5]} intensity={0.3} />

				{/* Grain segments */}
				{segments.map(({ segment, position }) => (
					<GrainSegmentMesh
						key={segment.id}
						segment={segment}
						position={position}
					/>
				))}



				

					<OrbitControls
						enableZoom={true}
						enablePan={true}
						autoRotate={false}
					/>
				</Canvas>
			)}

			<div className="mt-2">
				<p className="mb-0">
					<small className="text-muted">
						<i className="fas fa-info-circle me-1"></i>
						Use mouse to rotate/zoom.
						{config.grainStack.length > 0 &&
							` Total length: ${(totalLength * 1000).toFixed(1)}mm`}
					</small>
				</p>
			</div>
		</div>
	);
}
