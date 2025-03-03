import React from 'react';
import MoreOptionsBox from './moreOptionsBox.component';
import type { MoreOptionsProps } from './moreOptionsBox.component';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testPlotDatasets } from '../../../setupTests';
import { deepCopySelectedPlotChannels } from '../../util';
import { SelectedPlotChannel } from '../../../app.types';

describe('MoreOptionsBox', () => {
  let props: MoreOptionsProps;
  const changeSelectedPlotChannels = jest.fn();
  let user;

  const createView = (): RenderResult => {
    return render(<MoreOptionsBox {...props} />);
  };

  beforeEach(() => {
    const testSelectedPlotChannels: SelectedPlotChannel[] =
      testPlotDatasets.map((dataset, i) => ({
        name: dataset.name,
        options: {
          visible: true,
          colour: `colour-${i.toString()}`,
          lineStyle: 'solid',
          yAxis: 'left',
        },
      }));

    props = {
      channel: testSelectedPlotChannels[1],
      selectedPlotChannels: testSelectedPlotChannels,
      changeSelectedPlotChannels,
    };

    user = userEvent.setup({ delay: null });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { asFragment } = createView();
    expect(asFragment()).toMatchSnapshot();
  });

  it('allows user to change line style of a channel', async () => {
    const expected = deepCopySelectedPlotChannels(props.selectedPlotChannels);
    expected[1].options.lineStyle = 'dashed';

    createView();

    const select = screen.getByLabelText(
      `change ${props.channel.name} line style`
    );
    fireEvent.change(select, { target: { value: 'dashed' } });
    expect(changeSelectedPlotChannels).toHaveBeenCalledWith(expected);
  });

  it('allows user to toggle channel visibility off', async () => {
    const expected = deepCopySelectedPlotChannels(props.selectedPlotChannels);
    expected[1].options.visible = false;

    createView();

    screen.getByRole('checkbox').click();
    fireEvent.change(screen.getByRole('checkbox'), { target: { checked: '' } });
    expect(changeSelectedPlotChannels).toHaveBeenLastCalledWith(expected);
  });

  it('allows user to toggle channel visibility on', async () => {
    const expected = deepCopySelectedPlotChannels(props.selectedPlotChannels);

    props.channel.options.visible = false;
    props.selectedPlotChannels[1].options.visible = false;
    createView();

    screen.getByRole('checkbox').click();
    fireEvent.change(screen.getByRole('checkbox'), { target: { checked: '' } });
    expect(changeSelectedPlotChannels).toHaveBeenLastCalledWith(expected);
  });

  it('allows user to change plot colour', async () => {
    const expected = deepCopySelectedPlotChannels(props.selectedPlotChannels);
    expected[1].options.colour = expect.anything();

    createView();

    await user.click(
      screen.getByLabelText(`Pick ${props.channel.name} colour`)
    );
    await user.click(screen.getByLabelText('Color'));

    expect(changeSelectedPlotChannels).toHaveBeenLastCalledWith(expected);
  });

  it('allows user to switch channel axis', async () => {
    const expected = deepCopySelectedPlotChannels(props.selectedPlotChannels);
    expected[1].options.yAxis = 'right';

    createView();

    await user.click(
      within(screen.getByLabelText('Y Axis')).getByLabelText('Right')
    );

    expect(changeSelectedPlotChannels).toHaveBeenLastCalledWith(expected);
  });
});
