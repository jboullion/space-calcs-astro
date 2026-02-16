import { OrbitControls } from '@react-three/drei';
import { Canvas, type ThreeEvent, useFrame, useLoader } from '@react-three/fiber';
import { Bloom, BrightnessContrast, EffectComposer } from '@react-three/postprocessing';
import { useMemo, useRef, useState } from 'react';
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

function SunDot({ position }: { position: [number, number, number] }) {
	return (
		<mesh position={position}>
			<sphereGeometry args={[7, 24, 24]} />
			<meshStandardMaterial
				color="#fff6d8"
				emissive="#fff6d8"
				emissiveIntensity={2.6}
				toneMapped={false}
			/>
		</mesh>
	);
}

function EarthNightLights({
	nightMap,
	sunDirection,
}: {
	nightMap: THREE.Texture;
	sunDirection: THREE.Vector3;
}) {
	const uniforms = useMemo(
		() => ({
			uNightMap: { value: nightMap },
			uLightDir: { value: sunDirection.clone().normalize() },
		}),
		[nightMap, sunDirection],
	);

	return (
		<mesh>
			<sphereGeometry args={[281.6, 64, 64]} />
			<shaderMaterial
				uniforms={uniforms}
				vertexShader={`
					varying vec2 vUv;
					varying vec3 vWorldNormal;
					void main() {
						vUv = uv;
						vWorldNormal = normalize(mat3(modelMatrix) * normal);
						gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
					}
				`}
				fragmentShader={`
					uniform sampler2D uNightMap;
					uniform vec3 uLightDir;
					varying vec2 vUv;
					varying vec3 vWorldNormal;
					void main() {
						vec3 nightTex = texture2D(uNightMap, vUv).rgb;
						float ndl = dot(normalize(vWorldNormal), normalize(uLightDir));
						float nightMask = smoothstep(-0.14, 0.22, -ndl);
						nightMask = pow(nightMask, 0.72);
						vec3 city = nightTex * nightMask * 1.12;
						float alpha = clamp(max(max(city.r, city.g), city.b) * 1.25, 0.0, 0.94);
						gl_FragColor = vec4(city, alpha);
					}
				`}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</mesh>
	);
}

function SpaceBackdrop() {
	const earthMap = useLoader(THREE.TextureLoader, '/textures/2k_earth_daymap.jpg');
	const earthNightMap = useLoader(THREE.TextureLoader, '/textures/2k_earth_nightmap.jpg');
	earthMap.colorSpace = THREE.SRGBColorSpace;
	earthNightMap.colorSpace = THREE.SRGBColorSpace;
	const earthSpinGroup = useRef<THREE.Group>(null);
	const sunPosition = useMemo(() => new THREE.Vector3(560, 220, -420), []);
	const earthCenter = useMemo(() => new THREE.Vector3(-430, -60, -180), []);
	const sunDirection = useMemo(
		() => sunPosition.clone().sub(earthCenter).normalize(),
		[earthCenter, sunPosition],
	);

	useFrame((_, delta) => {
		if (!earthSpinGroup.current) {
			return;
		}

		earthSpinGroup.current.rotation.y += delta * 0.02;
	});

	return (
		<>
			<color attach="background" args={['#000000']} />

			<group position={[-430, -60, -180]} rotation={[0.02, 0.62, 0]}>
				<group rotation={[0, 0, 0.41]}>
					<group ref={earthSpinGroup}>
						<mesh>
							<sphereGeometry args={[280, 64, 64]} />
							<meshStandardMaterial map={earthMap} roughness={1} metalness={0} />
						</mesh>

						<mesh>
							<sphereGeometry args={[284, 64, 64]} />
							<meshStandardMaterial
								color="#5ca3ff"
								transparent
								opacity={0.1}
								side={THREE.DoubleSide}
								depthWrite={false}
							/>
						</mesh>

						<EarthNightLights nightMap={earthNightMap} sunDirection={sunDirection} />
					</group>
				</group>
			</group>

			<SunDot position={[560, 220, -420]} />
		</>
	);
}

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
					<Canvas camera={{ position: [22, 18, 22], fov: 50, near: 0.1, far: 2600 }}>
						<SpaceBackdrop />
						<ambientLight intensity={0.34} />
						<directionalLight position={[560, 220, -420]} intensity={1.4} />

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

						<EffectComposer multisampling={0}>
							<BrightnessContrast brightness={0.01} contrast={0.2} />
							<Bloom
								intensity={0.35}
								luminanceThreshold={0.16}
								luminanceSmoothing={0.4}
							/>
						</EffectComposer>

						<OrbitControls makeDefault enableDamping />
					</Canvas>
				</div>
			</div>
		</div>
	);
}
