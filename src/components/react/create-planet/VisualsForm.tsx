import React from 'react';
import InputWrapper from '../forms/InputWrapper';
import NumberInput from '../forms/NumberInput';
import SimpleUnit from '../forms/SimpleUnit';
import { usePlanet } from './PlanetContext';

export default function VisualsForm() {
	const {
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
				unit={<SimpleUnit unit="roughness" />}
			/>

			<InputWrapper
				id="seed"
				label="Seed"
				description="The seed for the planet generation"
				input={
					<NumberInput id="seed" value={seed} onChange={setSeed} />
				}
			/>
		</div>
	);
}
