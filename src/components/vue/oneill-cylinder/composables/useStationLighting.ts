import * as THREE from 'three';
import type { ONeillCylinderForm } from '../types';
import type { ComputedRef } from 'vue';

export function useStationLighting(
	three: any,
	internalRadius: ComputedRef<number>,
) {
	let windowLights: THREE.Points;
	const WINDOWS_PER_RING = 100;
	const RINGS_PER_FLOOR = 10;

	const initLights = (formData: ONeillCylinderForm) => {
		const totalWindows =
			WINDOWS_PER_RING * RINGS_PER_FLOOR * formData.internal.levels;
		const positions = new Float32Array(totalWindows * 3);
		const colors = new Float32Array(totalWindows * 3);

		const length = formData.structure.cylinderLength;
		const levelHeight = formData.internal.levelHeight / 1000;
		const ringSpacing = length / (RINGS_PER_FLOOR + 1);

		for (let level = 0; level < formData.internal.levels; level++) {
			const currentRadius = internalRadius.value - level * levelHeight;

			for (let ring = 0; ring < RINGS_PER_FLOOR; ring++) {
				const z = -length / 2 + (ring + 1) * ringSpacing;

				for (let i = 0; i < WINDOWS_PER_RING; i++) {
					const index =
						((level * RINGS_PER_FLOOR + ring) * WINDOWS_PER_RING +
							i) *
						3;
					const angle = (i / WINDOWS_PER_RING) * Math.PI * 2;

					// Add slight radius variation
					const radiusVariation =
						Math.random() * 0.02 * currentRadius;
					const finalRadius = currentRadius - radiusVariation;

					positions[index] = Math.cos(angle) * finalRadius;
					positions[index + 1] = Math.sin(angle) * finalRadius;
					positions[index + 2] = z + (Math.random() - 0.025);

					// Warm yellow color with slight variation
					const colorVariation = Math.random() * 0.1;
					colors[index] = 1.0 - colorVariation; // R
					colors[index + 1] = 0.9 - colorVariation; // G
					colors[index + 2] = 0.7 - colorVariation; // B
				}
			}
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(positions, 3),
		);
		geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

		const material = new THREE.PointsMaterial({
			size: 0.01,
			transparent: true,
			opacity: 0.7,
			vertexColors: true,
			blending: THREE.AdditiveBlending,
			depthTest: true,
			depthWrite: false,
			sizeAttenuation: true,
		});

		windowLights = new THREE.Points(geometry, material);
		windowLights.renderOrder = 1;
		three.group.add(windowLights);
	};

	const updateLights = () => {
		if (!windowLights) return;

		const colors = (
			windowLights.geometry.attributes.color as THREE.BufferAttribute
		).array as Float32Array;

		for (let i = 0; i < colors.length; i += 3) {
			if (Math.random() < 0.001) {
				const state = Math.random() > 0.5;
				const brightness = state ? 1.0 : 0.1;
				const baseColor = state ? [1.0, 0.9, 0.7] : [0.1, 0.09, 0.07];
				colors[i] = baseColor[0];
				colors[i + 1] = baseColor[1];
				colors[i + 2] = baseColor[2];
			}
		}

		windowLights.geometry.attributes.color.needsUpdate = true;
	};

	const removeLights = () => {
		if (windowLights) {
			three.group.remove(windowLights);
			windowLights.geometry.dispose();
			(windowLights.material as THREE.Material).dispose();
		}
	};

	return {
		initLights,
		updateLights,
		removeLights,
	};
}
