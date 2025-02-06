import {
	type EndcapProps,
	type StationEndcapsProps,
	EndcapType,
} from '../../types/station';
import { BackSide, FrontSide } from 'three';

export function FlatEndcap({
	radius,
	position,
	stationLength,
	color,
}: EndcapProps) {
	const zPosition =
		position === 'start' ? -stationLength / 2 - 1 : stationLength / 2 + 1;

	const side = position === 'start' ? FrontSide : BackSide;

	return (
		<mesh position={[0, 0, zPosition]}>
			<circleGeometry args={[radius, 64]} />
			<meshStandardMaterial
				color={color}
				metalness={0.2}
				roughness={0.7}
				envMapIntensity={0.2}
				side={side}
			/>
		</mesh>
	);
}

export function SphericalEndcap({
	radius,
	position,
	stationLength,
	color,
}: EndcapProps) {
	const zPosition =
		position === 'start' ? -stationLength / 2 : stationLength / 2;

	const zRotation = position === 'start' ? Math.PI : 0;

	return (
		<mesh
			position={[0, 0, zPosition]}
			rotation={[Math.PI / 2, 0, zRotation]}
		>
			<sphereGeometry
				args={[radius, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2]}
			/>
			<meshStandardMaterial
				color={color}
				side={BackSide}
				metalness={0.2}
				roughness={0.7}
				envMapIntensity={0.2}
			/>
		</mesh>
	);
}

export function StationEndcaps({
	radius,
	stationLength,
	endcapType,
	color,
}: StationEndcapsProps) {
	if (endcapType === EndcapType.None) return null;

	const EndcapComponent =
		endcapType === EndcapType.Flat ? FlatEndcap : SphericalEndcap;

	return (
		<>
			<EndcapComponent
				radius={radius}
				position="start"
				stationLength={stationLength}
				color={color}
			/>
			<EndcapComponent
				radius={radius}
				position="end"
				stationLength={stationLength}
				color={color}
			/>
		</>
	);
}
