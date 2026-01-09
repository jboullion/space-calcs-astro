import React from 'react';
import InputWrapper from '../forms/InputWrapper';
import NumberInput from '../forms/NumberInput';
import SimpleUnit from '../forms/SimpleUnit';
import { usePlanet } from './PlanetContext';

export default function GasGiantPropertiesForm() {
	const { radius, setRadius, density, setDensity } = usePlanet();

	return (
		<div>
			<InputWrapper
				id="radius"
				label="Planet Radius"
				tooltip="The radius of the gas giant from its center to its 1 bar pressure level"
				description="Jupiter = 69,911 km, Saturn = 58,232 km"
				input={
					<NumberInput
						id="radius"
						value={radius}
						onChange={setRadius}
						min={15000}
						max={200000}
						step={1000}
						updateOnBlur={true}
					/>
				}
				unit={<SimpleUnit unit="km" />}
			/>

			<InputWrapper
				id="density"
				label="Average Density"
				tooltip="The average density of the gas giant"
				description="Jupiter ≈ 1,326 kg/m³, Saturn ≈ 687 kg/m³"
				input={
					<NumberInput
						id="density"
						value={density}
						onChange={setDensity}
						min={500}
						max={2000}
						step={10}
						updateOnBlur={true}
					/>
				}
				unit={<SimpleUnit unit="kg/m³" />}
			/>

			<InputWrapper
				id="core-pressure"
				label="Core Pressure"
				tooltip="Estimated pressure at the planet's core"
				description="Read only - calculated from mass and radius"
				input={
					<NumberInput
						id="core-pressure"
						value={calculateCorePressure(radius, density)}
						disabled={true}
						onChange={() => {}}
					/>
				}
				unit={<SimpleUnit unit="MPa" />}
			/>
		</div>
	);
}

// Helper function to estimate core pressure
function calculateCorePressure(radius: number, density: number): number {
	const G = 6.6743e-11; // gravitational constant
	const radiusMeters = radius * 1000;
	const mass = (4 / 3) * Math.PI * Math.pow(radiusMeters, 3) * density;

	// Simplified pressure calculation using P = GMρ/R
	// This is a rough approximation
	const pressure = (G * mass * density) / radiusMeters;

	// Convert to MPa and round to reasonable precision
	return Math.round(pressure / 1e6);
}
