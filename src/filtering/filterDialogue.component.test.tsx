/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from 'react';
import FilterDialogue from './filterDialogue.component';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getInitialState, renderComponentWithProviders } from '../setupTests';
import { RootState } from '../state/store';
import { PreloadedState } from '@reduxjs/toolkit';
import { operators, Token } from './filterParser';
import { QueryClient } from '@tanstack/react-query';
import { server } from '../mocks/server';
import { rest } from 'msw';
import recordsJson from '../mocks/records.json';

describe('Filter dialogue component', () => {
  let props: React.ComponentProps<typeof FilterDialogue>;
  let user;

  const createView = (
    initialState?: PreloadedState<RootState>,
    queryClient?: QueryClient
  ) => {
    return renderComponentWithProviders(<FilterDialogue {...props} />, {
      preloadedState: initialState,
      queryClient,
    });
  };

  beforeEach(() => {
    user = userEvent.setup();
    props = {
      open: true,
      onClose: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders filter dialogue when dialogue is open', async () => {
    let baseElement;
    await act(async () => {
      baseElement = createView().baseElement;
    });
    expect(baseElement).toMatchSnapshot();
  });

  it("doesn't render filter dialogue when dialogue is close", async () => {
    props.open = false;

    let baseElement;
    await act(async () => {
      baseElement = createView().baseElement;
    });
    expect(baseElement).toMatchSnapshot();
  });

  it('calls onClose when close button is clicked', async () => {
    createView();

    await user.click(screen.getByText('Close'));

    expect(props.onClose).toHaveBeenCalled();
  });

  it('dispatches changeAppliedFilters and onClose when apply button is clicked', async () => {
    const state = {
      ...getInitialState(),
      filter: {
        ...getInitialState().filter,
        appliedFilters: [
          [
            { type: 'channel', value: 'type', label: 'Type' },
            operators.find((t) => t.value === 'is not null')!,
            operators.find((t) => t.value === 'and')!,
            { type: 'channel', value: 'shotnum', label: 'Shot Number' },
            operators.find((t) => t.value === 'is null')!,
          ],
        ] as Token[][],
      },
    };

    const { store } = createView(state);

    const filter = screen.getByRole('combobox', { name: 'Filter' });
    await user.type(filter, '{backspace}');
    await user.type(filter, '{backspace}');
    await user.type(filter, '{backspace}');

    expect(screen.getByText('Apply')).not.toBeDisabled();
    await user.click(screen.getByText('Apply'));

    expect(store.getState().filter.appliedFilters).toStrictEqual([
      [
        { type: 'channel', value: 'type', label: 'Type' },
        operators.find((t) => t.value === 'is not null')!,
      ],
    ]);
    expect(props.onClose).toHaveBeenCalled();
  });

  it('disables apply button when there are errors', async () => {
    const state = {
      ...getInitialState(),
      filter: {
        ...getInitialState().filter,
        appliedFilters: [
          [
            { type: 'channel', value: 'type', label: 'type' },
            operators.find((t) => t.value === 'is not null')!,
          ],
        ] as Token[][],
      },
    };

    createView(state);

    const filter = screen.getByRole('combobox', { name: 'Filter' });
    await user.type(filter, '{backspace}');
    await user.tab();

    expect(screen.getByText('Apply')).toBeDisabled();
  });

  it('adds new filter when Add new filter button is clicked and renders multiple filters, and updates store with multiple filters when applied', async () => {
    const { store } = createView();

    await user.click(screen.getByText('Add new filter'));

    const filters = screen.getAllByRole('combobox', { name: 'Filter' });
    expect(filters).toHaveLength(2);

    const [filter1, filter2] = filters;

    await user.type(filter1, 'Act{enter}is{enter}', {
      delay: null,
    });
    await user.type(filter2, 'sh{enter}={enter}1{enter}', {
      delay: null,
    });
    await user.tab();

    expect(screen.getByText('Apply')).not.toBeDisabled();
    await user.click(screen.getByText('Apply'));

    expect(store.getState().filter.appliedFilters).toStrictEqual([
      [
        {
          type: 'channel',
          value: 'activeArea',
          label: 'Active Area',
        },
        operators.find((t) => t.value === 'is not null')!,
      ],
      [
        { type: 'channel', value: 'shotnum', label: 'Shot Number' },
        operators.find((t) => t.value === '=')!,
        { type: 'number', value: '1', label: '1' },
      ],
    ]);
  });

  it('deletes a filter when delete button is clicked', async () => {
    const state = {
      ...getInitialState(),
      filter: {
        ...getInitialState().filter,
        appliedFilters: [
          [
            { type: 'channel', value: 'type', label: 'type' },
            operators.find((t) => t.value === 'is not null')!,
          ],
          [
            { type: 'channel', value: 'shotnum', label: 'Shot Number' },
            operators.find((t) => t.value === 'is not null')!,
          ],
        ] as Token[][],
      },
    };

    const { store } = createView(state);

    expect(screen.getAllByRole('combobox', { name: 'Filter' })).toHaveLength(2);

    await user.click(screen.getByLabelText('Delete filter 0'));

    expect(screen.getAllByRole('combobox', { name: 'Filter' })).toHaveLength(1);

    await user.click(screen.getByText('Apply'));

    // ensure correct filter was deleted
    expect(store.getState().filter.appliedFilters).toStrictEqual([
      [
        { type: 'channel', value: 'shotnum', label: 'Shot Number' },
        operators.find((t) => t.value === 'is not null')!,
      ],
    ]);
  });

  it('filters out empty arrays but leaves at least one if all filters are empty', async () => {
    const state = {
      ...getInitialState(),
      filter: {
        ...getInitialState().filter,
        appliedFilters: [
          [
            { type: 'channel', value: 'type', label: 'type' },
            operators.find((t) => t.value === 'is not null')!,
          ],
        ] as Token[][],
      },
    };

    const { store } = createView(state);

    await user.click(screen.getByText('Add new filter'));
    await user.click(screen.getByText('Add new filter'));
    await user.click(screen.getByText('Add new filter'));

    await user.click(screen.getByText('Apply'));

    expect(store.getState().filter.appliedFilters).toStrictEqual([
      [
        { type: 'channel', value: 'type', label: 'type' },
        operators.find((t) => t.value === 'is not null')!,
      ],
    ]);

    await user.click(screen.getByLabelText('Delete filter 0'));

    await user.click(screen.getByText('Add new filter'));
    await user.click(screen.getByText('Add new filter'));
    await user.click(screen.getByText('Add new filter'));

    await user.click(screen.getByText('Apply'));

    expect(store.getState().filter.appliedFilters).toStrictEqual([[]]);
  });

  it("doesn't pass timestamp as a filterable channel", async () => {
    createView();

    const filter = screen.getByRole('combobox', { name: 'Filter' });
    await user.type(filter, 'time');
    // i.e. there's no suggestions in the autocomplete
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('displays a warning tooltip if record count is over record limit warning and only initiates search on second click', async () => {
    // Mock the returned count query response
    server.use(
      rest.get('/channels/count', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(2));
      })
    );

    const state = {
      ...getInitialState(),
      config: {
        ...getInitialState().config,
        recordLimitWarning: 1, // lower than the returned count of 2
      },
    };
    const { store } = createView(state);

    await user.click(screen.getByText('Add new filter'));

    expect(screen.getAllByRole('combobox', { name: 'Filter' })).toHaveLength(2);

    const filter1 = screen.getAllByRole('combobox', { name: 'Filter' })[0];
    await user.type(filter1, 'Act{enter}is{enter}');
    await user.tab();

    expect(screen.getByText('Apply')).not.toBeDisabled();
    await user.click(screen.getByText('Apply'));

    // Tooltip warning should be present
    await user.hover(screen.getByText('Apply'));
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();

    // Store should not be updated, indicating search is yet to initiate
    expect(store.getState().filter.appliedFilters).toStrictEqual([[]]);

    // Try search again
    await user.click(screen.getByText('Apply'));

    // Store should now be updated, indicating search initiated on second attempt
    expect(store.getState().filter.appliedFilters).toStrictEqual([
      [
        {
          type: 'channel',
          value: 'activeArea',
          label: 'Active Area',
        },
        operators.find((t) => t.value === 'is not null')!,
      ],
    ]);
  });

  it('does not show a warning tooltip for previous searches that already showed it', async () => {
    // Mock the returned count query response
    server.use(
      rest.get('/channels/count', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(2));
      })
    );

    const testQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 300000,
        },
      },
    });
    testQueryClient.setQueryData(
      [
        'records',
        {
          searchParams: {
            dateRange: {},
            maxShots: 50,
            shotnumRange: {},
          },
          filters: ['{"metadata.activeArea":{"$ne":null}}'],
        },
      ],
      () => {
        return { data: [recordsJson[0], recordsJson[1]] };
      }
    );

    const state = {
      ...getInitialState(),
      config: {
        ...getInitialState().config,
        recordLimitWarning: 1, // lower than the returned count of 2
      },
    };
    const { store } = createView(state, testQueryClient);

    const filter = screen.getByRole('combobox', { name: 'Filter' });
    await user.type(filter, 'Act{enter}is{enter}');
    await user.tab();

    expect(screen.getByText('Apply')).not.toBeDisabled();
    await user.click(screen.getByText('Apply'));

    // Tooltip warning should not be present
    await user.hover(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Store should now be updated, indicating search initiated on second attempt
    expect(store.getState().filter.appliedFilters).toStrictEqual([
      [
        {
          type: 'channel',
          value: 'activeArea',
          label: 'Active Area',
        },
        operators.find((t) => t.value === 'is not null')!,
      ],
    ]);
  });
});
