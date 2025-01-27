import React from 'react';

interface NumberUnit {
	label: string;
	[key: string]: any;
}

interface UnitSelectProps {
	id?: string;
	value: NumberUnit;
	units: NumberUnit[];
	onChange: (unit: NumberUnit) => void;
}

const UnitSelect: React.FC<UnitSelectProps> = ({
	id,
	value,
	units,
	onChange,
}) => {
	const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedValue = event.target.value;
		const newUnit =
			units.find((unit) => unit.label === selectedValue) ?? units[0];
		onChange(newUnit);
	};

	return (
		<select
			className="form-select bg-dark text-white"
			value={value.label}
			onChange={handleChange}
		>
			{units.map((unitOption) => (
				<option
					key={unitOption.label}
					value={unitOption.label}
					dangerouslySetInnerHTML={{ __html: unitOption.label }}
				/>
			))}
		</select>
	);
};

export default UnitSelect;
