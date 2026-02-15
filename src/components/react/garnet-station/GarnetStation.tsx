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
import {
	generateProceduralCoords,
	type ProceduralParams,
	type ProceduralShape,
} from './procedural';

type BuilderMode = 'build' | 'delete';

function ModuleMesh({
	coord,
	spacing,
	mode,
	xRay,
	outline,
	isHoveredDelete,
	onBuild,
	onDelete,
	onPreview,
	onPreviewClear,
	onHover,
	onHoverClear,
	geometry,
	edgesGeometry,
}: {
	coord: GridCoord;
	spacing: number;
	mode: BuilderMode;
	xRay: boolean;
	outline: boolean;
	isHoveredDelete: boolean;
	onBuild: (coord: GridCoord) => void;
	onDelete: (coord: GridCoord) => void;
	onPreview: (coord: GridCoord | null) => void;
	onPreviewClear: () => void;
	onHover: (coord: GridCoord) => void;
	onHoverClear: () => void;
	geometry: THREE.BufferGeometry;
	edgesGeometry: THREE.EdgesGeometry;
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
		<group position={worldPosition}>
			<mesh
				geometry={geometry}
				renderOrder={outline ? 1 : 0}
				onClick={handleClick}
				onPointerMove={handlePointerMove}
				onPointerOut={() => {
					onPreviewClear();
					onHoverClear();
				}}
			>
				{xRay || outline ? (
					outline ? (
						<meshBasicMaterial
							colorWrite={false}
							depthWrite
							depthTest
							side={THREE.DoubleSide}
						/>
					) : (
						<meshBasicMaterial
							transparent
							opacity={0}
							depthWrite={false}
							depthTest={false}
							colorWrite={false}
						/>
					)
				) : (
					<meshStandardMaterial
						color={isHoveredDelete ? '#f0a3a3' : '#93a2b8'}
						emissive={isHoveredDelete ? '#3b0f0f' : '#000000'}
						emissiveIntensity={isHoveredDelete ? 0.45 : 0}
						metalness={0.2}
						roughness={0.7}
					/>
				)}
			</mesh>
			{(xRay || outline) && (
				<lineSegments geometry={edgesGeometry} renderOrder={outline ? 2 : 3}>
					<lineBasicMaterial
						color={isHoveredDelete ? '#ff8b8b' : '#c7d5ea'}
						depthTest={!xRay}
						depthWrite={false}
					/>
				</lineSegments>
			)}
		</group>
	);
}

