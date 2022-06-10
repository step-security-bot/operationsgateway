import React from 'react';
import { Order, RecordRow } from '../app.types';
import { Column, useTable } from 'react-table';
import {
  TableContainer as MuiTableContainer,
  Table as MuiTable,
  TableHead as MuiTableHead,
  TableBody as MuiTableBody,
  TableRow as MuiTableRow,
  TableCell as MuiTableCell,
  TablePagination as MuiTablePagination,
  Paper,
} from '@mui/material';
import DataHeader from './headerRenderers/dataHeader.component';

export interface TableProps {
  data: RecordRow[];
  displayedColumns: Column[];
  totalDataCount: number;
  page: number | null;
  loadedData: boolean;
  loadedCount: boolean;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
  sort: { [column: string]: Order };
  onSort: (column: string, order: Order | null) => void;
  onClose: (column: string) => void;
}

const Table = React.memo((props: TableProps): React.ReactElement => {
  const {
    data,
    displayedColumns,
    totalDataCount,
    loadedData,
    loadedCount,
    resultsPerPage,
    onPageChange,
    sort,
    onSort,
    onClose,
  } = props;

  const [maxPage, setMaxPage] = React.useState(0);

  const page = React.useMemo(() => {
    return props.page && props.page > 0 ? props.page : 0;
  }, [props.page]);

  React.useEffect(() => {
    if (loadedCount) {
      const newMaxPage = ~~(1 + (totalDataCount - 1) / resultsPerPage);
      if (newMaxPage !== maxPage) {
        setMaxPage(newMaxPage);
      } else if (maxPage > -1 && page > newMaxPage) {
        onPageChange(0);
      }
    }
  }, [
    loadedCount,
    maxPage,
    onPageChange,
    page,
    resultsPerPage,
    totalDataCount,
  ]);

  const tableInstance = useTable({ columns: displayedColumns, data });

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  return (
    <div>
      {loadedData && totalDataCount > 0 ? (
        <div>
          <div>
            <MuiTableContainer component={Paper}>
              <MuiTable {...getTableProps()}>
                <MuiTableHead>
                  {headerGroups.map((headerGroup) => {
                    const { key, ...otherHeaderGroupProps } =
                      headerGroup.getHeaderGroupProps();
                    return (
                      <MuiTableRow key={key} {...otherHeaderGroupProps}>
                        {headerGroup.headers.map((column) => {
                          const { key, ...otherHeaderProps } =
                            column.getHeaderProps();
                          return (
                            <DataHeader
                              key={key}
                              {...otherHeaderProps}
                              dataKey={column.render('id') as string}
                              sort={sort}
                              onSort={onSort}
                              label={column.render('Header')}
                              onClose={onClose}
                            />
                          );
                        })}
                      </MuiTableRow>
                    );
                  })}
                </MuiTableHead>
                <MuiTableBody {...getTableBodyProps()}>
                  {rows.map((row) => {
                    prepareRow(row);
                    const { key, ...otherRowProps } = row.getRowProps();
                    return (
                      <MuiTableRow key={key} {...otherRowProps}>
                        {row.cells.map((cell) => {
                          const { key, ...otherCellProps } =
                            cell.getCellProps();
                          return (
                            <MuiTableCell key={key} {...otherCellProps}>
                              {cell.render('Cell')}
                            </MuiTableCell>
                          );
                        })}
                      </MuiTableRow>
                    );
                  })}
                </MuiTableBody>
              </MuiTable>
            </MuiTableContainer>
          </div>
          <MuiTablePagination
            component="div"
            count={totalDataCount}
            onPageChange={(e, page) => onPageChange(page)}
            page={page}
            rowsPerPage={resultsPerPage}
          />
        </div>
      ) : (
        <div>
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
});

export default Table;
