import React, { useState } from 'react';
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
	atmosphere,
	onRadiusChange,
	onDensityChange,
	onWaterLevelChange,
	onRoughnessChange,
	onSeedChange,
	onAtmosphereChange,
}: CreatePlanetFormProps) {
	const [activeTab, setActiveTab] = useState('size');

	const tabs = [
		{ value: 'size', label: 'Size' },
		{ value: 'visuals', label: 'Visuals' },
		{ value: 'atmosphere', label: 'Atmosphere' },
	];

	return (
		<div className="p-2 rounded border mb-5">
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
				{activeTab === 'size' && (
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
					</div>
				)}

				{activeTab === 'visuals' && (
					<div>
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
					</div>
				)}

				{activeTab === 'atmosphere' && (
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
							id="n2-percentage"
							label="Nitrogen (N₂)"
							input={
								<NumberInput
									id="n2-percentage"
									value={atmosphere.composition.n2}
									onChange={(value) =>
										onAtmosphereChange({
											...atmosphere,
											composition: {
												...atmosphere.composition,
												n2: value,
												other: Math.max(
													0,
													100 -
														value -
														atmosphere.composition
															.o2 -
														atmosphere.composition
															.co2 -
														atmosphere.composition
															.h2o,
												),
											},
										})
									}
									min={0}
									max={100}
									step={0.1}
								/>
							}
							unit={<SimpleUnit unit="%" />}
						/>

						<InputWrapper
							id="o2-percentage"
							label="Oxygen (O₂)"
							input={
								<NumberInput
									id="o2-percentage"
									value={atmosphere.composition.o2}
									onChange={(value) =>
										onAtmosphereChange({
											...atmosphere,
											composition: {
												...atmosphere.composition,
												o2: value,
												other: Math.max(
													0,
													100 -
														atmosphere.composition
															.n2 -
														atmosphere.composition
															.co2 -
														atmosphere.composition
															.h2o -
														value,
												),
											},
										})
									}
									min={0}
									max={100}
									step={0.1}
								/>
							}
							unit={<SimpleUnit unit="%" />}
						/>

						<InputWrapper
							id="co2-percentage"
							label="Carbon Dioxide (CO₂)"
							input={
								<NumberInput
									id="co2-percentage"
									value={atmosphere.composition.co2}
									onChange={(value) =>
										onAtmosphereChange({
											...atmosphere,
											composition: {
												...atmosphere.composition,
												co2: value,
												other: Math.max(
													0,
													100 -
														atmosphere.composition
															.n2 -
														atmosphere.composition
															.o2 -
														atmosphere.composition
															.h2o -
														value,
												),
											},
										})
									}
									min={0}
									max={100}
									step={0.1}
								/>
							}
							unit={<SimpleUnit unit="%" />}
						/>

						<InputWrapper
							id="h2o-percentage"
							label="Water (H₂O)"
							input={
								<NumberInput
									id="h2o-percentage"
									value={atmosphere.composition.h2o}
									onChange={(value) =>
										onAtmosphereChange({
											...atmosphere,
											composition: {
												...atmosphere.composition,
												h2o: value,
												other: Math.max(
													0,
													100 -
														atmosphere.composition
															.n2 -
														atmosphere.composition
															.o2 -
														atmosphere.composition
															.co2 -
														value,
												),
											},
										})
									}
									min={0}
									max={100}
									step={0.1}
								/>
							}
							unit={<SimpleUnit unit="%" />}
						/>

						<InputWrapper
							id="other-percentage"
							label="Other Gases"
							description="Automatically calculated from remaining percentage"
							input={
								<NumberInput
									id="other-percentage"
									value={atmosphere.composition.other}
									disabled={true}
									min={-100}
									max={100}
									step={0.1}
									onChange={function (value: number): void {
										console.warn(
											'Other Percentage currently has no effect',
										);
									}}
								/>
							}
							unit={<SimpleUnit unit="%" />}
						/>
					</div>
				)}
			</form>
		</div>
	);
}
