import { useSRM } from './SRMContext';
import InputWrapper from '../forms/InputWrapper';
import NumberInput from '../forms/NumberInput';

export default function NozzleConfig() {
	const { config, updateNozzle } = useSRM();
	const nozzle = config.nozzle;

	const updateNozzleField = (updates: Partial<typeof nozzle>) => {
		updateNozzle({ ...nozzle, ...updates });
	};

	return (
		<div className="p-3 rounded border mb-3">
			<h5 className="mb-3">Nozzle Configuration</h5>

			<InputWrapper
				id="nozzle-mode"
				label="Sizing Mode"
				description={
					nozzle.mode === 'auto'
						? 'Automatically size throat for target pressure'
						: 'Manually specify nozzle dimensions'
				}
				input={
					<select
						className="form-select"
						value={nozzle.mode}
						onChange={(e) =>
							updateNozzleField({
								mode: e.target.value as 'manual' | 'auto',
							})
						}
					>
						<option value="auto">Auto-size</option>
						<option value="manual">Manual</option>
					</select>
				}
			/>

			{nozzle.mode === 'auto' ? (
				<>
					<InputWrapper
						id="target-pressure"
						label="Target Chamber Pressure"
						input={
							<NumberInput
								id="target-pressure"
								value={
									(nozzle.targetPressure || 13789520) /
									6894.76
								}
								min={100}
								max={10000}
								step={100}
								onChange={(val) =>
									updateNozzleField({
										targetPressure: val * 6894.76,
									})
								}
							/>
						}
						unit={
							<span className="input-group-text">psi</span>
						}
					/>

					<InputWrapper
						id="target-expansion"
						label="Expansion Ratio (ε)"
						tooltip="Leave blank for automatic optimization. Area ratio: exit area / throat area"
						input={
							<NumberInput
								id="target-expansion"
								value={nozzle.targetExpansion || 0}
								min={0}
								max={100}
								step={1}
								onChange={(val) =>
									updateNozzleField({
										targetExpansion: val > 0 ? val : undefined,
									})
								}
							/>
						}
						description={
							!nozzle.targetExpansion || nozzle.targetExpansion === 0
								? 'Auto (optimized for ambient pressure)'
								: undefined
						}
					/>

					{/* Display auto-calculated values if they exist */}
					{nozzle.throatDiameter && nozzle.throatDiameter > 0 && (
						<div className="alert alert-info mt-2">
							<small>
								<strong>Auto-sized dimensions:</strong>
								<br />
								Throat: {(nozzle.throatDiameter * 1000).toFixed(2)} mm (
								{(nozzle.throatDiameter / 0.0254).toFixed(3)} in)
								<br />
								Exit: {(nozzle.exitDiameter * 1000).toFixed(2)} mm (
								{(nozzle.exitDiameter / 0.0254).toFixed(3)} in)
								<br />
								Expansion: {((nozzle.exitDiameter / nozzle.throatDiameter) ** 2).toFixed(1)}:1
							</small>
						</div>
					)}
				</>
			) : (
				<>
					<InputWrapper
						id="throat-diameter"
						label="Throat Diameter"
						input={
							<NumberInput
								id="throat-diameter"
								value={nozzle.throatDiameter * 1000}
								min={1}
								max={100}
								step={0.1}
								onChange={(val) =>
									updateNozzleField({
										throatDiameter: val / 1000,
									})
								}
							/>
						}
						unit={
							<span className="input-group-text">mm</span>
						}
					/>

					<InputWrapper
						id="exit-diameter"
						label="Exit Diameter"
						input={
							<NumberInput
								id="exit-diameter"
								value={nozzle.exitDiameter * 1000}
								min={1}
								max={500}
								step={0.1}
								onChange={(val) =>
									updateNozzleField({
										exitDiameter: val / 1000,
									})
								}
							/>
						}
						unit={
							<span className="input-group-text">mm</span>
						}
					/>
				</>
			)}

			<InputWrapper
				id="discharge-coefficient"
				label="Discharge Coefficient (C<sub>d</sub>)"
				tooltip="Nozzle efficiency factor (typically 0.95-0.99)"
				input={
					<NumberInput
						id="discharge-coefficient"
						value={nozzle.Cd}
						min={0.8}
						max={1.0}
						step={0.01}
						onChange={(val) => updateNozzleField({ Cd: val })}
					/>
				}
			/>

			<InputWrapper
				id="ambient-pressure"
				label="Ambient Pressure"
				input={
					<NumberInput
						id="ambient-pressure"
						value={nozzle.ambientPressure / 6894.76}
						min={0}
						max={50}
						step={0.1}
						onChange={(val) =>
							updateNozzleField({ ambientPressure: val * 6894.76 })
						}
					/>
				}
				unit={<span className="input-group-text">psi</span>}
			/>
		</div>
	);
}
