import ResultTable from '../forms/ResultTable';

interface PlanetProperties {
	mass: string;
	volume: string;
	surfaceArea: string;
	surfaceGravity: string;
	escapeVelocity: string;
}

interface CreatePlanetResultsProps {
	planetProperties: PlanetProperties;
}

const CreatePlanetResults: React.FC<CreatePlanetResultsProps> = ({
	planetProperties,
}) => {
	return (
		<ResultTable title={<h4>Planet Properties</h4>}>
			<tr>
				<th>Mass</th>
				<td>{planetProperties.mass} kg</td>
			</tr>
			<tr>
				<th>Volume</th>
				<td>{planetProperties.volume} m³</td>
			</tr>
			<tr>
				<th>Surface Area</th>
				<td>{planetProperties.surfaceArea} m²</td>
			</tr>
			<tr>
				<th>Surface Gravity</th>
				<td>{planetProperties.surfaceGravity} m/s²</td>
			</tr>
			<tr>
				<th>Escape Velocity</th>
				<td>{planetProperties.escapeVelocity} km/s</td>
			</tr>
		</ResultTable>
	);
};

export default CreatePlanetResults;
