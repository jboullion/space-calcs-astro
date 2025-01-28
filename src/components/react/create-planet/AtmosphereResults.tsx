import React from 'react';
import ResultTable from '../forms/ResultTable';
import type { AtmosphereProperties } from './types';
import { ATMOSPHERIC_CONSTANTS } from './constants';

interface AtmosphereResultsProps {
	atmosphere: AtmosphereProperties;
	radius: number;
	surfaceGravity: number;
}

const AtmosphereResults: React.FC<AtmosphereResultsProps> = ({
	atmosphere,
	radius,
	surfaceGravity,
}) => {
	// Calculate average molecular mass
	const avgMolecularMass =
		(atmosphere.composition.n2 * ATMOSPHERIC_CONSTANTS.MOLECULAR_MASSES.N2 +
			atmosphere.composition.o2 *
				ATMOSPHERIC_CONSTANTS.MOLECULAR_MASSES.O2 +
			atmosphere.composition.co2 *
				ATMOSPHERIC_CONSTANTS.MOLECULAR_MASSES.CO2 +
			atmosphere.composition.other *
				ATMOSPHERIC_CONSTANTS.MOLECULAR_MASSES.OTHER) /
		100;

	// Calculate scale height (in km)
	const scaleHeight =
		(ATMOSPHERIC_CONSTANTS.R * atmosphere.temperature) /
		(avgMolecularMass * 0.001 * surfaceGravity) /
		1000;

	// Calculate escape velocity threshold (in km/s)
	const escapeThreshold =
		Math.sqrt(
			(2 * ATMOSPHERIC_CONSTANTS.k * atmosphere.temperature) /
				((avgMolecularMass * 1e-3) / 6.022e23),
		) / 1000;

	// Estimate greenhouse effect strength (simplified model)
	const greenhouseStrength =
		atmosphere.pressure * (atmosphere.composition.co2 / 100) * 0.5;

	// Format numbers nicely
	const formatNumber = (num: number, precision: number = 2) => {
		if (num === 0) return '0';
		if (num < 0.01 || num > 999999) return num.toExponential(precision);
		return num.toFixed(precision);
	};

	return (
		<ResultTable title={<h4>Atmosphere Properties</h4>}>
			<tr>
				<th>Scale Height</th>
				<td>{formatNumber(scaleHeight)} km</td>
			</tr>
			<tr>
				<th>Average Molecular Mass</th>
				<td>{formatNumber(avgMolecularMass)} g/mol</td>
			</tr>
			<tr>
				<th>Gas Retention Threshold</th>
				<td>{formatNumber(escapeThreshold)} km/s</td>
			</tr>
			<tr>
				<th>Greenhouse Effect</th>
				<td>{formatNumber(greenhouseStrength)} °C</td>
			</tr>
			<tr>
				<th className="border-bottom-0">Atmospheric Mass</th>
				<td className="border-bottom-0">
					{formatNumber(
						atmosphere.pressure *
							1.033e4 *
							4 *
							Math.PI *
							Math.pow(radius * 1000, 2),
					)}{' '}
					kg
				</td>
			</tr>
		</ResultTable>
	);
};

export default AtmosphereResults;
