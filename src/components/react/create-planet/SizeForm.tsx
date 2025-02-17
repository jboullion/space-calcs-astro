import React from 'react';
import InputWrapper from '../forms/InputWrapper';
import NumberInput from '../forms/NumberInput';
import SimpleUnit from '../forms/SimpleUnit';
import { usePlanet } from './PlanetContext';
import SurfaceColorsForm from './SurfaceColorsForm';

export default function SizeForm() {
	const {
		radius,
		setRadius,
		density,
		setDensity,
		waterLevel,
		setWaterLevel,
		roughness,
		setRoughness,
		seed,
		setSeed,
	} = usePlanet();

	return (
		<div>
			<InputWrapper
				id="radius"
				label="Planet Radius"
				tooltip="The radius of the planet from its center to its surface"
				description="Earth = 6371 km, Jupiter = 69911 km"
				input={
					<NumberInput
						id="radius"
						value={radius}
						onChange={setRadius}
						min={400}
						max={75000}
						step={100}
					/>
				}
				unit={<SimpleUnit unit="km" />}
			/>

			<InputWrapper
				id="density"
				label="Average Density"
				tooltip="The average density of the planet's material"
				description="Earth ≈ 5500 kg/m³, Jupiter ≈ 1326 kg/m³"
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

			<InputWrapper
				id="waterLevel"
				label="Water Level"
				description=""
				input={
					<NumberInput
						id="waterLevel"
						value={waterLevel}
						onChange={setWaterLevel}
						min={0}
						max={100}
						step={1}
					/>
				}
			/>

			<InputWrapper
				id="roughness"
				label="Surface Roughness"
				tooltip="Controls the amount of terrain variation"
				description="0 is smooth, 1 is very rough"
				input={
					<NumberInput
						id="roughness"
						value={roughness}
						onChange={setRoughness}
						min={0}
						max={1}
						step={0.1}
					/>
				}
			/>

			<InputWrapper
				id="seed"
				label="Surface Seed"
				description="The seed for the planet generation"
				input={
					<NumberInput id="seed" value={seed} onChange={setSeed} />
				}
			/>

			<SurfaceColorsForm />
		</div>
	);
}
