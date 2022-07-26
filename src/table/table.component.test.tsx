import React from 'react';
import Table, { TableProps } from './table.component';
import { screen, cleanup, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordRow } from '../app.types';
import { Column } from 'react-table';
import { flushPromises, renderWithProviders, getState } from '../setupTests';
import { RootState } from '../state/store';
import { PreloadedState } from '@reduxjs/toolkit';

describe('Table', () => {
  let props: TableProps;
  const generateRow = (num: number): RecordRow => ({
    timestamp: new Date(`2022-01-${num < 10 ? '0' + num : num}T00:00:00Z`)
      .getTime()
      .toString(),
    activeArea: `${num}`,
    shotNum: num,
    activeExperiment: `${num}`,
  });
  const recordRows: RecordRow[] = Array.from(Array(3), (_, i) =>
    generateRow(i + 1)
  );
  const columnDefs: Column[] = [
    {
      Header: 'Timestamp',
      accessor: 'timestamp',
    },
    shotNum: {
      Header: 'Shot Number',
      accessor: 'shotNum',
    },
    activeArea: {
      Header: 'Active Area',
      accessor: 'activeArea',
    },
    activeExperiment: {
      Header: 'Active Experiment',
      accessor: 'activeExperiment',
    },
  };
  const onPageChange = jest.fn();
  const onResultsPerPageChange = jest.fn();
  const onSort = jest.fn();
  let state: PreloadedState<RootState>;

  const createView = (initialState = state) => {
    return renderWithProviders(<Table {...props} />, {
      preloadedState: initialState,
    });
  };

  beforeEach(() => {
    props = {
      data: recordRows,
      totalDataCount: recordRows.length,
      page: 0,
      loadedData: true,
      loadedCount: true,
      resultsPerPage: 25,
      onPageChange: onPageChange,
      onResultsPerPageChange: onResultsPerPageChange,
      onSort: onSort,
      sort: {},
    };
    state = { columns: { ...getState().columns, columnDefs } };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly, with timestamp column displayed by default', () => {
    const view = createView();
    expect(view.asFragment()).toMatchSnapshot();
  });

  it('renders correctly with all columns displayed', async () => {
    state.columns.selectedColumnIds = [
      'timestamp',
      'shotNum',
      'activeArea',
      'activeExperiment',
    ];
    const view = createView();

    expect(view.asFragment()).toMatchSnapshot();
  });

  it('displays a record count', () => {
    const recordCount = recordRows.length;
    createView();
    screen.getByText(`1–${recordCount} of ${recordCount}`);
  });

  it('calls onPageChange when page is changed', async () => {
    const user = userEvent.setup();
    props.data = Array.from(Array(12), (_, i) => generateRow(i + 1));
    const recordCount = props.data.length;
    props.totalDataCount = recordCount;
    props.resultsPerPage = 10;
    createView();
    screen.getByText(`1–10 of ${recordCount}`);

    await user.click(screen.getByLabelText('Go to next page'));

    await act(async () => {
      await flushPromises();
    });

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  // TODO: improve test once fixed to pagination errors is merged
  it('calls onResultsPerPageChange when resultsPerPage is changed', async () => {
    const user = userEvent.setup();
    createView();
    const resultsPerPage = screen.getByRole('button', {
      name: /Rows per page/i,
    });
    await user.click(resultsPerPage);

    const listbox = within(screen.getByRole('listbox'));

    await user.click(listbox.getByText('10'));

    await act(async () => {
      await flushPromises();
    });

    expect(onResultsPerPageChange).toHaveBeenCalledWith(10);
  });

  it('displays page loading message when loadedData is false and totalDataCount is zero', async () => {
    props.loadedData = false;
    createView();
    screen.getByRole('progressbar');

    cleanup();
    props.loadedData = true;
    props.totalDataCount = 0;
    createView();
    screen.getByRole('progressbar');
  });
});
