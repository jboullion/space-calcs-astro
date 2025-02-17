import { useMemo } from 'react';
import AsteroidImpactForm from './AsteroidImpactForm';
import AsteroidImpactVisualization from './AsteroidImpactVisualization';
import ImpactResults from './AsteroidImpactResults';
import { AsteroidImpactProvider, useImpact } from './AsteroidImpactContext';

// Physical constants
const G = 6.6743e-11; // Universal gravitational constant in m³/kg/s²
const c = 299792458; // Speed of light in m/s

function formatNumber(value: number, precision: number = 2): string {
	if (value === 0 || !isFinite(value)) return '0';
	if (Math.abs(value) < 0.01 || Math.abs(value) > 999999) {
		return value.toExponential(precision);
	}
	return value.toFixed(precision);
}

function AsteroidImpactCalculator() {
	const { asteroid, targetBody, impactParams } = useImpact();

	// Calculate impact effects
	const impactEffects = useMemo(() => {
		// Only calculate if we have valid inputs
		if (!asteroid || !targetBody || !impactParams) {
			return {
				kineticEnergy: '0',
				craterDiameter: '0',
				ejectaVolume: '0',
				seismicMagnitude: '0',
			};
		}

		// Only calculate if we have valid inputs
		if (!asteroid || !targetBody || !impactParams) {
			return {
				kineticEnergy: '0',
				craterDiameter: '0',
				ejectaVolume: '0',
				seismicMagnitude: '0',
			};
		}

		// Calculate asteroid mass (m = ρV = ρ * 4/3πr³)
		const asteroidRadius = asteroid.diameter / 2;
		const asteroidVolume = (4 / 3) * Math.PI * Math.pow(asteroidRadius, 3);
		const asteroidMass = asteroidVolume * asteroid.density;

		// Calculate impact angle factor (vertical impact = 1, glancing = sin(angle))
		const angleRadians = (impactParams.angle * Math.PI) / 180;
		const angleImpactFactor = Math.sin(angleRadians);

		// Calculate kinetic energy (KE = 1/2 * m * v²)
		// Adjust for impact angle
		const impactVelocity = impactParams.velocity * angleImpactFactor;
		const kineticEnergy = 0.5 * asteroidMass * Math.pow(impactVelocity, 2);

		// Calculate crater diameter using scaling law
		// Based on Schmidt-Holsapple scaling (simplified)
		// D = k * (ρa/ρt)^1/6 * (L/ρt)^1/4 * g^-1/6
		// where L is impactor kinetic energy per unit volume
		const densityRatio = asteroid.density / targetBody.density;
		const gravity =
			(G *
				targetBody.density *
				(4 / 3) *
				Math.PI *
				Math.pow(targetBody.diameter / 2, 3)) /
			Math.pow(targetBody.diameter / 2, 2);

		const energyDensity =
			kineticEnergy / (Math.PI * Math.pow(targetBody.diameter / 2, 2));
		const craterDiameter =
			1.8 * // scaling constant
			Math.pow(densityRatio, 1 / 6) *
			Math.pow(energyDensity / targetBody.density, 1 / 4) *
			Math.pow(gravity, -1 / 6);

		// Calculate ejected material volume (approximately hemispherical crater)
		const craterDepth = craterDiameter * 0.2; // typical depth/diameter ratio
		const ejectaVolume =
			(1 / 12) * Math.PI * Math.pow(craterDiameter, 2) * craterDepth;

		// Calculate seismic magnitude
		// Using energy-magnitude relationship: M = (2/3) * log10(E) - 3.2
		// Where E is in joules
		const seismicMagnitude = (2 / 3) * (Math.log10(kineticEnergy) - 3.2);

		return {
			kineticEnergy: formatNumber(kineticEnergy),
			craterDiameter: formatNumber(craterDiameter),
			ejectaVolume: formatNumber(ejectaVolume),
			seismicMagnitude: formatNumber(seismicMagnitude, 1),
		};
	}, [asteroid, targetBody, impactParams]);

	return (
		<div id="asteroid-impact__app" className="row calculator">
			<div
				id="asteroid-impact__form"
				className="col-xl-4 col-lg-5 col-md-6"
			>
				<AsteroidImpactForm />
				<ImpactResults impactEffects={impactEffects} />
			</div>
			<div
				id="asteroid-impact__results"
				className="col-xl-8 col-lg-7 col-md-6 mb-5"
			>
				<AsteroidImpactVisualization />
			</div>
		</div>
	);
}

export default function AsteroidImpact() {
	return (
		<AsteroidImpactProvider>
			<AsteroidImpactCalculator />
		</AsteroidImpactProvider>
	);
}
