import React, { useEffect } from 'react';
import { MoonPhaseProvider, useMoonPhase } from './MoonPhaseContext';
import MoonPhaseForm from './MoonPhaseForm';
import MoonPhaseVisualization from './MoonPhaseVisualization';
import MoonPhaseResults from './MoonPhaseResults';
import * as Astronomy from 'astronomy-engine';

// Main calculator component with astronomy-engine implementation
function MoonPhaseCalculator() {
	const { selectedDate, setMoonPhaseData } = useMoonPhase();

	// Calculate moon phase data using astronomy-engine
	useEffect(() => {
		// This is where we'll implement the astronomy-engine calculations
		const calculateMoonPhase = async () => {
			try {
				// Get illumination data
				const illum = Astronomy.Illumination('Moon', selectedDate);
				const illumination = illum.phase_fraction;

				// Get phase angle
				const phaseAngle = illum.phase_angle;

				// Determine phase name
				let phaseName = '';
				if (phaseAngle < 45) phaseName = 'New Moon';
				else if (phaseAngle < 90) phaseName = 'Waxing Crescent';
				else if (phaseAngle < 135) phaseName = 'First Quarter';
				else if (phaseAngle < 180) phaseName = 'Waxing Gibbous';
				else if (phaseAngle < 225) phaseName = 'Full Moon';
				else if (phaseAngle < 270) phaseName = 'Waning Gibbous';
				else if (phaseAngle < 315) phaseName = 'Last Quarter';
				else phaseName = 'Waning Crescent';

				// Calculate moon age (days since new moon)
				const newMoonBefore = Astronomy.SearchMoonPhase(
					0,
					selectedDate,
					-40,
				);

				// Check if newMoonBefore is a valid Date object and calculate moon age
				const moonAge =
					newMoonBefore instanceof Date
						? (selectedDate.getTime() - newMoonBefore.getTime()) /
						  (1000 * 60 * 60 * 24)
						: 0; // Default to 0 if calculation fails

				// Find next full and new moons
				const nextFullMoon = Astronomy.SearchMoonPhase(
					180,
					selectedDate,
					40,
				);
				const nextNewMoon = Astronomy.SearchMoonPhase(
					0,
					selectedDate,
					40,
				);

				// Extract the Date objects from the search results
				const nextFullMoonDate = nextFullMoon.time;
				const nextNewMoonDate = nextNewMoon.time;

				// Update context with calculated data
				setMoonPhaseData({
					date: selectedDate,
					illuminationPercent: illumination * 100,
					phaseAngle,
					phaseName,
					moonAge,
					nextFullMoon: nextFullMoonDate,
					nextNewMoon: nextNewMoonDate,
				});
			} catch (error) {
				console.error('Error calculating moon phase:', error);
			}
		};

		calculateMoonPhase();
	}, [selectedDate, setMoonPhaseData]);

	return (
		<div id="moon-phase__app" className="row calculator">
			<div id="moon-phase__form" className="col-xl-4 col-lg-5 col-md-6">
				<MoonPhaseForm />
			</div>
			<div
				id="moon-phase__results"
				className="col-xl-8 col-lg-7 col-md-6"
			>
				<MoonPhaseVisualization />
				<MoonPhaseResults />
			</div>
		</div>
	);
}

// Wrapper component that provides the context
export default function MoonPhase() {
	return (
		<MoonPhaseProvider>
			<MoonPhaseCalculator />
		</MoonPhaseProvider>
	);
}
