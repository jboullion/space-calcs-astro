import { useSRM } from './SRMContext';
import ResultTable from '../forms/ResultTable';
import { formatNumber, addCommas } from './constants';

export default function SRMResults() {
	const { results, isSimulating } = useSRM();

	if (isSimulating) {
		return (
			<div className="p-5 text-center">
				<i className="fas fa-rocket fa-spin fa-3x mb-3 text-primary"></i>
				<p className="text-muted">Running simulation...</p>
			</div>
		);
	}

	if (!results) {
		return (
			<div className="p-5 text-center text-muted">
				<i className="fas fa-chart-line fa-3x mb-3"></i>
				<p className="mb-0">Run simulation to see results</p>
			</div>
		);
	}

	return (
		<>
			<ResultTable
				title={
					<h5 className="mb-3">
						<i className="fas fa-chart-bar me-2"></i>
						Performance Summary
					</h5>
				}
			>
				<tr>
					<th>Motor Class</th>
					<td className="text-end">
						<strong>{results.designation || '--'}</strong>
					</td>
					<td style={{ width: '80px' }}>
						<span className="text-muted"></span>
					</td>
				</tr>
				<tr>
					<th>Total Impulse</th>
					<td className="text-end">
						{results.totalImpulse
							? addCommas(results.totalImpulse)
							: '--'}
					</td>
					<td style={{ width: '80px' }}>
						<span className="text-muted">N·s</span>
					</td>
				</tr>
				<tr>
					<th>Average Thrust</th>
					<td className="text-end">
						{results.averageThrust
							? formatNumber(results.averageThrust, 1)
							: '--'}
					</td>
					<td>
						<span className="text-muted">N</span>
					</td>
				</tr>
				<tr>
					<th>Peak Thrust</th>
					<td className="text-end">
						{results.peakThrust
							? formatNumber(results.peakThrust, 1)
							: '--'}
					</td>
					<td>
						<span className="text-muted">N</span>
					</td>
				</tr>
				<tr>
					<th>Burn Time</th>
					<td className="text-end">
						{results.burnTime
							? formatNumber(results.burnTime, 2)
							: '--'}
					</td>
					<td>
						<span className="text-muted">s</span>
					</td>
				</tr>
				<tr>
					<th>Delivered I<sub>sp</sub></th>
					<td className="text-end">
						{results.deliveredIsp
							? formatNumber(results.deliveredIsp, 1)
							: '--'}
					</td>
					<td>
						<span className="text-muted">s</span>
					</td>
				</tr>
			</ResultTable>

			<ResultTable
				title={
					<h5 className="mb-3">
						<i className="fas fa-gauge-high me-2"></i>
						Chamber Pressure
					</h5>
				}
			>
				<tr>
					<th>Peak Pressure</th>
					<td className="text-end">
						{results.peakPressure
							? formatNumber(results.peakPressure / 1e6, 2)
							: '--'}
					</td>
					<td style={{ width: '80px' }}>
						<span className="text-muted">MPa</span>
					</td>
				</tr>
				<tr>
					<th></th>
					<td className="text-end text-muted">
						{results.peakPressure
							? formatNumber(results.peakPressure / 6894.76, 0)
							: '--'}
					</td>
					<td>
						<span className="text-muted">psi</span>
					</td>
				</tr>
			</ResultTable>

			<ResultTable
				title={
					<h5 className="mb-3">
						<i className="fas fa-gas-pump me-2"></i>
						Propellant & Geometry
					</h5>
				}
			>
				<tr>
					<th>Propellant Mass</th>
					<td className="text-end">
						{results.propellantMass
							? formatNumber(results.propellantMass, 2)
							: '--'}
					</td>
					<td>
						<span className="text-muted">kg</span>
					</td>
				</tr>
				<tr>
					<th>Volume Loading</th>
					<td className="text-end">
						{results.volumeLoading
							? formatNumber(results.volumeLoading * 100, 1)
							: '--'}
					</td>
					<td>
						<span className="text-muted">%</span>
					</td>
				</tr>
				<tr>
					<th>Initial K<sub>n</sub></th>
					<td className="text-end">
						{results.initialKn
							? formatNumber(results.initialKn, 2)
							: '--'}
					</td>
					<td>
						<span className="text-muted"></span>
					</td>
				</tr>
				<tr>
					<th>Peak K<sub>n</sub></th>
					<td className="text-end">
						{results.peakKn ? formatNumber(results.peakKn, 2) : '--'}
					</td>
					<td>
						<span className="text-muted"></span>
					</td>
				</tr>
				<tr>
					<th>Port/Throat Ratio</th>
					<td className="text-end">
						{results.portToThroatRatio
							? formatNumber(results.portToThroatRatio, 2)
							: '--'}
					</td>
					<td>
						<span className="text-muted"></span>
					</td>
				</tr>
				<tr>
					<th>Peak Mass Flux</th>
					<td className="text-end">
						{results.peakMassFlux
							? formatNumber(results.peakMassFlux, 0)
							: '--'}
					</td>
					<td>
						<span className="text-muted">kg/m²/s</span>
					</td>
				</tr>
			</ResultTable>
		</>
	);
}
