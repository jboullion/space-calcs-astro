import * as THREE from 'three';
import type { IHyperionFormData } from '../types';

export function useHyperionModel(three: {
	scene: THREE.Scene;
	cylinder: THREE.Mesh;
}) {
	const materials = {
		cylinder: new THREE.MeshPhongMaterial({
			color: 0xdddddd,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.5,
		}),
	};

	const createCylinder = (formData: IHyperionFormData) => {
		if (three.cylinder) {
			three.scene.remove(three.cylinder);
		}

		const geometry = new THREE.CylinderGeometry(
			formData.structure.radius,
			formData.structure.radius,
			formData.structure.length,
			32,
		);

		three.cylinder = new THREE.Mesh(geometry, materials.cylinder);
		three.cylinder.rotation.x = Math.PI / 2;
		three.scene.add(three.cylinder);
	};

	const updateCylinder = (formData: IHyperionFormData) => {
		// Dispose of old geometry
		if (three.cylinder.geometry) {
			three.cylinder.geometry.dispose();
		}

		// Create new geometry with updated dimensions
		const geometry = new THREE.CylinderGeometry(
			formData.structure.radius,
			formData.structure.radius,
			formData.structure.length,
			32,
		);

		three.cylinder.geometry = geometry;
	};

	return {
		createCylinder,
		updateCylinder,
	};
}
