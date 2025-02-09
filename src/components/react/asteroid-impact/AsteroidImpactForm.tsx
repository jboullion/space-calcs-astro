import React, { useState } from 'react';
import { useImpact } from './AsteroidImpactContext';

export default function AsteroidImpactForm() {
	const [activeTab, setActiveTab] = useState('asteroid');
	const {
		asteroid,
		setAsteroid,
		targetBody,
		setTargetBody,
		impactParams,
		setImpactParams,
	} = useImpact();

	const tabs = [
		{ value: 'asteroid', label: 'Asteroid' },
		{ value: 'target', label: 'Target Body' },
		{ value: 'impact', label: 'Impact Parameters' },
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
				{activeTab === 'asteroid' && (
					<div className="mb-3">
						<label className="form-label">
							Asteroid Diameter (m)
						</label>
						<input
							type="number"
							className="form-control"
							value={asteroid.diameter}
							onChange={(e) =>
								setAsteroid({
									...asteroid,
									diameter: parseFloat(e.target.value),
								})
							}
						/>
						{/* Add more asteroid parameters */}
					</div>
				)}

				{activeTab === 'target' && (
					<div className="mb-3">
						<label className="form-label">Target Type</label>
						<select
							className="form-select"
							value={targetBody.type}
							onChange={(e) =>
								setTargetBody({
									...targetBody,
									type: e.target.value as
										| 'planet'
										| 'asteroid',
								})
							}
						>
							<option value="planet">Planet</option>
							<option value="asteroid">Asteroid</option>
						</select>
						{/* Add more target body parameters */}
					</div>
				)}

				{activeTab === 'impact' && (
					<div className="mb-3">
						<label className="form-label">
							Impact Velocity (m/s)
						</label>
						<input
							type="number"
							className="form-control"
							value={impactParams.velocity}
							onChange={(e) =>
								setImpactParams({
									...impactParams,
									velocity: parseFloat(e.target.value),
								})
							}
						/>
						{/* Add more impact parameters */}
					</div>
				)}
			</form>
		</div>
	);
}
