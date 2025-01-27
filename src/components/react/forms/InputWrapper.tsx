import React from 'react';
import Tooltip from './Tooltip';

interface InputWrapperProps {
	id: string;
	label: string;
	prefix?: string;
	tooltip?: string;
	description?: string;
	descClass?: string;
	children?: React.ReactNode;
	input?: React.ReactNode;
	unit?: React.ReactNode;
}

const InputWrapper: React.FC<InputWrapperProps> = ({
	id,
	label,
	prefix = '',
	tooltip = '',
	description = '',
	descClass = 'text-muted',
	children,
	input,
	unit,
}) => {
	return (
		<div className="mb-3">
			{label && (
				<label
					htmlFor={id}
					className="form-label"
					dangerouslySetInnerHTML={{ __html: label }}
				/>
			)}
			{tooltip && <Tooltip tooltip={tooltip} />}
			<div className="input-group">
				{prefix && (
					<span
						className="input-group-text bg-dark text-white"
						dangerouslySetInnerHTML={{ __html: prefix }}
					/>
				)}
				{input}
				{unit}
				{children}
			</div>
			{description && (
				<p className="description">
					<small
						className={descClass}
						dangerouslySetInnerHTML={{ __html: description }}
					/>
				</p>
			)}
		</div>
	);
};

export default InputWrapper;

// CSS can be moved to a separate file or styled-components
const styles = `
.calc-form .input-group input {
  width: auto;
  flex: 2;
}

.calc-form .input-group input + select,
.calc-form .input-group input + span {
  flex: 1;
}
`;
