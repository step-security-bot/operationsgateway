import React from 'react';
import { Grid, Box, styled, Tab, Tabs } from '@mui/material';
import type {
  XAxisScale,
  YAxesScale,
  FullScalarChannelMetadata,
  PlotType,
  SelectedPlotChannel,
  PlotContinuity,
} from '../../app.types';
import ChartTypeButtons from './chartTypeButtons.component';
import PlotTitleField from './plotTitleField.component';
import XAxisTab from './xAxisTab.component';
import YAxisTab from './yAxisTab.component';
import PlotContinuityRadioGroup from './plotContinuityRadioGroup.component';

type TabValue = 'X' | 'Y';

interface TabPanelProps {
  children?: React.ReactNode;
  value: TabValue;
  label: TabValue;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, label, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== label}
      id={`${label}-tabpanel`}
      aria-labelledby={`${label}-tab`}
      {...other}
    >
      {value === label && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(label: TabValue) {
  return {
    id: `${label}-tab`,
    'aria-controls': `${label}-tabpanel`,
  };
}

const StyledTab = styled(Tab)(() => ({
  minHeight: 30,
  minWidth: 10,
  height: 30,
  width: 10,
}));

export interface PlotSettingsControllerProps {
  selectedRecordTableChannels: FullScalarChannelMetadata[];
  allChannels: FullScalarChannelMetadata[];
  changePlotTitle: (title: string) => void;
  plotType: PlotType;
  changePlotType: (plotType: PlotType) => void;
  XAxis?: string;
  changeXAxis: (value: string) => void;
  XAxisScale: XAxisScale;
  changeXAxisScale: (XAxisScale: XAxisScale) => void;
  YAxesScale: YAxesScale;
  changeYAxesScale: (YAxesScale: YAxesScale) => void;
  selectedPlotChannels: SelectedPlotChannel[];
  changeSelectedPlotChannels: (
    selectedPlotChannels: SelectedPlotChannel[]
  ) => void;
  changeXMinimum: (value: number | undefined) => void;
  changeXMaximum: (value: number | undefined) => void;
  changeYMinimum: (value: number | undefined) => void;
  changeYMaximum: (value: number | undefined) => void;
  plotContinuity: PlotContinuity;
  changePlotContinuity: (continuity: PlotContinuity) => void;
}

const PlotSettingsController = (props: PlotSettingsControllerProps) => {
  const {
    selectedRecordTableChannels,
    allChannels,
    changePlotTitle,
    plotType,
    changePlotType,
    XAxis,
    changeXAxis,
    XAxisScale,
    changeXAxisScale,
    YAxesScale,
    changeYAxesScale,
    selectedPlotChannels,
    changeSelectedPlotChannels,
    changeXMinimum,
    changeXMaximum,
    changeYMinimum,
    changeYMaximum,
    plotContinuity,
    changePlotContinuity,
  } = props;

  const [XYTabValue, setXYTabValue] = React.useState<TabValue>('X');

  const handleXYTabChange = React.useCallback(
    (event: React.SyntheticEvent, newValue: TabValue) => {
      setXYTabValue(newValue);
    },
    [setXYTabValue]
  );

  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <PlotTitleField changePlotTitle={changePlotTitle} />
      </Grid>
      <Grid item>
        <ChartTypeButtons plotType={plotType} changePlotType={changePlotType} />
      </Grid>
      <Grid item>
        <PlotContinuityRadioGroup
          plotType={plotType}
          plotContinuity={plotContinuity}
          changePlotContinuity={changePlotContinuity}
        />
      </Grid>
      <Grid item>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={XYTabValue}
            onChange={handleXYTabChange}
            aria-label="tabs"
            sx={{ height: 30, minHeight: 30 }}
          >
            <StyledTab value="X" label="X" {...a11yProps('X')} />
            <StyledTab value="Y" label="Y" {...a11yProps('Y')} />
          </Tabs>
        </Box>
        <TabPanel value={XYTabValue} label={'X'}>
          <XAxisTab
            allChannels={allChannels}
            XAxisScale={XAxisScale}
            XAxis={XAxis}
            changeXAxis={changeXAxis}
            changeXAxisScale={changeXAxisScale}
            changeXMinimum={changeXMinimum}
            changeXMaximum={changeXMaximum}
          />
        </TabPanel>
        <TabPanel value={XYTabValue} label={'Y'}>
          <YAxisTab
            selectedRecordTableChannels={selectedRecordTableChannels}
            allChannels={allChannels}
            selectedPlotChannels={selectedPlotChannels}
            changeSelectedPlotChannels={changeSelectedPlotChannels}
            changeYMinimum={changeYMinimum}
            changeYMaximum={changeYMaximum}
            YAxesScale={YAxesScale}
            changeYAxesScale={changeYAxesScale}
          />
        </TabPanel>
      </Grid>
    </Grid>
  );
};

export default PlotSettingsController;
