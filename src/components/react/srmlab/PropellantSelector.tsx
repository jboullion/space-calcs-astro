import { useSRM } from './SRMContext';
import InputWrapper from '../forms/InputWrapper';
import { PROPELLANTS } from './constants';

export default function PropellantSelector() {
	const { config, updatePropellant } = useSRM();

	return (
		<div className="p-3 rounded border mb-3">
			<h5 className="mb-3">Propellant</h5>

			<InputWrapper
				id="propellant-select"
				label="Propellant Type"
				description={`Density: ${config.propellant.density} kg/m³ | γ: ${config.propellant.gamma} | T<sub>c</sub>: ${config.propellant.Tc} K`}
				input={
					<select
						className="form-select"
						value={config.propellant.name}
						onChange={(e) => {
							const prop = PROPELLANTS.find(
								(p) => p.name === e.target.value,
							);
							if (prop) updatePropellant(prop);
						}}
					>
						{PROPELLANTS.map((prop) => (
							<option key={prop.name} value={prop.name}>
								{prop.name}
							</option>
						))}
					</select>
				}
			/>

			{config.propellant.description && (
				<p className="text-muted mb-0">
					<small>
						<i className="fas fa-info-circle me-1"></i>
						{config.propellant.description}
					</small>
				</p>
			)}
		</div>
	);
}
