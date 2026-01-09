import React, { useRef, useEffect, useState } from 'react';
import { clampNumber } from '../../vue/utils';

interface NumberInputProps {
	id: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	onChange: (value: number) => void;
	updateOnBlur?: boolean; // New prop to control update behavior
	[key: string]: any; // For additional HTML attributes
}

const NumberInput: React.FC<NumberInputProps> = ({
	id,
	value,
	min,
	max,
	step,
	onChange,
	updateOnBlur = false, // Default to false for backward compatibility
	...attrs
}) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [localValue, setLocalValue] = useState<string>(String(value));

	// Update local value when the input is changed
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.value;
		setLocalValue(newValue);

		// If not updateOnBlur, update the value immediately
		if (!updateOnBlur) {
			const parsedValue = parseFloat(newValue);
			if (!isNaN(parsedValue)) {
				const clampedValue = clampNumber(
					parsedValue,
					min ?? -Infinity,
					max ?? Infinity,
				);
				onChange(clampedValue);
			}
		}
	};

	// Handle blur event to update the value when user leaves the input
	const handleBlur = () => {
		if (updateOnBlur) {
			const parsedValue = parseFloat(localValue);
			if (!isNaN(parsedValue)) {
				const clampedValue = clampNumber(
					parsedValue,
					min ?? -Infinity,
					max ?? Infinity,
				);

				// Update the input value if it's different from the clamped value
				if (clampedValue !== parsedValue) {
					setLocalValue(String(clampedValue));
				}

				onChange(clampedValue);
			} else {
				// Reset to previous valid value if input is not a number
				setLocalValue(String(value));
			}
		}
	};

	// Update the local value when the controlled value changes
	useEffect(() => {
		setLocalValue(String(value));
	}, [value]);

	return (
		<input
			ref={inputRef}
			id={id}
			type="number"
			className="form-control"
			value={localValue}
			min={min}
			max={max}
			step={step}
			onChange={handleChange}
			onBlur={handleBlur}
			{...attrs}
		/>
	);
};

export default NumberInput;
