import React, { useState } from 'react';
import InputWrapper from '../forms/InputWrapper';
import NumberInput from '../forms/NumberInput';
import SimpleUnit from '../forms/SimpleUnit';
import { ATMOSPHERIC_CONSTANTS } from './constants';
import type { AtmosphereProperties } from './types';

// Helper function to validate and update gas composition
const updateGasComposition = (
	currentComposition: Record<string, number>,
	gasKey: string,
	newValue: number,
) => {
	// Calculate total of all gases except the one being updated and 'other'
	const otherGasesTotal = Object.entries(currentComposition)
		.filter(([key]) => key !== gasKey && key !== 'other')
		.reduce((sum, [_, value]) => sum + value, 0);

	// Check if the new value would exceed 100% when added to other gases
	if (otherGasesTotal + newValue > 100) {
		return null; // Return null to indicate invalid update
	}

	// Calculate the new 'other' value
	const newOther = Math.max(0, 100 - otherGasesTotal - newValue);

	// Return the updated composition
	return {
		...currentComposition,
		[gasKey]: newValue,
		other: newOther,
	};
};

export default function AtmosphereForm({
	atmosphere,
	onAtmosphereChange,
}: {
	atmosphere: AtmosphereProperties;
	onAtmosphereChange: (atmosphere: AtmosphereProperties) => void;
}) {
	const [cloudSeed, setCloudSeed] = useState(
		Math.floor(Math.random() * 1000000),
	);

	const handleGasChange = (gasKey: string, value: number) => {
		const newComposition = updateGasComposition(
			atmosphere.composition,
			gasKey,
			value,
		);
		if (newComposition) {
			onAtmosphereChange({
				...atmosphere,
				composition:
					newComposition as AtmosphereProperties['composition'],
			});
		}
		// If newComposition is null, the update was invalid and we don't update the state
	};

	return (
		<div>
			<InputWrapper
				id="atmospheric-pressure"
				label="Surface Pressure"
				tooltip="Atmospheric pressure at the planet's surface"
				description="Earth = 1 atm, Mars = 0.006 atm, Venus = 92 atm"
				input={
					<NumberInput
						id="atmospheric-pressure"
						value={atmosphere.pressure}
						onChange={(value) =>
							onAtmosphereChange({
								...atmosphere,
								pressure: value,
							})
						}
						min={0}
						max={100}
						step={0.1}
					/>
				}
				unit={<SimpleUnit unit="atm" />}
			/>

			<InputWrapper
				id="surface-temperature"
				label="Surface Temperature"
				tooltip="Average surface temperature of the planet"
				description="Earth = 288K, Mars = 210K, Venus = 737K"
				input={
					<NumberInput
						id="surface-temperature"
						value={atmosphere.temperature}
						onChange={(value) =>
							onAtmosphereChange({
								...atmosphere,
								temperature: value,
							})
						}
						min={50}
						max={1000}
						step={1}
					/>
				}
				unit={<SimpleUnit unit="K" />}
			/>

			<InputWrapper
				id="opacity-toggle"
				label="Full Opacity"
				tooltip="Allow atmosphere to fully obscure the surface"
				input={
					<div className="form-check form-switch">
						<input
							className="form-check-input"
							type="checkbox"
							id="opacity-toggle"
							checked={atmosphere.fullOpacity || false}
							onChange={(e) =>
								onAtmosphereChange({
									...atmosphere,
									fullOpacity: e.target.checked,
								})
							}
						/>
					</div>
				}
			/>

			<InputWrapper
				id="atmosphere-color"
				label="Atmosphere Color"
				tooltip="Color of the atmosphere"
				input={
					<input
						type="color"
						id="atmosphere-color"
						value={atmosphere.customColor || '#88AAFF'}
						onChange={(e) => {
							onAtmosphereChange({
								...atmosphere,
								customColor: e.target.value,
							});
						}}
						className="form-control form-control-color"
					/>
				}
			/>

			<InputWrapper
				id="cloud-seed"
				label="Cloud Seed"
				tooltip="Random seed for cloud generation"
				description="Change this value to generate different cloud patterns"
				input={
					<NumberInput
						id="cloud-seed"
						value={cloudSeed}
						onChange={(value) => {
							setCloudSeed(value);
							onAtmosphereChange({
								...atmosphere,
								cloudSeed: value,
							});
						}}
						min={0}
						max={999999}
						step={1}
					/>
				}
			/>

			{/* Gas composition inputs */}
			{[
				{
					key: 'n2',
					label: 'Nitrogen (N₂)',
					mass: ATMOSPHERIC_CONSTANTS.MOLECULAR_MASSES.N2,
				},
				{
					key: 'o2',
					label: 'Oxygen (O₂)',
					mass: ATMOSPHERIC_CONSTANTS.MOLECULAR_MASSES.O2,
				},
				{
					key: 'co2',
					label: 'Carbon Dioxide (CO₂)',
					mass: ATMOSPHERIC_CONSTANTS.MOLECULAR_MASSES.CO2,
				},
				{
					key: 'ch4',
					label: 'Methane (CH₄)',
					mass: ATMOSPHERIC_CONSTANTS.MOLECULAR_MASSES.CH4,
				},
				{
					key: 'h2o',
					label: 'Water Vapor (H₂O)',
					mass: ATMOSPHERIC_CONSTANTS.MOLECULAR_MASSES.H2O,
				},
			].map(({ key, label, mass }) => (
				<InputWrapper
					key={key}
					id={`${key}-percentage`}
					label={label}
					tooltip={`Molecular mass: ${mass} g/mol`}
					input={
						<NumberInput
							id={`${key}-percentage`}
							value={
								atmosphere.composition[
									key as keyof typeof atmosphere.composition
								] || 0
							}
							onChange={(value) => handleGasChange(key, value)}
							min={0}
							max={100}
							step={0.1}
						/>
					}
					unit={<SimpleUnit unit="%" />}
				/>
			))}

			<InputWrapper
				id="other-percentage"
				label="Other Gases"
				description="Automatically calculated from remaining percentage"
				input={
					<NumberInput
						id="other-percentage"
						value={atmosphere.composition.other}
						disabled={true}
						min={0}
						max={100}
						step={0.1}
						onChange={() => {}}
					/>
				}
				unit={<SimpleUnit unit="%" />}
			/>
		</div>
	);
}
