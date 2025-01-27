import React from 'react';

interface SimpleUnitProps {
	unit: string | number;
}

const SimpleUnit: React.FC<SimpleUnitProps> = ({ unit }) => {
	return (
		<span
			className="input-group-text bg-dark text-white"
			dangerouslySetInnerHTML={{ __html: String(unit) }}
		/>
	);
};

export default SimpleUnit;
