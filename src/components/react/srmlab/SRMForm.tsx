import { useSRM } from './SRMContext';
import { useState } from 'react';
import PropellantSelector from './PropellantSelector';
import GrainStackBuilder from './GrainStackBuilder';
import NozzleConfig from './NozzleConfig';
import InputWrapper from '../forms/InputWrapper';
import NumberInput from '../forms/NumberInput';

export default function SRMForm() {
	const { config, updateCaseInnerDiameter, updateFreeVolume, runSimulation, isSimulating } = useSRM();
	const [activeTab, setActiveTab] = useState('grain');

	return (
		<div className="calc-form">
			{/* Tab Navigation */}
			<ul className="nav nav-tabs mb-3" role="tablist">
				<li className="nav-item" role="presentation">
					<button
						className={`nav-link ${activeTab === 'grain' ? 'active' : ''}`}
						onClick={() => setActiveTab('grain')}
						type="button"
					>
						<i className="fas fa-layer-group me-1"></i>
						Grain Stack
					</button>
				</li>
				<li className="nav-item" role="presentation">
					<button
						className={`nav-link ${activeTab === 'case' ? 'active' : ''}`}
						onClick={() => setActiveTab('case')}
						type="button"
					>
						<i className="fas fa-box me-1"></i>
						Motor Case
					</button>
				</li>
				<li className="nav-item" role="presentation">
					<button
						className={`nav-link ${activeTab === 'propellant' ? 'active' : ''}`}
						onClick={() => setActiveTab('propellant')}
						type="button"
					>
						<i className="fas fa-fire me-1"></i>
						Propellant
					</button>
				</li>
				
				<li className="nav-item" role="presentation">
					<button
						className={`nav-link ${activeTab === 'nozzle' ? 'active' : ''}`}
						onClick={() => setActiveTab('nozzle')}
						type="button"
					>
						<i className="fas fa-stream me-1"></i>
						Nozzle
					</button>
				</li>
			</ul>

			{/* Tab Content */}
			<div className="tab-content mb-3">
				{/* Grain Stack Tab */}
				<div className={`tab-pane fade ${activeTab === 'grain' ? 'show active' : ''}`}>
					<GrainStackBuilder />
				</div>

				{/* Motor Case Tab */}
				<div className={`tab-pane fade ${activeTab === 'case' ? 'show active' : ''}`}>
					<div className="p-3 rounded border">
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
				</div>

				{/* Propellant Tab */}
				<div className={`tab-pane fade ${activeTab === 'propellant' ? 'show active' : ''}`}>
					<PropellantSelector />
				</div>

				{/* Nozzle Tab */}
				<div className={`tab-pane fade ${activeTab === 'nozzle' ? 'show active' : ''}`}>
					<NozzleConfig />
				</div>
			</div>

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
