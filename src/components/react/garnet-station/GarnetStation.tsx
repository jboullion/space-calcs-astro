import { OrbitControls } from '@react-three/drei';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { MODULE_SIZE_METERS, type GridCoord } from './constants';
import { createRhombicDodecahedronGeometry } from './geometry';
import {
	coordKey,
	getFaceIndexFromHitDirection,
	getModuleSpacing,
	getNeighborCoordForFace,
	gridToWorld,
	isOrigin,
	isValidBCC,
} from './grid';

type BuilderMode = 'build' | 'delete';

function ModuleMesh({
	coord,
	spacing,
	mode,
	isHoveredDelete,
	onBuild,
	onDelete,
	onPreview,
	onPreviewClear,
	onHover,
	onHoverClear,
	geometry,
}: {
	coord: GridCoord;
	spacing: number;
	mode: BuilderMode;
	isHoveredDelete: boolean;
	onBuild: (coord: GridCoord) => void;
	onDelete: (coord: GridCoord) => void;
	onPreview: (coord: GridCoord | null) => void;
	onPreviewClear: () => void;
	onHover: (coord: GridCoord) => void;
	onHoverClear: () => void;
	geometry: THREE.BufferGeometry;
}) {
	const worldPosition = useMemo(() => gridToWorld(coord, spacing), [coord, spacing]);

	const getNeighborFromEvent = (event: ThreeEvent<MouseEvent>): GridCoord => {
		const hitDirection = event.point.clone().sub(worldPosition).normalize();
		const faceIndex = getFaceIndexFromHitDirection(hitDirection);
		return getNeighborCoordForFace(coord, faceIndex);
	};

	const handleClick = (event: ThreeEvent<MouseEvent>) => {
		event.stopPropagation();
		if (mode === 'delete') {
			onDelete(coord);
			return;
		}

		const neighborCoord = getNeighborFromEvent(event);
		onBuild(neighborCoord);
	};

	const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
		event.stopPropagation();

		if (mode === 'delete') {
			onHover(coord);
			return;
		}

		if (mode !== 'build') {
			onPreview(null);
			return;
		}

		const hitDirection = event.point.clone().sub(worldPosition).normalize();
		const faceIndex = getFaceIndexFromHitDirection(hitDirection);
		const neighborCoord = getNeighborCoordForFace(coord, faceIndex);
		onPreview(neighborCoord);
	};

	return (
		<mesh
			position={worldPosition}
			geometry={geometry}
			onClick={handleClick}
			onPointerMove={handlePointerMove}
			onPointerOut={() => {
				onPreviewClear();
				onHoverClear();
			}}
		>
			<meshStandardMaterial
				color={isHoveredDelete ? '#f0a3a3' : '#93a2b8'}
				emissive={isHoveredDelete ? '#3b0f0f' : '#000000'}
				emissiveIntensity={isHoveredDelete ? 0.45 : 0}
				metalness={0.2}
				roughness={0.7}
			/>
		</mesh>
	);
}

export default function GarnetStation() {
	const [modules, setModules] = useState<GridCoord[]>([{ x: 0, y: 0, z: 0 }]);
	const [mode, setMode] = useState<BuilderMode>('build');
	const [previewCoord, setPreviewCoord] = useState<GridCoord | null>(null);
	const [hoveredDeleteKey, setHoveredDeleteKey] = useState<string | null>(null);
	const spacing = useMemo(() => getModuleSpacing(), []);

	const moduleGeometry = useMemo(
		() => createRhombicDodecahedronGeometry(MODULE_SIZE_METERS),
		[],
	);

	const occupied = useMemo(() => {
		const keys = new Set<string>();
		for (const coord of modules) {
			keys.add(coordKey(coord));
		}
		return keys;
	}, [modules]);

	const canPlacePreview =
		previewCoord !== null &&
		isValidBCC(previewCoord) &&
		!occupied.has(coordKey(previewCoord));

	const handleBuild = (coord: GridCoord) => {
		if (!isValidBCC(coord)) {
			return;
		}

		const key = coordKey(coord);
		if (occupied.has(key)) {
			return;
		}

		setModules((previous) => [...previous, coord]);
	};

	const handleDelete = (coord: GridCoord) => {
		if (isOrigin(coord)) {
			return;
		}

		setModules((previous) => previous.filter((value) => coordKey(value) !== coordKey(coord)));
	};

	const handleReset = () => {
		setModules([{ x: 0, y: 0, z: 0 }]);
		setPreviewCoord(null);
		setHoveredDeleteKey(null);
	};

	return (
		<div className="row calculator">
			<div className="col-xl-4 col-lg-5">
				<div className="card p-3 mb-3">
					<h5 className="mb-3">Garnet Station Controls</h5>
					<div className="btn-group mb-3" role="group" aria-label="Builder mode">
						<button
							type="button"
							className={`btn btn-${mode === 'build' ? 'primary' : 'outline-primary'}`}
							onClick={() => setMode('build')}
						>
							Build
						</button>
						<button
							type="button"
							className={`btn btn-${mode === 'delete' ? 'danger' : 'outline-danger'}`}
							onClick={() => setMode('delete')}
						>
							Delete
						</button>
					</div>

					<button type="button" className="btn btn-outline-light w-100 mb-3" onClick={handleReset}>
						Reset Station
					</button>

					<ul className="mb-0">
						<li>Modules: {modules.length}</li>
						<li>Left-click a module face to attach in Build mode</li>
						<li>Left-click a module to remove in Delete mode</li>
						<li>The core module at origin cannot be deleted</li>
					</ul>
				</div>
			</div>

			<div className="col-xl-8 col-lg-7">
				<div className="card p-2" style={{ height: 720 }}>
					<Canvas camera={{ position: [22, 18, 22], fov: 50 }}>
						<color attach="background" args={['#0c1119']} />
						<ambientLight intensity={0.5} />
						<directionalLight position={[16, 20, 10]} intensity={1.2} />

						<gridHelper args={[80, 40, '#3b475f', '#2a3446']} />
						<axesHelper args={[6]} />

						{modules.map((coord) => (
							<ModuleMesh
								key={coordKey(coord)}
								coord={coord}
								spacing={spacing}
								mode={mode}
								isHoveredDelete={
									mode === 'delete' && hoveredDeleteKey === coordKey(coord)
								}
								onBuild={handleBuild}
								onDelete={handleDelete}
								onPreview={setPreviewCoord}
								onPreviewClear={() => setPreviewCoord(null)}
								onHover={(value) => setHoveredDeleteKey(coordKey(value))}
								onHoverClear={() => setHoveredDeleteKey(null)}
								geometry={moduleGeometry}
							/>
						))}

						{canPlacePreview && previewCoord && (
							<mesh position={gridToWorld(previewCoord, spacing)} geometry={moduleGeometry}>
								<meshStandardMaterial
									color="#7e9f70"
									opacity={0.4}
									transparent
									depthWrite={false}
								/>
							</mesh>
						)}

						<OrbitControls makeDefault enableDamping />
					</Canvas>
				</div>
			</div>
		</div>
	);
}
