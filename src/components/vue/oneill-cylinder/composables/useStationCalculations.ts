import { computed, ref } from 'vue';
import type { ONeillCylinderForm } from '../types';
import { physicsConstants, roundToDecimal } from '../../utils';
import { calcG_Accel, calcSpinRads } from '../functions';
import { animation } from '../constants';

export function useStationCalculations(formData: ONeillCylinderForm) {
	/**
	 * COMPUTED CALCUATIONS
	 */
	const shellFloorArea = computed(() => {
		return (
			formData.structure.radius *
			2 *
			Math.PI *
			formData.structure.cylinderLength
		);
	});

	const totalFloorArea = computed(() => {
		return Math.ceil(shellFloorArea.value + floorsArea.value);
	});

	const radiusM = computed(() => {
		return formData.structure.radius * 1000;
	});

	const cylinderLengthM = computed(() => {
		return formData.structure.cylinderLength * 1000;
	});

	const spinRads = computed(() => {
		const { radius, surfaceGravity } = formData.structure;

		const result = calcSpinRads(radius, surfaceGravity);

		return roundToDecimal(result, 4);
	});

	const G_Accel = computed(() => {
		return calcG_Accel(formData.structure.radius, spinRads.value);
	});

	const innerRadius = computed(() => {
		return radiusM.value - formData.structure.shellWallThickness;
	});

	// CW5
	const lookupMultiplier = computed(() => {
		const result = internalRadius.value < 0 ? 0 : 1;

		// console.log("CW5 lookupMultipliers", result);

		return result;
	});

	// DataStruc!$E$7
	const structureTensileStrength = computed(() => {
		const result =
			formData.structure.material.tensileStrength /
			formData.structure.safetyFactor;

		// console.log("structureTensileStrength ", result);

		return result;
	});

	// InterFloors C2
	const floorsTensileStrength = computed(() => {
		const result =
			formData.internal.floorMaterial.tensileStrength /
			formData.structure.safetyFactor;

		// console.log("floorsTensileStrength ", result);

		return result;
	});

	// CW8
	// const internalRadius = computed(() => {
	// 	const result =
	// 		innerRadius.value -
	// 		formData.internal.levelHeight * formData.internal.levels +
	// 		formData.internal.levelHeight;

	// 	// console.log("CW8 internalRadius", result);

	// 	return result;
	// });

	const internalRadius = computed(() => {
		return (
			formData.structure.radius -
			formData.structure.shellWallThickness / 1000
		);
	});

	// CW10
	const centripetalStress = computed(() => {
		// =(DataStruc!$D$7*DataStruc!$C$25^2*CW8^2)/2
		const result =
			(formData.structure.material.density *
				spinRads.value ** 2 *
				internalRadius.value ** 2) /
			2;

		// console.log("CW10 centripetalStress", result);

		return result;
	});

	// CW11
	// TODO: Better name than "wall"
	const wall = computed(() => {
		// =(DataStruc!$D$7*DataStruc!$C$25^2*CW8^2)/2/DataStruc!$E$7

		const tensilePa = structureTensileStrength.value * 1000000;

		const result = centripetalStress.value / tensilePa;

		return result;
	});

	// CW12
	const internalStructure = computed(() => {
		// =DataStruc!$C$10*DataStruc!$C$29
		const result = formData.structure.internalStructureMass * G_Accel.value;

		// console.log("CW12 internalStructure", result);

		return result;
	});

	// CW13
	const hoopStress = computed(() => {
		// =(CW12*CW8)/CW11
		const result =
			(internalStructure.value * internalRadius.value) / wall.value;

		// console.log("CW13 hoopStress", result);

		return result;
	});

	// CW14
	const totalStress = computed(() => {
		// =CW13+CW10
		const result = hoopStress.value + centripetalStress.value;

		// console.log("CW14 totalStress", result);

		return result;
	});

	// CW15
	const materialThickness = computed(() => {
		// =CW14/$C$2

		const result =
			totalStress.value / (floorsTensileStrength.value * 1000000);

		// console.log("CW15 materialThickness", result);

		return result;
	});

	// CW16
	const lookupArea = computed(() => {
		// =2*PI()*CW8*DataStruc!$C$3

		const result =
			2 * Math.PI * internalRadius.value * cylinderLengthM.value;

		// console.log("CW16 lookupArea", result);

		return result;
	});

	// CW17
	const lookupMass = computed(() => {
		// =CW16*$D$2*CW15
		const result =
			lookupArea.value *
			formData.internal.floorMaterial.density *
			materialThickness.value;
		// console.log("CW17 lookupMass", result);

		return result;
	});

	// CW19
	const totalMass = computed(() => {
		// =(CW17+CV19)*CW5

		// IMPORTANT: This is a meaningless number I am using to fudge some math.
		// TODO: We may want to dig deeper into this issue if other numbers are off.
		//const magicMultiplier = 1.075;

		const allLevelsMass = formData.internal.levels * lookupMass.value; // * magicMultiplier;

		const result =
			(lookupMass.value + allLevelsMass) * lookupMultiplier.value;

		// console.log("C19 totalMass", result);

		return result;
	});

	// CW20
	const totalArea = computed(() => {
		// =(CV20+CW16)*CW5
		//const magicMultiplier = 1.015;
		const allLevelsArea = formData.internal.levels * lookupArea.value; // * magicMultiplier;
		const result =
			(allLevelsArea + lookupArea.value) * lookupMultiplier.value;

		// console.log("C20 totalArea", result);

		return result;
	});

	const floorsMass = computed(() => {
		// =if(C22=0,0,InterFloors!C22/1000)
		const result =
			formData.internal.levels == 0
				? 0
				: Math.floor(totalMass.value) / 1000;

		return result;
	});

	const floorsArea = computed(() => {
		// =if(C22=0,0,InterFloors!C23)
		return formData.internal.levels == 0
			? 0
			: Math.ceil(totalArea.value / 1000000);
	});

	// C34
	const circumfrence = computed(() => {
		// =2*PI()*DataStruc!C2

		const result = 2 * Math.PI * radiusM.value;

		// console.log("C34 circumfrence", result);

		return result;
	});

	// C35
	const floorArea = computed(() => {
		// =C34*DataStruc!C3

		const result = circumfrence.value * cylinderLengthM.value;

		// console.log("C35 floorArea", result);

		return result;
	});

	// E35
	const internalFloorArea = computed(() => {
		// =C34*DataStruc!C3

		const internalCircumfrence =
			2 *
			Math.PI *
			(radiusM.value - formData.structure.shellWallThickness);

		const result = internalCircumfrence * cylinderLengthM.value;

		// console.log("C35 floorArea", result);

		return result;
	});

	// C36
	const capSurfaceArea = computed(() => {
		let result = 0;

		switch (formData.structure.caps.value) {
			case 'flat':
				// =PI()*C33^2
				result = Math.PI * radiusM.value ** 2;
				break;
			case 'convex':
				// =4*PI()*$C$2^2/2
				result = (4 * Math.PI * radiusM.value ** 2) / 2;
				break;
			case 'concave':
				// =4*PI()*$C$2^2/2
				result = (4 * Math.PI * radiusM.value ** 2) / 2;
				break;
		}

		// console.log("C36 capSurfaceArea", result * 2);

		return Math.ceil(result * 2);
	});

	// C37
	const totalSurfaceArea = computed(() => {
		// =C36+C35

		const result = floorArea.value + capSurfaceArea.value;

		// console.log("C37 totalSurfaceArea", result);

		return result;
	});

	// C42
	const materialMass = computed(() => {
		// =C37*D7*C8

		const result =
			totalSurfaceArea.value *
			formData.structure.material.density *
			formData.structure.shellWallThickness;

		return result;
	});

	// E42
	const internalStructureMass = computed(() => {
		// =E35*C10

		const result =
			floorArea.value * formData.structure.internalStructureMass;

		return result;
	});

	// E37
	const internalSurfaceArea = computed(() => {
		// =E35*2

		const result = internalFloorArea.value + capSurfaceArea.value;

		return result;
	});

	// Air D4
	const airTemperature = computed(() => {
		// =273.15-C4

		const result = 273.15 - formData.structure.internalTemperature;

		return result;
	});

	// Air C6
	const airMoles = computed(() => {
		// =C2/(C5*D4)

		const C2 = formData.structure.internalPressure;
		const C5 = physicsConstants.idealGasConstant;

		const result = C2 / (C5 * airTemperature.value);

		return result;
	});

	// Air C7
	const airDensity = computed(() => {
		// =C6*VLOOKUP(UI!C8,F4:M5,8,false)

		const result = airMoles.value * formData.structure.airMix.molarMass;

		return result;
	});

	// Air C11
	const airmassHeight = computed(() => {
		// =if((C2/(C7*C9))>DataStruc!D33,DataStruc!D33,(C2/(C7*C9)))

		const C2 = formData.structure.internalPressure;
		const C7 = airDensity.value;
		const C9 = G_Accel.value;
		const D33 = radiusM.value;

		const result = C2 / (C7 * C9) > D33 ? D33 : C2 / (C7 * C9);

		return result;
	});

	// Air C12
	const airDensityMass = computed(() => {
		// =C11*C7

		const result = airmassHeight.value * airDensity.value;

		return result;
	});

	// Air C8/1000
	const airMass = computed(() => {
		// =C12*C3

		const result = airDensityMass.value * internalSurfaceArea.value;

		return result;
	});

	const totalStructureMass = computed(() => {
		// =C42+E42+CV19

		const result =
			materialMass.value + internalStructureMass.value + airMass.value;

		return result;
	});

	const finalTotalMass = computed(() => {
		// =C42+E42+CV19

		const result = totalStructureMass.value + floorsMass.value;

		return result;
	});

	const showPopulation = ref(true);

	const urbanArea = computed(
		() => (totalFloorArea.value * formData.landUse.urbanDensity) / 100,
	);

	const agriculturalArea = computed(
		() =>
			(totalFloorArea.value * formData.landUse.agriculturalDensity) / 100,
	);

	const industrialArea = computed(
		() => (totalFloorArea.value * formData.landUse.industrialDensity) / 100,
	);

	const unusedArea = computed(() => {
		const used =
			formData.landUse.urbanDensity +
			formData.landUse.agriculturalDensity +
			formData.landUse.industrialDensity;
		return totalFloorArea.value * (1 - used / 100);
	});

	// const unusedArea = computed(() => {
	// 	const used =
	// 		props.landUse.urbanDensity +
	// 		props.landUse.agriculturalDensity +
	// 		props.landUse.industrialDensity;
	// 	return totalUsableArea.value * (1 - used / 100);
	// });

	const urbanPopulation = computed(() =>
		Math.floor(
			urbanArea.value * formData.landUse.urbanDensityExample.popKm2,
		),
	);

	const populationDensity = computed(
		() => urbanPopulation.value / totalFloorArea.value,
	);

	const stationWidth = computed(() => formData.structure.cylinderLength);

	// const internalRadius = computed(() => {
	// 	return (
	// 		formData.structure.radius -
	// 		formData.structure.shellWallThickness / 1000
	// 	);
	// });

	// const spinRads = computed(() => {
	// 	const { radius, surfaceGravity } = formData.structure;
	// 	const result = calcSpinRads(radius, surfaceGravity);
	// 	return roundToDecimal(result, 4);
	// });

	// const G_Accel = computed(() => {
	// 	return calcG_Accel(formData.structure.radius, spinRads.value);
	// });

	const rotationSpeed = computed(() => {
		// Convert rotation speed from rpm to radians per frame
		return (
			(formData.movementOptions.rotationSpeed / (animation.FPS * 60)) *
			animation.radians
		);
	});

	return {
		floorsArea,
		floorsMass,
		shellFloorArea,
		totalFloorArea,
		radiusM,
		cylinderLengthM,
		circumfrence,
		floorArea,
		capSurfaceArea,
		totalSurfaceArea,
		materialMass,
		internalStructureMass,
		internalSurfaceArea,
		airTemperature,
		airMoles,
		airDensity,
		airmassHeight,
		airDensityMass,
		airMass,
		totalStructureMass,
		finalTotalMass,
		showPopulation,
		urbanArea,
		agriculturalArea,
		industrialArea,
		unusedArea,
		urbanPopulation,
		populationDensity,
		stationWidth,
		internalRadius,
		spinRads,
		G_Accel,
		rotationSpeed,
	};
}
