import React from 'react';
import PlotSettings from './plotSettings/plotSettingsController.component';
import Plot from './plot.component';
import PlotButtons from './plotButtons.component';
import {
  Box,
  Grid,
  Drawer,
  IconButton,
  Typography,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import type {
  XAxisScale,
  YAxesScale,
  PlotType,
  SelectedPlotChannel,
  FullScalarChannelMetadata,
  PlotContinuity,
} from '../app.types';
import { usePlotRecords } from '../api/records';
import { useScalarChannels } from '../api/channels';
import PlotWindowPortal from './plotWindowPortal.component';
import { selectSelectedChannels } from '../state/slices/tableSlice';
import { useAppSelector } from '../state/hooks';

interface PlotWindowProps {
  onClose: () => void;
  untitledTitle: string;
}
const drawerWidth = 300;

const PlotWindow = (props: PlotWindowProps) => {
  const { onClose, untitledTitle } = props;

  const [plotTitle, setPlotTitle] = React.useState('');
  const [plotType, setPlotType] = React.useState<PlotType>('scatter');
  const [xMinimum, setXMinimum] = React.useState<number | undefined>(undefined);
  const [xMaximum, setXMaximum] = React.useState<number | undefined>(undefined);
  const [yMinimum, setYMinimum] = React.useState<number | undefined>(undefined);
  const [yMaximum, setYMaximum] = React.useState<number | undefined>(undefined);
  const [XAxisScale, setXAxisScale] = React.useState<XAxisScale>('linear');
  const [YAxesScale, setYAxesScale] = React.useState<YAxesScale>('linear');

  const [XAxis, setXAxis] = React.useState<string | undefined>(undefined);
  const [selectedPlotChannels, setSelectedPlotChannels] = React.useState<
    SelectedPlotChannel[]
  >([]);
  const [gridVisible, setGridVisible] = React.useState<boolean>(true);
  const [axesLabelsVisible, setAxesLabelsVisible] =
    React.useState<boolean>(true);
  const [viewFlag, setViewFlag] = React.useState<boolean>(false);

  const [plotContinuity, setPlotContinuity] =
    React.useState<PlotContinuity>('continuous');

  const toggleGridVisibility = React.useCallback(() => {
    setGridVisible(!gridVisible);
  }, [gridVisible]);

  const toggleAxesLabelsVisibility = React.useCallback(() => {
    setAxesLabelsVisible(!axesLabelsVisible);
  }, [axesLabelsVisible]);

  const resetView = React.useCallback(() => {
    setViewFlag(!viewFlag);
  }, [viewFlag]);

  const [open, setOpen] = React.useState(true);
  const handleDrawerOpen = React.useCallback(() => {
    setOpen(true);
  }, []);
  const handleDrawerClose = React.useCallback(() => {
    setOpen(false);
  }, []);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const { data: records, isLoading: recordsLoading } = usePlotRecords(
    selectedPlotChannels,
    XAxis
  );
  const { data: channels, isLoading: channelsLoading } = useScalarChannels();

  const selectedScalarRecordTableChannels: FullScalarChannelMetadata[] =
    useAppSelector((state) =>
      selectSelectedChannels(state, channels ?? [])
    ) as FullScalarChannelMetadata[];

  return (
    <PlotWindowPortal title={plotTitle || untitledTitle} onClose={onClose}>
      <Grid
        container
        direction="row"
        id="plotting-window"
        sx={(theme) => ({
          position: 'relative',
          height: '100%',
          backgroundColor: theme.palette.background.default,
        })}
        spacing={0}
      >
        <Grid item>
          <Drawer
            PaperProps={{
              sx: {
                position: 'absolute',
                width: drawerWidth,
              },
            }}
            BackdropProps={{ sx: { position: 'absolute' } }}
            ModalProps={{
              container: document.getElementById('drawer-container'),
              sx: { position: 'absolute' },
            }}
            variant="persistent"
            anchor="left"
            open={open}
          >
            <Box mr={1} ml={1}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Config</Typography>
                <IconButton
                  onClick={handleDrawerClose}
                  aria-label="close settings"
                  sx={{
                    ...(!open && { visibility: 'hidden' }),
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </Box>
              <PlotSettings
                selectedRecordTableChannels={selectedScalarRecordTableChannels}
                allChannels={channels ?? []}
                changePlotTitle={setPlotTitle}
                plotType={plotType}
                changePlotType={setPlotType}
                XAxis={XAxis}
                changeXAxis={setXAxis}
                XAxisScale={XAxisScale}
                changeXAxisScale={setXAxisScale}
                YAxesScale={YAxesScale}
                changeYAxesScale={setYAxesScale}
                selectedPlotChannels={selectedPlotChannels}
                changeSelectedPlotChannels={setSelectedPlotChannels}
                changeXMinimum={setXMinimum}
                changeXMaximum={setXMaximum}
                changeYMinimum={setYMinimum}
                changeYMaximum={setYMaximum}
                plotContinuity={plotContinuity}
                changePlotContinuity={setPlotContinuity}
              />
            </Box>
            {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
            <Backdrop
              component="div"
              sx={{ position: 'absolute', zIndex: 100, height: 'inherit' }}
              open={recordsLoading || channelsLoading}
              role="none"
              aria-hidden={false}
            >
              <CircularProgress
                id="settings-loading-indicator"
                aria-label="settings-loading-indicator"
              />
            </Backdrop>
          </Drawer>
        </Grid>

        <Grid
          container
          item
          direction="column"
          wrap="nowrap"
          sx={
            open
              ? {
                  marginLeft: `${drawerWidth}px`,
                  width: `calc(100% - ${drawerWidth}px)`,
                  position: 'relative',
                  height: '100%',
                }
              : { width: '100%', position: 'relative', height: '100%' }
          }
        >
          <Grid container item justifyContent="space-between" wrap="nowrap">
            <IconButton
              color="inherit"
              aria-label="open settings"
              onClick={handleDrawerOpen}
              sx={{
                ...(open && { visibility: 'hidden' }),
              }}
            >
              <SettingsIcon />
            </IconButton>
            <Grid item mr={1} mt={1}>
              <PlotButtons
                data={records}
                canvasRef={canvasRef}
                title={plotTitle || untitledTitle}
                XAxis={XAxis}
                gridVisible={gridVisible}
                axesLabelsVisible={axesLabelsVisible}
                toggleGridVisibility={toggleGridVisibility}
                toggleAxesLabelsVisibility={toggleAxesLabelsVisibility}
                resetView={resetView}
              />
            </Grid>
          </Grid>
          <Plot
            datasets={records ?? []}
            selectedPlotChannels={selectedPlotChannels}
            title={plotTitle || untitledTitle}
            type={plotType}
            XAxis={XAxis}
            XAxisScale={XAxisScale}
            YAxesScale={YAxesScale}
            canvasRef={canvasRef}
            gridVisible={gridVisible}
            axesLabelsVisible={axesLabelsVisible}
            xMinimum={xMinimum}
            xMaximum={xMaximum}
            yMinimum={yMinimum}
            yMaximum={yMaximum}
            viewReset={viewFlag}
            plotContinuity={plotContinuity}
          />
        </Grid>
        {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
        <Backdrop
          component="div"
          sx={{ position: 'absolute', zIndex: 100, height: 'inherit' }}
          open={recordsLoading || channelsLoading}
          role="none"
          aria-hidden={false}
        >
          <CircularProgress
            id="plot-loading-indicator"
            aria-label="plot-loading-indicator"
          />
        </Backdrop>
      </Grid>
    </PlotWindowPortal>
  );
};

export default PlotWindow;
