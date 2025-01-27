import React from 'react';

interface TooltipProps {
	tooltip?: string;
}

const styles = `
.sc-tooltip {
    position: relative;
    display: inline-block;
    cursor: help;
}

.sc-tooltip .sc-tooltip-inner {
    visibility: hidden;
    border: 1px solid var(--bs-dark);
    background-color: #fefefe;
    color: var(--bs-dark);
    width: 200px;
    font-size: 14px;
    line-height: 1.4;
    text-align: center;
    font-family: "Inter", sans-serif;
    font-weight: normal;
    border-radius: 6px;
    padding: 6px;

    /* Position the tooltip */
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    margin-left: -100px;
}

.sc-tooltip:hover .sc-tooltip-inner {
    visibility: visible;
}

.sc-tooltip-inner::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: var(--bs-dark) transparent transparent transparent;
}
`;

const Tooltip: React.FC<TooltipProps> = ({ tooltip }) => {
	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: styles }} />
			<span className="fas fa-question-circle ms-2 sc-tooltip">
				<span
					className="sc-tooltip-inner"
					dangerouslySetInnerHTML={{ __html: tooltip || '' }}
				/>
			</span>
		</>
	);
};

export default Tooltip;
