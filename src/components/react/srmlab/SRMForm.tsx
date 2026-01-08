import { useSRM } from './SRMContext';
import PropellantSelector from './PropellantSelector';
import GrainStackBuilder from './GrainStackBuilder';
import NozzleConfig from './NozzleConfig';
import InputWrapper from '../forms/InputWrapper';
import NumberInput from '../forms/NumberInput';

export default function SRMForm() {
	const { config, updateCaseInnerDiameter, updateFreeVolume, runSimulation, isSimulating } = useSRM();

	return (
		<div className="calc-form">
			{/* Motor Case Section */}
			<div className="p-2 rounded border mb-3">
				<h5 className="mb-3">Motor Case</h5>

				<InputWrapper
					id="case-diameter"
					label="Case Inner Diameter"
					description="Internal diameter of motor casing"
					input={
						<NumberInput
							id="case-diameter"
							value={config.caseInnerDiameter * 1000}
							min={10}
							max={500}
							step={1}
							onChange={(val) => updateCaseInnerDiameter(val / 1000)}
						/>
					}
					unit={<span className="input-group-text">mm</span>}
				/>

				<InputWrapper
					id="free-volume"
					label="Free Volume"
					description="Head-end free volume"
					input={
						<NumberInput
							id="free-volume"
							value={config.freeVolume * 1e6}
							min={0}
							max={10000}
							step={10}
							onChange={(val) => updateFreeVolume(val / 1e6)}
						/>
					}
					unit={<span className="input-group-text">cm³</span>}
				/>
			</div>

			{/* Propellant Selection */}
			<PropellantSelector />

			{/* Grain Stack Builder */}
			<GrainStackBuilder />

			{/* Nozzle Configuration */}
			<NozzleConfig />

			{/* Simulate Button */}
			<button
				className="btn btn-primary btn-lg w-100 mb-3"
				disabled={config.grainStack.length === 0 || isSimulating}
				onClick={runSimulation}
			>
				{isSimulating ? (
					<>
						<span
							className="spinner-border spinner-border-sm me-2"
							role="status"
							aria-hidden="true"
						></span>
						Simulating...
					</>
				) : (
					<>
						<i className="fas fa-rocket me-2"></i>
						Run Simulation
					</>
				)}
			</button>

			{config.grainStack.length === 0 && (
				<p className="text-muted text-center">
					<small>
						<i className="fas fa-info-circle me-1"></i>
						Add grain segments to enable simulation
					</small>
				</p>
			)}
		</div>
	);
}
