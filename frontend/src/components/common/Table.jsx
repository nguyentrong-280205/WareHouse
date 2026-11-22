import React from 'react';

function Table({ columns = [], data = [], renderRow, className = '', label, emptyMessage = 'Không có dữ liệu' }) {
	return (
		<div className={`wms-panel w-full overflow-x-auto ${className}`}>
			<table className="wms-table responsive-records" role="table" aria-label={label}>
				<thead role="rowgroup">
					<tr role="row">
						{columns.map((col, idx) => (
							<th key={idx} scope="col" role="columnheader" className={col.className}>
								{col.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody role="rowgroup">
					{data.length > 0 ? (
						data.map((item, index) => renderRow(item, index))
					) : (
						<tr role="row">
							<td
								colSpan={columns.length}
								role="cell"
								className="wms-table-message"
							>
								{emptyMessage}
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}

export default Table;
