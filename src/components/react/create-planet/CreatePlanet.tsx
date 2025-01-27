import { useState, useMemo } from 'react';
import CreatePlanetForm from './CreatePlanetForm';
import CreatePlanetVisualization from './CreatePlanetVisualization';
import ResultTable from '../forms/ResultTable';
import CreatePlanetResults from './CreatePlanetResults';

// Physical constants
const G = 6.6743e-11; // Universal gravitational constant in m³/kg/s²

// Helper function to format numbers with proper units
function formatNumber(value: number, precision: number = 2): string {
	if (value === 0 || !isFinite(value)) return '0';
	if (Math.abs(value) < 0.01 || Math.abs(value) > 999999) {
		return value.toExponential(precision);
	}
	return value.toFixed(precision);
}

export default function CreatePlanet() {
	// Core planet parameters
	const [radius, setRadius] = useState(6371); // Default to Earth's radius
	const [density, setDensity] = useState(5500); // Default Earth-like density
	const [waterLevel, setWaterLevel] = useState(0);
	const [roughness, setRoughness] = useState(0.5);

	// Calculate derived properties
	const planetProperties = useMemo(() => {
		// Convert radius from km to m for calculations
		const radiusMeters = radius * 1000;

		// Only calculate if we have valid inputs
		if (radius <= 0 || density <= 0) {
			return {
				volume: '0',
				mass: '0',
				surfaceArea: '0',
				surfaceGravity: '0',
				escapeVelocity: '0',
			};
		}

		// Basic calculations
		const volume = (4 / 3) * Math.PI * Math.pow(radiusMeters, 3);
		const mass = volume * density;
		const surfaceArea = 4 * Math.PI * Math.pow(radiusMeters, 2);

		// Advanced calculations
		const surfaceGravity = (G * mass) / Math.pow(radiusMeters, 2);
		const escapeVelocity = Math.sqrt((2 * G * mass) / radiusMeters);

		return {
			volume: formatNumber(volume),
			mass: formatNumber(mass),
			surfaceArea: formatNumber(surfaceArea),
			surfaceGravity: formatNumber(surfaceGravity, 3),
			escapeVelocity: formatNumber(escapeVelocity / 1000, 3), // Convert to km/s
		};
	}, [radius, density]);

	return (
		<div id="create-planet__app" className="row calculator">
			<div
				id="create-planet__form"
				className="col-xl-4 col-lg-5 col-md-6"
			>
				<CreatePlanetForm
					radius={radius}
					density={density}
					waterLevel={waterLevel}
					roughness={roughness}
					onRadiusChange={setRadius}
					onDensityChange={setDensity}
					onWaterLevelChange={setWaterLevel}
					onRoughnessChange={setRoughness}
				/>
				<CreatePlanetResults planetProperties={planetProperties} />
			</div>
			<div
				id="create-planet__results"
				className="col-xl-8 col-lg-7 col-md-6"
			>
				<CreatePlanetVisualization
					radius={radius}
					waterLevel={waterLevel}
					roughness={roughness}
				/>
			</div>
		</div>
	);
}
