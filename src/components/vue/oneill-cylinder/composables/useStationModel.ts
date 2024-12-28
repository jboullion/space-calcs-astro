import * as THREE from 'three';
import type { ONeillCylinderForm } from '../types';
import type { ComputedRef } from 'vue';

export function useStationModel(
	three: any,
	internalRadius: ComputedRef<number>,
) {
	const curveSegments = 12;
	const materials = {
		station: new THREE.MeshPhongMaterial({
			color: 0xdddddd,
			side: THREE.FrontSide,
		}),
		floor: new THREE.MeshPhongMaterial({
			color: 0xaacccc,
			side: THREE.FrontSide,
		}),
		cap: new THREE.MeshPhongMaterial({
			color: 0xeeeeee,
			side: THREE.DoubleSide,
		}),
	};

	const buildStation = (formData: ONeillCylinderForm) => {
		// Initialize the station and floors if they don't exist
		three.station = new THREE.Mesh();
		three.floors = new THREE.Group();
		three.group.add(three.station);
		three.group.add(three.floors);

		buildCylinderStation(formData);
	};

	const updateStation = (formData: ONeillCylinderForm) => {
		// Dispose old geometries
		if (three.station.geometry) {
			three.station.geometry.dispose();
		}

		// Clear floors
		while (three.floors.children.length > 0) {
			const floor = three.floors.children[0];
			if (floor.geometry) {
				floor.geometry.dispose();
			}
			three.floors.remove(floor);
		}

		// Remove old caps
		three.group.children.forEach((child: THREE.Mesh) => {
			if (child !== three.station && child !== three.floors) {
				if (child.geometry) {
					child.geometry.dispose();
				}
				three.group.remove(child);
			}
		});

		// Update geometries
		buildCylinderStation(formData);

		// Update group position
		three.group.position.z = -formData.structure.cylinderLength / 2;
	};

	const buildCylinderStation = (formData: ONeillCylinderForm) => {
		// Create shape for the cylinder
		const arcShape = new THREE.Shape();
		arcShape.absarc(0, 0, formData.structure.radius, 0, Math.PI * 2, false);

		const holePath = new THREE.Path();
		holePath.absarc(0, 0, internalRadius.value, 0, Math.PI * 2, true);
		arcShape.holes.push(holePath);

		const extrudeSettings = {
			depth: formData.structure.cylinderLength,
			steps: 1,
			bevelEnabled: false,
			curveSegments: curveSegments,
		};

		const geometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);
		three.station.geometry = geometry;
		three.station.material = materials.station;

		buildFloors(formData);
		buildCaps(formData);
	};

	const buildFloors = (formData: ONeillCylinderForm) => {
		if (formData.internal.levels < 1) return;

		const floorHeight = formData.internal.levelHeight / 1000;
		const baseExtrudeSettings = {
			depth: formData.structure.cylinderLength,
			steps: 1,
			bevelEnabled: false,
			curveSegments: curveSegments,
		};

		if (formData.structure.caps.value === 'concave') {
			baseExtrudeSettings.depth -= formData.structure.radius / 2;
		}

		for (let i = 0; i < formData.internal.levels; i++) {
			const currentFloorHeight = internalRadius.value - floorHeight * i;

			const arcShape = new THREE.Shape();
			arcShape.absarc(0, 0, currentFloorHeight, 0, Math.PI * 2, false);

			const holePath = new THREE.Path();
			holePath.absarc(
				0,
				0,
				currentFloorHeight - floorHeight,
				0,
				Math.PI * 2,
				true,
			);
			arcShape.holes.push(holePath);

			// Create a new settings object for each floor to avoid reference issues
			const floorExtrudeSettings = { ...baseExtrudeSettings };
			//floorExtrudeSettings.depth -= 0.1 * i;
			floorExtrudeSettings.depth -= 0.1 * i;

			const geometry = new THREE.ExtrudeGeometry(
				arcShape,
				floorExtrudeSettings,
			);
			const floor = new THREE.Mesh(geometry, materials.floor);

			if (formData.structure.caps.value === 'concave') {
				floor.position.z = formData.structure.radius;
			}

			three.floors.add(floor);
		}
	};

	const buildCaps = (formData: ONeillCylinderForm) => {
		switch (formData.structure.caps.value) {
			case 'flat':
				buildFlatCaps(formData);
				break;
			case 'convex':
				buildConvexCaps(formData);
				break;
			case 'concave':
				buildConcaveCaps(formData);
				break;
		}
	};

	const buildFlatCaps = (formData: ONeillCylinderForm) => {
		const capHeight =
			formData.structure.cylinderLength < 10
				? formData.structure.cylinderLength / 20
				: 0.5;
		const capGeometry = new THREE.CylinderGeometry(
			formData.structure.radius,
			formData.structure.radius,
			capHeight,
			curveSegments * 2,
		);

		const frontCap = new THREE.Mesh(capGeometry, materials.cap);
		frontCap.rotation.x = Math.PI / 2;
		frontCap.position.z = -capHeight / 2;
		three.group.add(frontCap);

		// const backCap = new THREE.Mesh(capGeometry, materials.cap);
		// backCap.rotation.x = Math.PI / 2;
		// backCap.position.z = formData.structure.cylinderLength + capHeight / 2;
		// three.group.add(backCap);
	};

	const buildConvexCaps = (formData: ONeillCylinderForm) => {
		const capGeometry = new THREE.SphereGeometry(
			formData.structure.radius,
			curveSegments * 2,
			curveSegments * 2,
			0,
			2 * Math.PI,
			0,
			0.5 * Math.PI,
		);

		const frontCap = new THREE.Mesh(capGeometry, materials.cap);
		frontCap.rotation.x = -Math.PI / 2;
		three.group.add(frontCap);

		// const backCap = new THREE.Mesh(capGeometry, materials.cap);
		// backCap.rotation.x = Math.PI / 2;
		// backCap.position.z = formData.structure.cylinderLength;
		// three.group.add(backCap);
	};

	const buildConcaveCaps = (formData: ONeillCylinderForm) => {
		const capGeometry = new THREE.SphereGeometry(
			internalRadius.value,
			curveSegments * 2,
			curveSegments * 2,
			0,
			2 * Math.PI,
			0,
			0.5 * Math.PI,
		);

		const frontCap = new THREE.Mesh(capGeometry, materials.cap);
		frontCap.rotation.x = -Math.PI / 2;
		frontCap.rotation.z = Math.PI;
		three.group.add(frontCap);

		// const backCap = new THREE.Mesh(capGeometry, materials.cap);
		// backCap.rotation.x = Math.PI / 2;
		// backCap.rotation.z = Math.PI;
		// backCap.position.z = formData.structure.cylinderLength;
		// three.group.add(backCap);
	};

	return {
		buildStation,
		updateStation,
	};
}
