import React from 'react';
import InputWrapper from '../forms/InputWrapper';
import NumberInput from '../forms/NumberInput';
import SimpleUnit from '../forms/SimpleUnit';
import { usePlanet } from './PlanetContext';
import { PLANET_PRESETS } from './constants';

export default function SizeForm() {
	const {
		radius,
		setRadius,
		density,
		setDensity,
		atmosphere,
		setAtmosphere,
		setWaterLevel,
	} = usePlanet();

	const handlePresetChange = (
		event: React.ChangeEvent<HTMLSelectElement>,
	) => {
		const preset =
			PLANET_PRESETS[event.target.value as keyof typeof PLANET_PRESETS];
		if (preset) {
			setRadius(preset.radius);
			setDensity(preset.density);
			setWaterLevel(preset.waterLevel);
			setAtmosphere({
				...atmosphere,
				pressure: preset.atmosphere,
				composition: preset.composition,
				customColor: preset.atmosphereColor,
				temperature: preset.temperature,
			});
		}
	};

	return (
		<div>
			<InputWrapper
				id="planet-preset"
				label="Planet Type"
				description="Select a preset or customize values below"
				input={
					<select
						className="form-select"
						onChange={handlePresetChange}
					>
						<option value="">Custom</option>
						<option value="earth">Earth-like</option>
						<option value="jupiter">Gas Giant</option>
						<option value="mars">Mars-like</option>
						<option value="venus">Venus-like</option>
					</select>
				}
			/>

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
		</div>
	);
}
