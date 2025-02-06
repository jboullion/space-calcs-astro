import { useRef } from 'react';
import { Mesh, BackSide } from 'three';
import { useStationStore } from '../../hooks/useStationStore';
import { HillsManager } from '../Environment/HillsManager';
import { TreesManager } from '../Environment/TreesManager';
import { FlatEndcap, SphericalEndcap } from './Endcaps';
import { EndcapType } from '../../types/station';
import { StationCoreLighting } from './CoreLighting';

const SEGMENTS = 32;

export function Station() {
	const stationRef = useRef<Mesh>(null);
	const {
		radius: STATION_RADIUS,
		length: STATION_LENGTH,
		hillsCount,
		hillHeight,
		hillRatio,
		endcapType,
		stationColor,
		endcapColor,
		hillColor,
		showWireframe,
		wireframeColor,
		wireframeOpacity,
	} = useStationStore();

	return (
		<>
			{/* Station Cylinder */}
			<mesh ref={stationRef} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
				<cylinderGeometry
					args={[
						STATION_RADIUS,
						STATION_RADIUS,
						STATION_LENGTH,
						SEGMENTS,
						1,
						true,
					]}
				/>
				<meshStandardMaterial
					color={stationColor}
					side={BackSide}
					metalness={0.1}
					roughness={0.8}
					envMapIntensity={0.2}
				/>
			</mesh>

			{/* Wireframe Overlay */}
			{showWireframe && (
				<mesh rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry
						args={[
							STATION_RADIUS - 0.001, // Slightly larger to prevent z-fighting
							STATION_RADIUS - 0.001,
							STATION_LENGTH - 0.001,
							SEGMENTS,
							SEGMENTS,
							true,
						]}
					/>
					<meshBasicMaterial
						color={wireframeColor}
						wireframe={true}
						transparent={true}
						opacity={wireframeOpacity}
						side={BackSide}
					/>
				</mesh>
			)}

			{/* Endcaps */}
			{endcapType === EndcapType.Flat && (
				<>
					<FlatEndcap
						radius={STATION_RADIUS}
						stationLength={STATION_LENGTH}
						position="start"
						color={endcapColor}
					/>
					<FlatEndcap
						radius={STATION_RADIUS}
						stationLength={STATION_LENGTH}
						position="end"
						color={endcapColor}
					/>
				</>
			)}
			{endcapType === EndcapType.Spherical && (
				<>
					<SphericalEndcap
						radius={STATION_RADIUS}
						stationLength={STATION_LENGTH}
						position="start"
						color={endcapColor}
					/>
					<SphericalEndcap
						radius={STATION_RADIUS}
						stationLength={STATION_LENGTH}
						position="end"
						color={endcapColor}
					/>
				</>
			)}

			{/* Environmental Features */}
			<HillsManager
				count={hillsCount}
				stationRadius={STATION_RADIUS}
				stationLength={STATION_LENGTH}
				hillHeight={hillHeight}
				hillRatio={hillRatio}
				hillColor={hillColor}
			/>

			<TreesManager
				stationRadius={STATION_RADIUS}
				stationLength={STATION_LENGTH}
			/>

			<StationCoreLighting
				stationRadius={STATION_RADIUS}
				stationLength={STATION_LENGTH}
			/>
		</>
	);
}
