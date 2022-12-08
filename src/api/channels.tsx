import React from 'react';
import axios, { AxiosError } from 'axios';
import {
  Channel,
  FullChannelMetadata,
  FullScalarChannelMetadata,
  Record,
} from '../app.types';
import { useQuery, UseQueryResult, UseQueryOptions } from 'react-query';
import { Column } from 'react-table';
import { roundNumber } from '../table/cellRenderers/cellContentRenderers';
import { selectUrls } from '../state/slices/configSlice';
import { useAppSelector } from '../state/hooks';
import { readSciGatewayToken } from '../parseTokens';

export const generateChannelMetadata = (
  records: Record[]
): FullChannelMetadata[] => {
  if (!records || records.length === 0) return [];

  const metadata: FullChannelMetadata[] = [];

  // This metadata is always present in every record
  const timestampMetadata: FullScalarChannelMetadata = {
    systemName: 'timestamp',
    userFriendlyName: 'Time',
    channel_dtype: 'scalar',
  };
  const shotnumMetadata: FullScalarChannelMetadata = {
    systemName: 'shotnum',
    userFriendlyName: 'Shot Number',
    channel_dtype: 'scalar',
  };
  const activeAreaMetadata: FullScalarChannelMetadata = {
    systemName: 'activeArea',
    userFriendlyName: 'Active Area',
    channel_dtype: 'scalar',
  };
  const activeExperimentMetadata: FullScalarChannelMetadata = {
    systemName: 'activeExperiment',
    userFriendlyName: 'Active Experiment',
    channel_dtype: 'scalar',
  };
  metadata.push(
    timestampMetadata,
    shotnumMetadata,
    activeAreaMetadata,
    activeExperimentMetadata
  );

  records.forEach((record: Record) => {
    const keys = Object.keys(record.channels);
    keys.forEach((key: string) => {
      if (!metadata.find((channel) => channel.systemName === key)) {
        const channel: Channel = record.channels[key];
        const channelDataType = channel.metadata.channel_dtype;
        const newMetadata: FullChannelMetadata = {
          systemName: key,
          channel_dtype: channelDataType,
        };
        metadata.push(newMetadata);
      }
    });
  });

  return metadata;
};

// TODO change this when we have a proper channel info endpoint to query
// This just fetches metadata from the records endpoint at the moment
const fetchChannels = (apiUrl: string): Promise<FullChannelMetadata[]> => {
  return axios
    .get(`${apiUrl}/records`, {
      headers: {
        Authorization: `Bearer ${readSciGatewayToken()}`,
      },
    })
    .then((response) => {
      const records: Record[] = response.data;
      const metadata = generateChannelMetadata(records);
      return metadata;
    });
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export const useChannels = <T extends unknown = FullChannelMetadata[]>(
  options?: UseQueryOptions<FullChannelMetadata[], AxiosError, T, string[]>
): UseQueryResult<T, AxiosError> => {
  const { apiUrl } = useAppSelector(selectUrls);

  return useQuery(
    ['channels'],
    (params) => {
      return fetchChannels(apiUrl);
    },
    {
      onError: (error) => {
        console.log('Got error ' + error.message);
      },
      ...(options ?? {}),
    }
  );
};

export const constructColumns = (channels: FullChannelMetadata[]): Column[] => {
  const myColumns: Column[] = [];

  channels.forEach((channel: FullChannelMetadata) => {
    const newColumn: Column = {
      Header: () => {
        const headerName = channel.userFriendlyName
          ? channel.userFriendlyName
          : channel.systemName;
        // Provide an actual header here when we have it
        // TODO: do we need to split on things other than underscore?
        const parts = headerName.split('_');
        const wordWrap = parts.map(
          (part, i) =>
            // \u200B renders a zero-width space character
            // which allows line-break but isn't visible
            part + (i < parts.length - 1 ? '_\u200B' : '')
        );
        return <React.Fragment>{wordWrap.join('')}</React.Fragment>;
      },
      accessor: channel.systemName,
      // TODO: get these from data channel info
      channelInfo: channel,
    };
    if (channel.channel_dtype === 'scalar') {
      newColumn.Cell = ({ value }) =>
        typeof value === 'number' &&
        typeof channel.significantFigures === 'number' ? (
          <React.Fragment>
            {roundNumber(
              value,
              channel.significantFigures,
              channel.scientificNotation ?? false
            )}
          </React.Fragment>
        ) : (
          <React.Fragment>{String(value ?? '')}</React.Fragment>
        );
    }
    myColumns.push(newColumn);
  });
  return myColumns;
};

export const getScalarChannels = (
  channels: FullChannelMetadata[]
): FullScalarChannelMetadata[] => {
  return channels.filter(
    (channel) => channel.channel_dtype === 'scalar'
  ) as FullScalarChannelMetadata[];
};

const useScalarChannelsOptions = {
  select: (data: FullChannelMetadata[]) => getScalarChannels(data),
};

const useAvailableColumnsOptions = {
  select: (data: FullChannelMetadata[]) => constructColumns(data),
};

export const useScalarChannels = (): UseQueryResult<
  FullScalarChannelMetadata[],
  AxiosError
> => {
  return useChannels(useScalarChannelsOptions);
};

export const useAvailableColumns = (): UseQueryResult<Column[], AxiosError> => {
  return useChannels(useAvailableColumnsOptions);
};
