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

		// TODO: Implement impact calculations
		return {
			kineticEnergy: '0',
			craterDiameter: '0',
			ejectaVolume: '0',
			seismicMagnitude: '0',
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
				className="col-xl-8 col-lg-7 col-md-6"
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
