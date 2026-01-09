import React, { useState, useMemo } from 'react';
import SizeForm from './SizeForm';
import AtmosphereForm from './AtmosphereForm';
import GasVisualsForm from './GasVisualsForm';
import { usePlanet } from './PlanetContext';
import InputWrapper from '../forms/InputWrapper';
import { PLANET_PRESETS, PLANET_TYPES } from './constants';
import GasPropertiesForm from './GasPropertiesForm';

export default function CreatePlanetForm() {
	const {
		setRadius,
		setDensity,
		atmosphere,
		setAtmosphere,
		setWaterLevel,
		planetType,
		setPlanetType,
	} = usePlanet();

	const isGasGiant = useMemo(() => {
		return ['gas_giant', 'ice_giant'].includes(planetType);
	}, [planetType]);

	// Set default active tab based on planet type
	const [activeTab, setActiveTab] = useState(
		isGasGiant ? 'gas-visuals' : 'surface',
	);

	// Define tabs based on planet type
	const tabs = useMemo(() => {
		if (isGasGiant) {
			return [
				{ value: 'gas-visuals', label: 'Gas Visuals' },
				{ value: 'gas-properties', label: 'Gas Properties' },
			];
		}
		return [
			{ value: 'surface', label: 'Surface' },
			{ value: 'atmosphere', label: 'Atmosphere' },
		];
	}, [isGasGiant]);

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

			// Handle atmosphere and gas giant visuals together
			setAtmosphere({
				...atmosphere,
				pressure: preset.atmosphere,
				composition: preset.composition,
				customColor: preset.atmosphereColor,
				temperature: preset.temperature,
				clouds: preset.clouds,
				// Include gas giant visuals if they exist in the preset
				gasGiantVisuals: preset.gasGiantVisuals || {
					bandCount: 8,
					rotationSpeed: 1.0,
					bandColors: [
						'#C88B3A',
						'#B87A30',
						'#D89C4A',
						'#A86920',
						'#C88B3A',
						'#B87A30',
						'#D89C4A',
						'#A86920',
					],
					bandBlending: 0.4,
				},
			});
			setPlanetType(localPlanetType);

			// Set appropriate default tab when changing planet type
			setActiveTab(
				['gas_giant', 'ice_giant'].includes(localPlanetType)
					? 'gas-visuals'
					: 'surface',
			);
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
						value={planetType}
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
				{activeTab === 'gas-visuals' && <GasVisualsForm />}
				{activeTab === 'gas-properties' && <GasPropertiesForm />}
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
