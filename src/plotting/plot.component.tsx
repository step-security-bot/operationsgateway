import React from 'react';
import type {
  XAxisScale,
  PlotDataset,
  PlotType,
  YAxesScale,
  SelectedPlotChannel,
  PlotContinuity,
} from '../app.types';
// only import types as we don't actually run any chart.js code in React
import type { ChartOptions, ChartDataset } from 'chart.js';
// we import this even though we don't use it so we can get typescript info added to ChartOptions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type Zoom from 'chartjs-plugin-zoom';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type Annotations from 'chartjs-plugin-annotation';
import { format } from 'date-fns';

export interface PlotProps {
  datasets: PlotDataset[];
  selectedPlotChannels: SelectedPlotChannel[];
  title: string;
  type: PlotType;
  XAxisScale: XAxisScale;
  YAxesScale: YAxesScale;
  XAxis?: string;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  gridVisible: boolean;
  axesLabelsVisible: boolean;
  xMinimum?: number;
  xMaximum?: number;
  yMinimum?: number;
  yMaximum?: number;
  viewReset: boolean;
  plotContinuity: PlotContinuity;
}

const Plot = (props: PlotProps) => {
  const {
    datasets,
    selectedPlotChannels,
    title,
    type,
    XAxisScale,
    YAxesScale,
    XAxis,
    canvasRef,
    gridVisible,
    axesLabelsVisible,
    xMinimum,
    xMaximum,
    yMinimum,
    yMaximum,
    viewReset,
    plotContinuity,
  } = props;

  /**
   * Returns a map of the midnight timestamps for each date represented in the plot data
   * minus the first one (otherwise, the default plot view can be distorted)
   * @param datasets the plot datasets
   * @returns the map of timestamps
   */
  const extractDates = (datasets: PlotDataset[]): number[] => {
    const returningDates: number[] = [];

    datasets.forEach((dataset) => {
      const data = dataset.data;
      data.forEach((point) => {
        const unixTimestamp = point.timestamp;
        if (unixTimestamp) {
          const dateObject = new Date(unixTimestamp);
          const midnightTimestamp = new Date(
            `2022-04-${dateObject.getDate()} 00:00:00`
          ).getTime();

          if (!returningDates.includes(midnightTimestamp)) {
            returningDates.push(midnightTimestamp);
          }
        }
      });
    });

    // Don't want the first date line, can push the chart data to the right
    returningDates.shift();

    return returningDates;
  };

  // set the initial options
  const [optionsString, setOptionsString] = React.useState(
    JSON.stringify({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        title: {
          display: true,
          text: title,
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            drag: {
              enabled: false,
            },
            mode: 'xy',
          },
          pan: {
            enabled: true,
            mode: 'xy',
          },
        },
        annotation: {
          annotations: extractDates(datasets).map((date) => ({
            type: 'line',
            xMin: date,
            xMax: date,
            borderColor: 'red',
            borderWidth: 2,
            label: {
              content: format(new Date(date), 'yyyy-MM-dd'),
              display: true,
            },
          })),
        },
      },
      scales: {
        x: {
          type: XAxisScale === 'time' ? 'timeseries' : XAxisScale,
          bounds: XAxisScale !== 'time' ? 'ticks' : undefined,
          time: {
            displayFormats: {
              millisecond: 'HH:mm:ss:SSS',
              second: 'HH:mm:ss',
              minute: 'HH:mm',
              hour: 'd MMM ha',
              day: 'd MMM',
              week: 'd MMM',
              month: 'MMM yyyy',
              quarter: 'MMM yyyy',
              year: 'yyyy',
            },
            tooltipFormat: 'yyyy-MM-dd HH:mm:ss',
          },
          title: {
            display: axesLabelsVisible,
            text: XAxis,
          },
          grid: {
            display: gridVisible,
          },
          min: xMinimum,
          max: xMaximum,
        },
        y: {
          type: YAxesScale,
          display: true,
          position: 'left',
          grid: {
            display: gridVisible,
          },
          min: yMinimum,
          max: yMaximum,
        },
        y2: {
          type: YAxesScale,
          display: false,
          position: 'right',
          grid: {
            display: gridVisible,
          },
        },
      },
    } as ChartOptions<PlotType>)
  );
  const [dataString, setDataString] = React.useState(JSON.stringify(datasets));

  React.useEffect(() => {
    setOptionsString((oldOptionsString) => {
      const options: ChartOptions<PlotType> = JSON.parse(oldOptionsString);
      // change any options here to preserve any options chart.js adds
      options?.plugins?.title && (options.plugins.title.text = title);
      options?.scales?.x && (options.scales.x.min = xMinimum);
      options?.scales?.x && (options.scales.x.max = xMaximum);
      options?.scales?.x && (options.scales.x.type = XAxisScale);
      options?.scales?.x &&
        (options.scales.x.bounds = XAxisScale !== 'time' ? 'ticks' : undefined);
      options?.scales?.x?.grid && (options.scales.x.grid.display = gridVisible);
      options?.scales?.x?.title &&
        (options.scales.x.title.display = axesLabelsVisible);
      options?.scales?.x?.title && (options.scales.x.title.text = XAxis);
      options?.scales?.y && (options.scales.y.min = yMinimum);
      options?.scales?.y && (options.scales.y.max = yMaximum);
      options?.scales?.y && (options.scales.y.type = YAxesScale);
      options?.scales?.y?.grid && (options.scales.y.grid.display = gridVisible);
      options?.plugins?.annotation &&
        (options.plugins.annotation.annotations = extractDates(datasets).map(
          (date) => ({
            type: 'line',
            xMin: date,
            xMax: date,
            borderColor: 'red',
            borderWidth: 2,
            label: {
              content: format(new Date(date), 'yyyy-MM-dd'),
              display: true,
            },
          })
        ));

      return JSON.stringify(options);
    });
  }, [
    XAxis,
    XAxisScale,
    YAxesScale,
    axesLabelsVisible,
    datasets,
    gridVisible,
    title,
    xMaximum,
    xMinimum,
    yMaximum,
    yMinimum,
  ]);

  React.useEffect(() => {
    setDataString(
      JSON.stringify({
        datasets: datasets.map((dataset) => {
          const channelConfig = selectedPlotChannels.find(
            (channel) => channel.name === dataset.name
          )?.options;
          const lineStyle = channelConfig?.lineStyle ?? 'solid';

          return {
            label: dataset.name,
            data: dataset.data,
            parsing: {
              yAxisKey: dataset.name,
              xAxisKey: XAxis,
            },
            borderColor:
              channelConfig && !channelConfig.visible
                ? 'rgba(0,0,0,0)'
                : channelConfig?.colour,
            backgroundColor:
              channelConfig && !channelConfig.visible
                ? 'rgba(0,0,0,0)'
                : channelConfig?.colour,
            borderDash:
              lineStyle === 'dashed'
                ? [5, 5]
                : lineStyle === 'dotted'
                ? [0, 5]
                : undefined,
            pointRadius: lineStyle === 'dotted' ? 3 : undefined,
            borderCapStyle: lineStyle === 'dotted' ? 'round' : undefined,
            spanGaps: plotContinuity === 'continuous',
          } as ChartDataset<PlotType, PlotDataset['data']>;
        }),
      })
    );
  }, [datasets, XAxis, selectedPlotChannels, plotContinuity]);

  return (
    <div
      style={{
        flex: '1 0 0',
        maxHeight: 'calc(100% - 38px)',
        maxWidth: '100%',
      }}
    >
      {/* This canvas is turned into a Chart.js plot via code in plotWindowPortal.component.tsx */}
      <canvas
        id="my-chart"
        ref={canvasRef}
        width="400"
        height="400"
        data-options={optionsString}
        data-data={dataString}
        data-type={type}
        data-view={viewReset}
      ></canvas>
    </div>
  );
};

export default Plot;
