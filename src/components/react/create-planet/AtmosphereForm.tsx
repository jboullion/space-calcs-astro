import React, { useState } from 'react';
import InputWrapper from '../forms/InputWrapper';
import NumberInput from '../forms/NumberInput';
import SimpleUnit from '../forms/SimpleUnit';
import { ATMOSPHERIC_CONSTANTS } from './constants';
import type { AtmosphereProperties, CloudProperties } from './types';

// Helper function to validate and update gas composition
const updateGasComposition = (
	currentComposition: Record<string, number>,
	gasKey: string,
	newValue: number,
) => {
	const otherGasesTotal = Object.entries(currentComposition)
		.filter(([key]) => key !== gasKey && key !== 'other')
		.reduce((sum, [_, value]) => sum + value, 0);

	if (otherGasesTotal + newValue > 100) {
		return null;
	}

	const newOther = Math.max(0, 100 - otherGasesTotal - newValue);

	return {
		...currentComposition,
		[gasKey]: newValue,
		other: parseFloat(newOther.toFixed(2)),
	};
};

export default function AtmosphereForm({
	atmosphere,
	onAtmosphereChange,
}: {
	atmosphere: AtmosphereProperties;
	onAtmosphereChange: (atmosphere: AtmosphereProperties) => void;
}) {
	const [showAdvanced, setShowAdvanced] = useState(false);

	const defaultClouds: CloudProperties = {
		enabled: true,
		density: 0.8,
		coverage: 0.6,
		altitude: 0.02,
		speed: 1.0,
		color: '#FFFFFF', // Add default white color
		cloudSeed: Math.random() * 100,
	};

	const clouds = atmosphere.clouds || defaultClouds;

	const handleCloudPropertyChange = (
		property: keyof CloudProperties,
		value: number,
	) => {
		const updatedClouds = {
			...clouds,
			[property]: value,
		};

		onAtmosphereChange({
			...atmosphere,
			clouds: updatedClouds,
		});
	};

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
	};

	return (
		<div>
			<InputWrapper
				id="atmospheric-pressure"
				label="Surface Pressure"
				tooltip="Atmospheric pressure at the planet's surface"
				description="Earth = 1 atm, Mars = 0.006 atm, Jupiter ≈ 100+ atm"
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
						max={200}
						step={0.1}
						updateOnBlur={true}
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
				id="atmosphere-color"
				label="Atmosphere Color"
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

			{/* Cloud Properties */}
			<h5 className="mt-4 mb-3 cursor-default">Cloud Properties</h5>

			<InputWrapper
				id="cloud-density"
				label="Cloud Density"
				description="Higher values create thicker, more opaque clouds"
				input={
					<NumberInput
						id="cloud-density"
						value={clouds.density}
						onChange={(value) =>
							handleCloudPropertyChange('density', value)
						}
						min={0}
						max={5}
						step={0.1}
						updateOnBlur={true}
					/>
				}
			/>

			<InputWrapper
				id="cloud-speed"
				label="Cloud Movement Speed"
				description="Higher values create faster-moving cloud systems"
				input={
					<NumberInput
						id="cloud-speed"
						value={clouds.speed}
						onChange={(value) =>
							handleCloudPropertyChange('speed', value)
						}
						min={0}
						max={5}
						step={0.1}
						updateOnBlur={true}
					/>
				}
			/>

			<InputWrapper
				id="cloud-color"
				label="Cloud Color"
				description="Choose the color of the cloud layer"
				input={
					<input
						type="color"
						id="cloud-color"
						value={clouds.color || '#FFFFFF'}
						onChange={(e) => {
							const updatedClouds = {
								...clouds,
								color: e.target.value,
							};
							onAtmosphereChange({
								...atmosphere,
								clouds: updatedClouds,
							});
						}}
						className="form-control form-control-color"
					/>
				}
			/>

			{/* <InputWrapper
				id="cloud-seed"
				label="Cloud Seed"
				description="Random seed for cloud generation"
				input={
					<NumberInput
						id="cloud-seed"
						value={clouds.cloudSeed}
						onChange={(value) =>
							handleCloudPropertyChange('cloudSeed', value)
						}
						min={0}
						max={1000000}
						step={100}
					/>
				}
			/> */}

			{/* Advanced Toggle */}
			<div className="mb-3 mt-4">
				<button
					className="btn btn-secondary w-100"
					onClick={(e) => {
						e.preventDefault();
						setShowAdvanced(!showAdvanced);
					}}
				>
					{showAdvanced ? 'Hide' : 'Show'} Advanced Settings
				</button>
			</div>

			{/* Gas Composition (Advanced Section) */}
			{showAdvanced && (
				<div className="mt-4">
					<h4>Gas Composition</h4>
					<p>
						Values affect atmospheric mass, greenhouse effects, and
						opacity.
					</p>
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
							input={
								<NumberInput
									id={`${key}-percentage`}
									value={
										atmosphere.composition[
											key as keyof typeof atmosphere.composition
										] || 0
									}
									onChange={(value) =>
										handleGasChange(key, value)
									}
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
			)}
		</div>
	);
}
