import React from 'react';
import { useRecordCount, useRecordsPaginated } from '../api/records';
import Table from '../table/table.component';
import { Record, Order, QueryParams, Channel, RecordRow } from '../app.types';
import { Column } from 'react-table';
import ColumnList from '../table/columnCheckboxes.component';

const RecordTable = React.memo((): React.ReactElement => {
  const [page, setPage] = React.useState(0);
  const [sort, setSort] = React.useState<{
    [column: string]: Order;
  }>({});
  const [queryParams, setQueryParams] = React.useState<QueryParams>({
    page: page,
    sort: {},
  });
  const [availableColumns, setAvailableColumns] = React.useState<Column[]>([]);
  const [displayedColumns, setDisplayedColumns] = React.useState<Column[]>([]);
  const [parsedData, setParsedData] = React.useState<RecordRow[]>([]);

  const { data, isLoading: dataLoading } = useRecordsPaginated(queryParams);
  const { data: count, isLoading: countLoading } = useRecordCount();

  const resultsPerPage = 10;

  const constructColumns = (parsed: RecordRow[]): Column[] => {
    let myColumns: Column[] = [];
    let accessors: Set<string> = new Set<string>();

    parsed.forEach((recordRow: RecordRow) => {
      const keys = Object.keys(recordRow);

      for (let i = 0; i < keys.length; i++) {
        if (!accessors.has(keys[i])) {
          const newColumn: Column = {
            Header: keys[i],
            accessor: keys[i],
          };
          myColumns.push(newColumn);
          accessors.add(keys[i]);
        }
      }
    });

    return myColumns;
  };

  const parseData = (data: Record[]): RecordRow[] => {
    let newData: RecordRow[] = [];

    data.forEach((record: Record) => {
      let recordRow: RecordRow = {
        id: record.id,
        shotNum: record.metadata.shotNum,
        timestamp: record.metadata.timestamp,
      };

      const keys = Object.keys(record.channels);
      keys.forEach((key: string) => {
        const channel: Channel = record.channels[key];
        const channelData = channel.data;
        recordRow[key] = channelData;
      });

      newData.push(recordRow);
    });

    setParsedData(newData);
    return newData;
  };

  React.useEffect(() => {
    if (data && !dataLoading) {
      const parsed: RecordRow[] = parseData(data);
      setAvailableColumns(constructColumns(parsed));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, dataLoading]);

  React.useEffect(() => {
    setQueryParams({
      page: page,
      sort: sort,
    });
  }, [page, sort]);

  const onPageChange = (page: number) => {
    setPage(page);
  };

  const handleSort = (column: string, order: Order | null) => {
    let newSort = sort;
    if (order !== null) {
      newSort = {
        ...newSort,
        [column]: order,
      };
    } else {
      const { [column]: order, ...rest } = newSort;
      newSort = {
        ...rest,
      };
    }
    setSort(newSort);
  };

  const onChecked = (e: any): void => {
    const header = e.target.id;
    const checked = e.target.checked;

    if (checked) {
      const columnToFilter: Column = {
        Header: header,
        accessor: header,
      };
      setDisplayedColumns([...displayedColumns, columnToFilter]);
    } else {
      setDisplayedColumns(
        displayedColumns.filter((col: Column) => {
          return col.accessor !== header;
        })
      );
    }
  };

  return (
    <div>
      <Table
        data={parsedData}
        displayedColumns={displayedColumns}
        totalDataCount={count ?? 0}
        page={page}
        loadedData={!dataLoading}
        loadedCount={!countLoading}
        resultsPerPage={resultsPerPage}
        onPageChange={onPageChange}
        sort={sort}
        onSort={handleSort}
      />
      <ColumnList availableColumns={availableColumns} onChecked={onChecked} />
    </div>
  );
});

RecordTable.displayName = 'RecordTable';

export default RecordTable;
