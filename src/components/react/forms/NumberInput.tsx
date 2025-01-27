import React, { useRef, useEffect } from 'react';
import { clampNumber } from '../../vue/utils';

interface NumberInputProps {
	id: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	onChange: (value: number) => void;
	[key: string]: any; // For additional HTML attributes
}

const NumberInput: React.FC<NumberInputProps> = ({
	id,
	value,
	min,
	max,
	step,
	onChange,
	...attrs
}) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const updateValue = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = parseFloat(event.target.value);
		const clampedValue = clampNumber(
			newValue,
			min ?? -Infinity,
			max ?? Infinity,
		);

		// Update the input value if it's different from the clamped value
		if (
			inputRef.current &&
			inputRef.current.value !== String(clampedValue)
		) {
			inputRef.current.value = String(clampedValue);
		}

		onChange(clampedValue);
	};

	// Update the input value when the controlled value changes
	useEffect(() => {
		if (inputRef.current && inputRef.current.value !== String(value)) {
			inputRef.current.value = String(value);
		}
	}, [value]);

	return (
		<input
			ref={inputRef}
			id={id}
			type="number"
			className="form-control"
			value={value}
			min={min}
			max={max}
			step={step}
			onChange={updateValue}
			{...attrs}
		/>
	);
};

export default NumberInput;
