import { computed } from 'vue';
import type { ONeillCylinderForm } from '../types';
import { roundToDecimal } from '../../utils';
import { calcG_Accel, calcSpinRads } from '../functions';
import { animation } from '../constants';

export function useStationCalculations(formData: ONeillCylinderForm) {
	const stationWidth = computed(() => formData.structure.cylinderLength);

	const internalRadius = computed(() => {
		return (
			formData.structure.radius -
			formData.structure.shellWallThickness / 1000
		);
	});

	const spinRads = computed(() => {
		const { radius, surfaceGravity } = formData.structure;
		const result = calcSpinRads(radius, surfaceGravity);
		return roundToDecimal(result, 4);
	});

	const G_Accel = computed(() => {
		return calcG_Accel(formData.structure.radius, spinRads.value);
	});

	const rotationSpeed = computed(() => {
		// Convert rotation speed from rpm to radians per frame
		return (
			(formData.movementOptions.rotationSpeed / (animation.FPS * 60)) *
			animation.radians
		);
	});

	return {
		stationWidth,
		internalRadius,
		spinRads,
		G_Accel,
		rotationSpeed,
	};
}
