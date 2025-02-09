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
			atmosphere.composition.ch4 *
				ATMOSPHERIC_CONSTANTS.MOLECULAR_MASSES.CH4 +
			atmosphere.composition.h2o *
				ATMOSPHERIC_CONSTANTS.MOLECULAR_MASSES.H2O +
			atmosphere.composition.other *
				ATMOSPHERIC_CONSTANTS.MOLECULAR_MASSES.OTHER) /
		100;

	// Calculate scale height (in km)
	const scaleHeight =
		(ATMOSPHERIC_CONSTANTS.R * atmosphere.temperature) /
		(avgMolecularMass * 0.001 * surfaceGravity) /
		1000;

	// Calculate escape velocity threshold (in km/s)
	const escapeVelocity =
		Math.sqrt(
			(2 * ATMOSPHERIC_CONSTANTS.k * atmosphere.temperature) /
				((avgMolecularMass * 1e-3) / ATMOSPHERIC_CONSTANTS.AVOGADRO),
		) / 1000;

	// Enhanced greenhouse effect calculation
	const greenhouseEffect = (() => {
		// Base effect from CO2
		const co2Effect = Math.log(1 + atmosphere.composition.co2) * 6.5;

		// Water vapor feedback
		const waterEffect = Math.log(1 + atmosphere.composition.h2o) * 2.8;

		const ch4Effect = Math.log(1 + atmosphere.composition.ch4) * 20;

		// Pressure broadening effect
		const pressureEffect = Math.log(1 + atmosphere.pressure) * 1.2;

		// Combined greenhouse effect
		return (co2Effect + waterEffect + ch4Effect) * pressureEffect;
	})();

	// Calculate effective radiating temperature (K)
	const effectiveTemperature =
		atmosphere.temperature / Math.pow(1 + greenhouseEffect / 288, 0.25);

	// Estimate tropopause height (km)
	const tropopauseHeight = Math.min(
		50,
		7 + greenhouseEffect / 30 + Math.log(atmosphere.pressure) * 2,
	);

	// Calculate atmospheric mass
	const atmosphericMass =
		atmosphere.pressure *
		1.033e4 *
		4 *
		Math.PI *
		Math.pow(radius * 1000, 2);

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
			{/* <tr>
				<th>Tropopause Height</th>
				<td>{formatNumber(tropopauseHeight)} km</td>
			</tr> */}
			<tr>
				<th>Average Molecular Mass</th>
				<td>{formatNumber(avgMolecularMass)} g/mol</td>
			</tr>
			<tr>
				<th>Gas Retention Threshold</th>
				<td>{formatNumber(escapeVelocity)} km/s</td>
			</tr>
			<tr>
				<th>Greenhouse Effect</th>
				<td>{formatNumber(greenhouseEffect)} °C</td>
			</tr>
			<tr>
				<th>Effective Temperature</th>
				<td>{formatNumber(effectiveTemperature)} K</td>
			</tr>
			<tr>
				<th className="border-bottom-0">Atmospheric Mass</th>
				<td className="border-bottom-0">
					{formatNumber(atmosphericMass)} kg
				</td>
			</tr>
		</ResultTable>
	);
};

export default AtmosphereResults;
