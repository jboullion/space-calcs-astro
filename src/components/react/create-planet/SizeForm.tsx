import React from 'react';
import InputWrapper from '../forms/InputWrapper';
import NumberInput from '../forms/NumberInput';
import SimpleUnit from '../forms/SimpleUnit';
import { usePlanet } from './PlanetContext';

export default function SizeForm() {
	const { radius, setRadius, density, setDensity } = usePlanet();

	return (
		<div>
			<InputWrapper
				id="radius"
				label="Planet Radius"
				tooltip="The radius of the planet from its center to its surface"
				description="Enter the radius of your planet (Earth = 6371 km, Mars = 3389 km, Moon = 1737 km)"
				input={
					<NumberInput
						id="radius"
						value={radius}
						onChange={setRadius}
						min={400} // Minimum radius (slightly smaller than Ceres)
						step={100}
					/>
				}
				unit={<SimpleUnit unit="km" />}
			/>

			<InputWrapper
				id="density"
				label="Average Density"
				tooltip="The average density of the planet's material"
				description="For reference: Earth ≈ 5500 kg/m³, Mars ≈ 3900 kg/m³"
				input={
					<NumberInput
						id="density"
						value={density}
						onChange={setDensity}
						min={1000}
						max={20000}
						step={100}
					/>
				}
				unit={<SimpleUnit unit="kg/m³" />}
			/>
		</div>
	);
}