export default function GarnetStation() {
	const [modules, setModules] = useState<GridCoord[]>([{ x: 0, y: 0, z: 0 }]);
	const [mode, setMode] = useState<BuilderMode>('build');
	const [previewCoord, setPreviewCoord] = useState<GridCoord | null>(null);
	const [hoveredDeleteKey, setHoveredDeleteKey] = useState<string | null>(null);
	const [replaceExisting, setReplaceExisting] = useState(false);
	const [xRay, setXRay] = useState(false);
	const [outline, setOutline] = useState(false);
	const [procedural, setProcedural] = useState<ProceduralParams>({
		shape: 'hollow-box',
		sizeX: 8,
		sizeY: 8,
		sizeZ: 8,
		wallThickness: 1,
		offsetX: 0,
		offsetY: 0,
		offsetZ: 0,
		centerOnOffset: true,
	});
	const spacing = useMemo(() => getModuleSpacing(), []);

	const moduleGeometry = useMemo(
		() => createRhombicDodecahedronGeometry(MODULE_SIZE_METERS),
		[],
	);
    const moduleEdgesGeometry = useMemo(
		() => new THREE.EdgesGeometry(moduleGeometry),
		[moduleGeometry],
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

	const updateProceduralNumber = (key: keyof ProceduralParams, value: number) => {
		const nextValue = Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
		setProcedural((previous) => ({
			...previous,
			[key]: nextValue,
		}));
	};

	const updateProceduralOffset = (
		key: 'offsetX' | 'offsetY' | 'offsetZ',
		value: number,
	) => {
		const nextValue = Number.isFinite(value) ? Math.floor(value) : 0;
		setProcedural((previous) => ({
			...previous,
			[key]: nextValue,
		}));
	};

	const handleGenerateProcedural = () => {
		const generated = generateProceduralCoords(procedural);
		const starting = replaceExisting ? [] : modules;
		const keySet = new Set(starting.map((coord) => coordKey(coord)));
		const merged = [...starting];

		for (const coord of generated) {
			if (!replaceExisting && isOrigin(coord)) {
				continue;
			}

			const key = coordKey(coord);
			if (!keySet.has(key)) {
				keySet.add(key);
				merged.push(coord);
			}
		}

		setModules(merged);
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

				<div className="card p-3">
					<h5 className="mb-3">Procedural Generator</h5>
					<div className="mb-2">
						<label className="form-label">Shape</label>
						<select
							className="form-select"
							value={procedural.shape}
							onChange={(event) =>
								setProcedural((previous) => ({
									...previous,
									shape: event.target.value as ProceduralShape,
								}))
							}
						>
							<option value="hollow-box">Hollow Box</option>
							<option value="hollow-sphere">Hollow Sphere</option>
							<option value="cylinder">Cylinder</option>
						</select>
					</div>

					<div className="row g-2 mb-2">
						<div className="col-4">
							<label className="form-label">Size X</label>
							<input
								type="number"
								className="form-control"
								min={1}
								value={procedural.sizeX}
								onChange={(event) =>
									updateProceduralNumber('sizeX', Number(event.target.value))
								}
							/>
						</div>
						<div className="col-4">
							<label className="form-label">Size Y</label>
							<input
								type="number"
								className="form-control"
								min={1}
								value={procedural.sizeY}
								onChange={(event) =>
									updateProceduralNumber('sizeY', Number(event.target.value))
								}
							/>
						</div>
						<div className="col-4">
							<label className="form-label">Size Z</label>
							<input
								type="number"
								className="form-control"
								min={1}
								value={procedural.sizeZ}
								onChange={(event) =>
									updateProceduralNumber('sizeZ', Number(event.target.value))
								}
							/>
						</div>
					</div>

					<div className="row g-2 mb-2">
						<div className="col-4">
							<label className="form-label">Shell Thickness</label>
							<input
								type="number"
								className="form-control"
								min={1}
								value={procedural.wallThickness}
								onChange={(event) =>
									updateProceduralNumber('wallThickness', Number(event.target.value))
								}
							/>
						</div>
						<div className="col-4">
							<label className="form-label">Offset X</label>
							<input
								type="number"
								className="form-control"
								value={procedural.offsetX}
								onChange={(event) =>
									updateProceduralOffset('offsetX', Number(event.target.value))
								}
							/>
						</div>
						<div className="col-4">
							<label className="form-label">Offset Y</label>
							<input
								type="number"
								className="form-control"
								value={procedural.offsetY}
								onChange={(event) =>
									updateProceduralOffset('offsetY', Number(event.target.value))
								}
							/>
						</div>
					</div>

					<div className="row g-2 mb-3">
						<div className="col-4">
							<label className="form-label">Offset Z</label>
							<input
								type="number"
								className="form-control"
								value={procedural.offsetZ}
								onChange={(event) =>
									updateProceduralOffset('offsetZ', Number(event.target.value))
								}
							/>
						</div>
					</div>

					<div className="form-check mb-2">
						<input
							className="form-check-input"
							type="checkbox"
							id="centerOnOffset"
							checked={procedural.centerOnOffset}
							onChange={(event) =>
								setProcedural((previous) => ({
									...previous,
									centerOnOffset: event.target.checked,
								}))
							}
						/>
						<label className="form-check-label" htmlFor="centerOnOffset">
							Center on offset
						</label>
					</div>

					<div className="form-check mb-3">
						<input
							className="form-check-input"
							type="checkbox"
							id="outlineToggle"
							checked={outline}
							onChange={(event) => setOutline(event.target.checked)}
						/>
						<label className="form-check-label" htmlFor="outlineToggle">
							Outline (occluded)
						</label>
					</div>

					<div className="form-check mb-3">
						<input
							className="form-check-input"
							type="checkbox"
							id="xRayToggle"
							checked={xRay}
							onChange={(event) => setXRay(event.target.checked)}
						/>
						<label className="form-check-label" htmlFor="xRayToggle">
							X-Ray (outline only)
						</label>
					</div>

					<div className="form-check mb-3">
						<input
							className="form-check-input"
							type="checkbox"
							id="replaceExisting"
							checked={replaceExisting}
							onChange={(event) => setReplaceExisting(event.target.checked)}
						/>
						<label className="form-check-label" htmlFor="replaceExisting">
							Replace existing modules (including origin)
						</label>
					</div>

					<button
						type="button"
						className="btn btn-primary w-100"
						onClick={handleGenerateProcedural}
					>
						Generate Shape
					</button>
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
								xRay={xRay}
								outline={outline}
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
								edgesGeometry={moduleEdgesGeometry}
							/>
						))}

						{canPlacePreview && previewCoord && (
							<group position={gridToWorld(previewCoord, spacing)}>
								{!xRay && !outline && (
									<mesh geometry={moduleGeometry}>
										<meshStandardMaterial
											color="#7e9f70"
											opacity={0.4}
											transparent
											depthWrite={false}
										/>
									</mesh>
								)}
								{(xRay || outline) && (
									<lineSegments geometry={moduleEdgesGeometry}>
										<lineBasicMaterial color="#9fcb88" depthTest={!xRay} />
									</lineSegments>
								)}
							</group>
						)}

						<OrbitControls makeDefault enableDamping />
					</Canvas>
				</div>
			</div>
		</div>
	);
}
