import React from 'react';
import axios, { AxiosError } from 'axios';
import { useQuery, UseQueryResult } from 'react-query';
import {
  Channel,
  DateRange,
  ImageChannel,
  isChannelScalar,
  PlotDataset,
  Record,
  RecordRow,
  ScalarChannel,
  SortType,
  WaveformChannel,
  SelectedPlotChannel,
} from '../app.types';
import { useAppSelector } from '../state/hooks';
import { selectQueryParams } from '../state/slices/searchSlice';
import { parseISO, format } from 'date-fns';
import { selectUrls } from '../state/slices/configSlice';

const fetchRecords = async (
  apiUrl: string,
  sort: SortType,
  dateRange: DateRange,
  offsetParams?: {
    startIndex: number;
    stopIndex: number;
  }
): Promise<Record[]> => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(sort)) {
    // API recognises sort values as metadata.key or channel.key
    // Therefore, we must construct the appropriate parameter
    const sortKey = [
      'timestamp',
      'shotnum',
      'activeArea',
      'activeExperiment',
    ].includes(key)
      ? `metadata.${key}`
      : `channels.${key}`;
    params.append('order', `${sortKey} ${value}`);
  }

  if (Object.keys(dateRange).length > 0) {
    const timestampObj = {
      $and: [
        {
          'metadata.timestamp': {
            $gt: dateRange.fromDate,
            $lt: dateRange.toDate,
          },
        },
      ],
    };
    params.append('conditions', JSON.stringify(timestampObj));
  }

  if (offsetParams) {
    params.append('skip', JSON.stringify(offsetParams.startIndex));
    params.append(
      'limit',
      JSON.stringify(offsetParams.stopIndex - offsetParams.startIndex + 1)
    );
  }

  return axios.get(`${apiUrl}/records`, { params }).then((response) => {
    const records: Record[] = response.data;
    return records;
  });
};

const fetchRecordCountQuery = (
  apiUrl: string,
  dateRange: DateRange
): Promise<number> => {
  const params = new URLSearchParams();
  if (Object.keys(dateRange).length > 0) {
    const timestampObj = {
      $and: [
        {
          'metadata.timestamp': {
            $gt: dateRange.fromDate,
            $lt: dateRange.toDate,
          },
        },
      ],
    };
    params.append('conditions', JSON.stringify(timestampObj));
  }

  return axios
    .get(`${apiUrl}/records/count`, { params })
    .then((response) => response.data);
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export const usePlotRecords = (
  selectedPlotChannels: SelectedPlotChannel[],
  XAxis?: string
): UseQueryResult<PlotDataset[], AxiosError> => {
  useAppSelector(selectQueryParams);
  const { apiUrl } = useAppSelector(selectUrls);

  return useQuery(
    ['records'],
    () => {
      if (!XAxis) XAxis = 'timestamp';
      return fetchRecords(apiUrl, { [XAxis]: 'asc' }, {});
    },
    {
      onError: (error) => {
        console.log('Got error ' + error.message);
      },
      select: (records: Record[]) => {
        const plotDatasets = selectedPlotChannels.map((plotChannel) => {
          const plotChannelName = plotChannel.name;

          // Add the initial entry for dataset called plotChannelName
          // data field is currently empty, the below loop populates it
          const newDataset: PlotDataset = {
            name: plotChannelName,
            data: [],
          };

          // Populate the above data field
          records.forEach((record) => {
            const formattedXAxis = getFormattedAxisData(record, XAxis ?? '');
            const formattedYAxis = getFormattedAxisData(
              record,
              plotChannelName
            );

            const currentData = newDataset.data;
            currentData.push({
              [XAxis ?? '']: formattedXAxis, // this is annoying but theoretically if we ever reach here, XAxis will always be defined
              [plotChannelName]: formattedYAxis,
            });
          });

          return newDataset;
        });

        return plotDatasets;
      },
    }
  );
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export const useRecordsPaginated = (): UseQueryResult<
  RecordRow[],
  AxiosError
> => {
  const { page, resultsPerPage, sort, dateRange } =
    useAppSelector(selectQueryParams);
  const { apiUrl } = useAppSelector(selectUrls);

  return useQuery<
    Record[],
    AxiosError,
    RecordRow[],
    [
      string,
      {
        page: number;
        resultsPerPage: number;
        sort: SortType;
        dateRange: DateRange;
      }
    ]
  >(
    ['records', { page, resultsPerPage, sort, dateRange }],
    (params) => {
      const { page, resultsPerPage, sort, dateRange } = params.queryKey[1];
      // React Table pagination is zero-based
      const startIndex = page * resultsPerPage;
      const stopIndex = startIndex + resultsPerPage - 1;
      return fetchRecords(apiUrl, sort, dateRange, { startIndex, stopIndex });
    },
    {
      onError: (error) => {
        console.log('Got error ' + error.message);
      },
      select: (data: Record[]) =>
        data.map((record: Record) => {
          const timestampString = record.metadata.timestamp;
          const timestampDate = parseISO(timestampString);
          const formattedDate = format(timestampDate, 'yyyy-MM-dd HH:mm:ss');
          const recordRow: RecordRow = {
            timestamp: formattedDate,
            shotnum: record.metadata.shotnum,
            activeArea: record.metadata.activeArea,
            activeExperiment: record.metadata.activeExperiment,
          };

          const keys = Object.keys(record.channels);
          keys.forEach((key: string) => {
            const channel: Channel = record.channels[key];
            let channelData;
            const channelDataType = channel.metadata.channel_dtype;

            switch (channelDataType) {
              case 'scalar':
                channelData = (channel as ScalarChannel).data;
                break;
              case 'image':
                channelData = (channel as ImageChannel).thumbnail;
                channelData = (
                  <img
                    src={`data:image/jpeg;base64,${channelData}`}
                    alt={key}
                    style={{ border: '1px solid #000000' }}
                  />
                );
                break;
              case 'waveform':
                channelData = (channel as WaveformChannel).thumbnail;
                channelData = (
                  <img
                    src={`data:image/jpeg;base64,${channelData}`}
                    alt={key}
                    style={{ border: '1px solid #000000' }}
                  />
                );
            }

            recordRow[key] = channelData;
          });

          return recordRow;
        }),
    }
  );
};

export const getFormattedAxisData = (
  record: Record,
  axisName: string
): number | null => {
  let formattedData = null;

  switch (axisName) {
    case 'timestamp':
      formattedData = parseISO(record.metadata.timestamp).getTime();
      break;
    case 'shotnum':
      formattedData = record.metadata.shotnum ?? null;
      break;
    case 'activeArea':
      formattedData = parseInt(record.metadata.activeArea);
      break;
    case 'activeExperiment':
      formattedData = record.metadata.activeExperiment
        ? parseInt(record.metadata.activeExperiment)
        : null;
      break;
    default:
      const channel = record.channels[axisName];
      if (isChannelScalar(channel)) {
        formattedData =
          typeof channel.data === 'number'
            ? channel.data
            : parseFloat(channel.data);
      }
  }

  return formattedData;
};

export const useRecordCount = (): UseQueryResult<number, AxiosError> => {
  const { apiUrl } = useAppSelector(selectUrls);
  const { dateRange } = useAppSelector(selectQueryParams);

  return useQuery<
    number,
    AxiosError,
    number,
    [string, { dateRange: DateRange }]
  >(
    ['recordCount', { dateRange }],
    (params) => {
      const { dateRange } = params.queryKey[1];
      return fetchRecordCountQuery(apiUrl, dateRange);
    },
    {
      onError: (error) => {
        console.log('Got error ' + error.message);
      },
    }
  );
};
