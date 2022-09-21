import React from 'react';
import {
  VictoryChart,
  VictoryScatter,
  VictoryLine,
  VictoryZoomContainer,
  VictoryLabel,
  VictoryTheme,
  VictoryLegend,
  VictoryTooltip,
  VictoryGroup,
  VictoryAxis,
} from 'victory';
import {
  XAxisSettings,
  PlotDataset,
  PlotType,
  YAxisSettings,
  SelectedPlotChannel,
} from '../app.types';
import { format } from 'date-fns';

export const formatTooltipLabel = (
  label: number,
  scale: XAxisSettings['scale']
): number | string => {
  if (scale === 'time') {
    return format(label, 'yyyy-MM-dd HH:mm:ss');
  }
  return label;
};

export interface PlotProps {
  datasets: PlotDataset[];
  selectedChannels: SelectedPlotChannel[];
  title: string;
  type: PlotType;
  XAxisSettings: XAxisSettings;
  YAxesSettings: YAxisSettings;
  XAxis: string;
  svgRef: React.MutableRefObject<HTMLElement | null>;
}

const Plot = (props: PlotProps) => {
  const {
    datasets,
    selectedChannels,
    title,
    type,
    XAxisSettings,
    YAxesSettings,
    XAxis,
    svgRef,
  } = props;
  const [redraw, setRedraw] = React.useState(false);
  const setRedrawTrue = React.useCallback(() => {
    setRedraw(true);
  }, [setRedraw]);

  const graphRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    window.addEventListener(
      `resize OperationsGateway Plot - ${title}`,
      setRedrawTrue,
      false
    );
    return () => {
      window.removeEventListener(
        `resize OperationsGateway Plot - ${title}`,
        setRedrawTrue,
        false
      );
    };
  }, [setRedrawTrue, title]);

  // reset redraw state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (redraw) {
      setRedraw(false);
    }
  });

  const foundDatasets: PlotDataset[] = React.useMemo(() => {
    const something: PlotDataset[] = [];
    selectedChannels.forEach((channel) => {
      const found = datasets.find((dataset) => dataset.name === channel.name);
      if (found) something.push(found);
    });
    return something;
  }, [datasets, selectedChannels]);

  const minima: number[] = React.useMemo(() => {
    const x = foundDatasets.map(
      (dataset) =>
        Math.floor(
          Math.min(...dataset.data.map((point) => point[dataset.name])) / 10
        ) * 10
    );
    console.log('minima ' + JSON.stringify(x));
    return x;
  }, [foundDatasets]);

  const maxima: number[] = React.useMemo(() => {
    const x = foundDatasets.map(
      (dataset) =>
        Math.ceil(
          Math.max(...dataset.data.map((point) => point[dataset.name])) / 10
        ) * 10
    );
    console.log('minima ' + JSON.stringify(x));
    return x;
  }, [foundDatasets]);

  const lowerPercentages: number[] = React.useMemo(() => {
    const y = minima.map((minimal, i) => {
      const maximal = maxima[i];
      const lowerPercentage = minimal / maximal;
      return lowerPercentage;
    });

    console.log('percentages are ' + JSON.stringify(y));
    return y;
  }, [maxima, minima]);

  const xOffsets = [60, -50 + (graphRef?.current?.offsetWidth ?? 600)];
  // const tickPadding = [0, 0, -15];

  return (
    <div
      ref={graphRef}
      style={{
        flex: '1 0 0',
        maxHeight: 'calc(100% - 38px)',
        maxWidth: '100%',
      }}
    >
      <VictoryChart
        containerComponent={
          <VictoryZoomContainer
            containerRef={(ref) => {
              svgRef.current = ref;
            }}
          />
        }
        scale={{ x: XAxisSettings.scale, y: YAxesSettings.scale }}
        theme={VictoryTheme.material}
        width={graphRef?.current?.offsetWidth ?? 0}
        height={graphRef?.current?.offsetHeight ?? 0}
        // might need something fancier than this to prevent label overflow...
        // this can render 6 characters without overflow
        padding={{ top: 50, left: 60, right: 50, bottom: 50 }}
        domain={{ y: [Math.min(...lowerPercentages), 1] }}
      >
        <VictoryLabel
          text={title}
          x={
            graphRef?.current?.offsetWidth
              ? graphRef.current.offsetWidth / 2
              : 200
          }
          y={10}
          textAnchor="middle"
        />
        <VictoryLegend
          x={50}
          y={20}
          gutter={20}
          symbolSpacer={5}
          orientation="horizontal"
          data={selectedChannels
            ?.filter((channel) => channel.options.visible)
            .map((channel) => {
              return { name: channel.name, symbol: { fill: '#e31a1c' } };
            })}
        />
        <VictoryAxis />
        {foundDatasets.map((dataset, i) => {
          const minimal = minima[i];
          const maximal = maxima[i];
          const difference = maximal - minimal;
          const tickValues = [
            minimal,
            minimal + difference * 0.25,
            minimal + difference * 0.5,
            minimal + difference * 0.75,
            maximal,
          ];
          console.log('tickVals ' + JSON.stringify(tickValues));

          return (
            <VictoryAxis
              dependentAxis
              key={dataset.name}
              offsetX={xOffsets[i]}
              tickValues={[0.25, 0.5, 0.75, 1]}
              tickFormat={(t: number) => Math.round(t * maxima[i] * 10) / 10}
              // domain={{ y: [maxima[i] * 0.25, maxima[i]] }}
            />
          );
        })}
        {selectedChannels.map((channel, i) => {
          const currentDataset = datasets.find(
            (dataset) => dataset.name === channel.name
          );
          if (currentDataset) {
            return (
              <VictoryGroup key={currentDataset.name}>
                {type === 'line' && (
                  <VictoryLine
                    style={{
                      data: {
                        stroke: '#e31a1c',
                        strokeOpacity: channel.options.visible ? 1 : 0,
                      },
                    }}
                    data={currentDataset.data}
                    x={XAxis}
                    y={(datum) => datum[currentDataset.name] / maxima[i]}
                  />
                )}
                {/* We render a scatter graph no matter what as otherwise line charts
                wouldn't be able to have hover tooltips */}
                <VictoryScatter
                  style={{
                    data: {
                      fill: '#e31a1c',
                      fillOpacity: channel.options.visible ? 1 : 0,
                    },
                  }}
                  data={currentDataset.data}
                  x={XAxis}
                  y={(datum) => datum[currentDataset.name] / maxima[i]}
                  size={type === 'line' ? 2 : 3}
                  labels={({ datum }) => {
                    const formattedXLabel = formatTooltipLabel(
                      datum._x,
                      XAxisSettings.scale
                    );
                    const formattedYLabel = formatTooltipLabel(
                      datum[currentDataset.name],
                      YAxesSettings.scale
                    );
                    return `(${formattedXLabel}, ${formattedYLabel})`;
                  }}
                  labelComponent={<VictoryTooltip />}
                />
              </VictoryGroup>
            );
          } else {
            return <></>;
          }
        })}
      </VictoryChart>
    </div>
  );
};

export default Plot;
