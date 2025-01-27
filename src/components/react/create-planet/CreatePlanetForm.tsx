import React from 'react';
import InputWrapper from '../forms/InputWrapper';
import NumberInput from '../forms/NumberInput';
import SimpleUnit from '../forms/SimpleUnit';
import type { CreatePlanetFormProps } from './types';

export default function CreatePlanetForm({
	radius,
	density,
	waterLevel,
	roughness,
	seed,
	onRadiusChange,
	onDensityChange,
	onWaterLevelChange,
	onRoughnessChange,
	onSeedChange,
}: CreatePlanetFormProps) {
	return (
		<div className="p-2 rounded border mb-5">
			<form className="calc-form">
				<InputWrapper
					id="radius"
					label="Planet Radius"
					tooltip="The radius of the planet from its center to its surface"
					description="Enter the radius of your planet (Earth = 6371 km, Mars = 3389 km, Moon = 1737 km)"
					input={
						<NumberInput
							id="radius"
							value={radius}
							onChange={onRadiusChange}
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
							onChange={onDensityChange}
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
							onChange={onWaterLevelChange}
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
							onChange={onRoughnessChange}
							min={0}
							max={1}
							step={0.1}
						/>
					}
					unit={<SimpleUnit unit="roughness" />}
				/>

				<InputWrapper
					id="seed"
					label="Seed"
					description="The seed for the planet generation"
					input={
						<NumberInput
							id="seed"
							value={seed}
							onChange={onSeedChange}
						/>
					}
				/>
			</form>
		</div>
	);
}
