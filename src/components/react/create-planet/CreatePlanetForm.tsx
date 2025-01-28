import React, { useState } from 'react';
import SizeForm from './SizeForm';
import VisualsForm from './VisualsForm';
import AtmosphereForm from './AtmosphereForm';
import { usePlanet } from './PlanetContext';

export default function CreatePlanetForm() {
	const [activeTab, setActiveTab] = useState('size');
	const { atmosphere, setAtmosphere } = usePlanet();

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
				{activeTab === 'size' && <SizeForm />}
				{activeTab === 'visuals' && <VisualsForm />}
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
