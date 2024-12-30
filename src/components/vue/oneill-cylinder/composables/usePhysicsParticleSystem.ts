import * as THREE from 'three';
import type { ONeillCylinderForm } from '../types';
import type { ComputedRef } from 'vue';
import { calcG_Accel } from '../functions';
import { useThreeScene } from './useThreeScene';

export function usePhysicsParticleSystem(
	three: any,
	internalRadius: ComputedRef<number>,
	spinRads: ComputedRef<number>,
) {
	const PARTICLE_COUNT = 1000;
	let particles: THREE.Points;
	let positions: Float32Array;
	let velocities: Float32Array;

	const initParticles = (formData: ONeillCylinderForm) => {
		positions = new Float32Array(PARTICLE_COUNT * 3);
		velocities = new Float32Array(PARTICLE_COUNT * 3);

		const geometry = new THREE.BufferGeometry();
		const radius = internalRadius.value;
		const length = formData.structure.cylinderLength;

		// Create particles with initial positions and velocities
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const angle = Math.random() * Math.PI * 2;
			const r = Math.random() * radius * 0.8;
			const x = Math.cos(angle) * r;
			const y = Math.sin(angle) * r;
			const z = (Math.random() - 0.5) * length;

			positions[i * 3] = x;
			positions[i * 3 + 1] = y;
			positions[i * 3 + 2] = z;

			// Initial velocities (relative to rotating frame)
			velocities[i * 3] = (Math.random() - 0.5) * 0.1; // radial
			velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1; // tangential
			velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1; // axial
		}

		geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(positions, 3),
		);

		const material = new THREE.PointsMaterial({
			color: 0xaaaaff,
			size: 0.05,
			transparent: true,
			opacity: 0.2,
			blending: THREE.AdditiveBlending,
		});

		particles = new THREE.Points(geometry, material);
		three.group.add(particles);
	};

	const updateParticles = (deltaTime: number) => {
		if (!particles) return;

		const positions = (
			particles.geometry.attributes.position as THREE.BufferAttribute
		).array as Float32Array;
		const omega = spinRads.value; // Angular velocity

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const i3 = i * 3;
			const x = positions[i3];
			const y = positions[i3 + 1];
			const z = positions[i3 + 2];

			// Radius from center
			const r = Math.sqrt(x * x + y * y);

			// 1. Centrifugal force (outward)
			const centrifugalAccel = omega * omega * r;
			const angle = Math.atan2(y, x);
			velocities[i3] += Math.cos(angle) * centrifugalAccel * deltaTime;
			velocities[i3 + 1] +=
				Math.sin(angle) * centrifugalAccel * deltaTime;

			// 2. Coriolis effect
			// For radial motion
			const vr =
				velocities[i3] * Math.cos(angle) +
				velocities[i3 + 1] * Math.sin(angle);
			const coriolisAccel = -2 * omega * vr;
			velocities[i3] -= Math.sin(angle) * coriolisAccel * deltaTime;
			velocities[i3 + 1] += Math.cos(angle) * coriolisAccel * deltaTime;

			// 3. Update positions
			positions[i3] += velocities[i3] * deltaTime;
			positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
			positions[i3 + 2] += velocities[i3 + 2] * deltaTime;

			// 4. Boundary conditions
			const newR = Math.sqrt(
				positions[i3] * positions[i3] +
					positions[i3 + 1] * positions[i3 + 1],
			);

			// Bounce off walls with energy loss
			if (newR > internalRadius.value * 0.8) {
				const bounceAngle = Math.atan2(
					positions[i3 + 1],
					positions[i3],
				);
				positions[i3] =
					Math.cos(bounceAngle) * internalRadius.value * 0.79;
				positions[i3 + 1] =
					Math.sin(bounceAngle) * internalRadius.value * 0.79;

				// Reduce velocity (energy loss on collision)
				velocities[i3] *= -0.5;
				velocities[i3 + 1] *= -0.5;
			}

			// 5. Add small random perturbations (thermal motion)
			velocities[i3] += (Math.random() - 0.5) * 0.001;
			velocities[i3 + 1] += (Math.random() - 0.5) * 0.001;
			velocities[i3 + 2] += (Math.random() - 0.5) * 0.001;

			// 6. Terminal velocity / drag
			const maxSpeed = 0.5;
			const speed = Math.sqrt(
				velocities[i3] * velocities[i3] +
					velocities[i3 + 1] * velocities[i3 + 1] +
					velocities[i3 + 2] * velocities[i3 + 2],
			);

			if (speed > maxSpeed) {
				velocities[i3] *= maxSpeed / speed;
				velocities[i3 + 1] *= maxSpeed / speed;
				velocities[i3 + 2] *= maxSpeed / speed;
			}
		}

		particles.geometry.attributes.position.needsUpdate = true;
	};

	const removeParticles = () => {
		if (particles) {
			three.group.remove(particles);
			particles.geometry.dispose();
			(particles.material as THREE.Material).dispose();
		}
	};

	return {
		initParticles,
		updateParticles,
		removeParticles,
	};
}
