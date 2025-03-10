import React, { useEffect, useState } from 'react';
import { useMoonPhase } from './MoonPhaseContext';
import ResultTable from '../forms/ResultTable';
import * as Astronomy from 'astronomy-engine';

interface RiseSetTimes {
	moonrise: string | null;
	moonset: string | null;
}

const MoonPhaseResults: React.FC = () => {
	const { moonPhaseData, location, selectedDate } = useMoonPhase();
	const [riseSetTimes, setRiseSetTimes] = useState<RiseSetTimes>({
		moonrise: null,
		moonset: null,
	});

	// Calculate moonrise and moonset times when location changes
	useEffect(() => {
		const calculateRiseSetTimes = () => {
			if (!location) return;

			try {
				// Create an observer at the specified location
				const observer = new Astronomy.Observer(
					location.latitude,
					location.longitude,
					0, // elevation in meters
				);

				// Calculate the moonrise time for the selected date
				const searchRise = Astronomy.SearchRiseSet(
					'Moon',
					observer,
					1, // RISE
					selectedDate,
					1, // search 1 day ahead max
				);

				// Calculate the moonset time for the selected date
				const searchSet = Astronomy.SearchRiseSet(
					'Moon',
					observer,
					2, // SET
					selectedDate,
					1, // search 1 day ahead max
				);

				// Format the times
				const formatTime = (date: Date): string => {
					return date.toLocaleTimeString('en-US', {
						hour: '2-digit',
						minute: '2-digit',
						hour12: true,
					});
				};

				setRiseSetTimes({
					moonrise: searchRise
						? formatTime(searchRise.time)
						: 'Not visible',
					moonset: searchSet
						? formatTime(searchSet.time)
						: 'Not visible',
				});
			} catch (error) {
				console.error('Error calculating moonrise/moonset:', error);
				setRiseSetTimes({
					moonrise: 'Error calculating',
					moonset: 'Error calculating',
				});
			}
		};

		calculateRiseSetTimes();
	}, [location, selectedDate]);

	if (!moonPhaseData) {
		return (
			<div className="alert alert-info">Loading moon phase data...</div>
		);
	}

	const formatDate = (date: Date): string => {
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	return (
		<div>
			<ResultTable title={<h4>Moon Phase Information</h4>}>
				<tr>
					<th>Date</th>
					<td>{formatDate(moonPhaseData.date)}</td>
				</tr>
				<tr>
					<th>Phase</th>
					<td>{moonPhaseData.phaseName}</td>
				</tr>
				<tr>
					<th>Illumination</th>
					<td>{moonPhaseData.illuminationPercent.toFixed(1)}%</td>
				</tr>
				<tr>
					<th>Moon Age</th>
					<td>{moonPhaseData.moonAge.toFixed(1)} days</td>
				</tr>
				<tr>
					<th>Next Full Moon</th>
					<td>{formatDate(moonPhaseData.nextFullMoon)}</td>
				</tr>
				<tr>
					<th className="border-bottom-0">Next New Moon</th>
					<td className="border-bottom-0">
						{formatDate(moonPhaseData.nextNewMoon)}
					</td>
				</tr>
			</ResultTable>

			{location && (
				<ResultTable title={<h4>Location Information</h4>}>
					<tr>
						<th>Latitude</th>
						<td>{location.latitude.toFixed(4)}°</td>
					</tr>
					<tr>
						<th>Longitude</th>
						<td>{location.longitude.toFixed(4)}°</td>
					</tr>
					<tr>
						<th>Moonrise</th>
						<td>{riseSetTimes.moonrise}</td>
					</tr>
					<tr>
						<th className="border-bottom-0">Moonset</th>
						<td className="border-bottom-0">
							{riseSetTimes.moonset}
						</td>
					</tr>
				</ResultTable>
			)}
		</div>
	);
};

export default MoonPhaseResults;
