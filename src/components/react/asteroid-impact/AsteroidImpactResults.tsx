import ResultTable from '../forms/ResultTable';

interface ImpactEffects {
	kineticEnergy: string; // in Joules
	craterDiameter: string; // in meters
	ejectaVolume: string; // in cubic meters
	seismicMagnitude: string; // Richter scale
}

interface ImpactResultsProps {
	impactEffects: ImpactEffects;
}

const ImpactResults: React.FC<ImpactResultsProps> = ({ impactEffects }) => {
	return (
		<ResultTable title={<h4>Impact Effects</h4>}>
			<tr>
				<th>Kinetic Energy</th>
				<td>{impactEffects.kineticEnergy} J</td>
			</tr>
			<tr>
				<th>Crater Diameter</th>
				<td>{impactEffects.craterDiameter} m</td>
			</tr>
			<tr>
				<th>Ejected Material</th>
				<td>{impactEffects.ejectaVolume} m³</td>
			</tr>
			<tr>
				<th className="border-bottom-0">Seismic Magnitude</th>
				<td className="border-bottom-0">
					{impactEffects.seismicMagnitude} (Richter)
				</td>
			</tr>
		</ResultTable>
	);
};

export default ImpactResults;
