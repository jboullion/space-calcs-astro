import React from 'react';

interface ResultTableProps {
	children?: React.ReactNode;
	title?: React.ReactNode;
}

const ResultTable: React.FC<ResultTableProps> = ({ children, title }) => {
	return (
		<div id="resultsTable" className="p-2 rounded border mb-5">
			{title}
			<table className="table mb-0">
				<tbody className="align-middle">{children}</tbody>
			</table>
		</div>
	);
};

export default ResultTable;

// CSS can be moved to a separate file or styled-components
const styles = `
#resultsTable tbody tr:last-child td,
#resultsTable tbody tr:last-child th {
  border-bottom: 0;
}
`;
