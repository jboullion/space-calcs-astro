import React, { useState } from 'react';
import SizeForm from './SizeForm';
import AtmosphereForm from './AtmosphereForm';
import { usePlanet } from './PlanetContext';
import InputWrapper from '../forms/InputWrapper';
import { PLANET_PRESETS, PLANET_TYPES } from './constants';

export default function CreatePlanetForm() {
	const [activeTab, setActiveTab] = useState('surface');
	const {
		setRadius,
		setDensity,
		atmosphere,
		setAtmosphere,
		setWaterLevel,
		planetType,
		setPlanetType,
	} = usePlanet();

	const tabs = [
		{ value: 'surface', label: 'Surface' },
		{ value: 'atmosphere', label: 'Atmosphere' },
	];

	const handlePresetChange = (
		event: React.ChangeEvent<HTMLSelectElement>,
	) => {
		const localPlanetType = event.target.value;
		const preset =
			PLANET_PRESETS[localPlanetType as keyof typeof PLANET_PRESETS];
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
				clouds: preset.clouds,
			});
			setPlanetType(localPlanetType);
		}
	};

	return (
		<div className="p-2 rounded border mb-5">
			<InputWrapper
				id="planet-preset"
				label="Planet Type"
				description="Select a preset or customize values below"
				input={
					<select
						className="form-select"
						onChange={handlePresetChange}
					>
						{PLANET_TYPES.map(({ value, label }) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				}
			/>

			<div className="d-flex mb-4 gap-2">
				{tabs.map((tab) => (
					<button
						key={tab.value}
						className={`btn flex-grow-1 ${
							activeTab === tab.value
								? 'btn-primary'
								: 'btn-secondary'
						}`}
						onClick={() => setActiveTab(tab.value)}
					>
						{tab.label}
					</button>
				))}
			</div>
			<form className="calc-form">
				{activeTab === 'surface' && <SizeForm />}
				{activeTab === 'atmosphere' && (
					<AtmosphereForm
						atmosphere={atmosphere}
						onAtmosphereChange={setAtmosphere}
					/>
				)}
			</form>
		</div>
	);
}
