import React from 'react';
import DateTime from './components/dateTime.component';
import Timeframe, {
  type TimeframeRange,
} from './components/timeframe.component';
import Experiment from './components/experiment.component';
import ShotNumber from './components/shotNumber.component';
import MaxShots from './components/maxShots.component';
import {
  Grid,
  Button,
  Collapse,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import DataRefresh from './components/dataRefresh.component';
import { useAppSelector, useAppDispatch } from '../state/hooks';
import { DateRange, SearchParams, ShotnumRange } from '../app.types';
import { sub } from 'date-fns';
import {
  changeSearchParams,
  selectSearchParams,
  formatDateTimeForApi,
} from '../state/slices/searchSlice';
import { selectRecordLimitWarning } from '../state/slices/configSlice';
import { useIncomingRecordCount } from '../api/records';
import { useQueryClient } from '@tanstack/react-query';
import { selectQueryFilters } from '../state/slices/filterSlice';

export type TimeframeDates = {
  fromDate: Date | null;
  toDate: Date | null;
};

interface SearchBarProps {
  expanded: boolean;
}

const SearchBar = (props: SearchBarProps): React.ReactElement => {
  const dispatch = useAppDispatch();

  const searchParams = useAppSelector(selectSearchParams); // the parameters sent to the search query itself
  const { dateRange, shotnumRange, maxShots: maxShotsParam } = searchParams;

  // we need filters so we can check for past queries before showing the warning message
  const filters = useAppSelector(selectQueryFilters);

  const [paramsUpdated, setParamsUpdated] = React.useState<boolean>(false);

  // ########################
  // DATE-TIME FIELDS
  // ########################
  // The FROM and TO dates sent as part of the query (if any)
  const [searchParameterFromDate, setSearchParameterFromDate] =
    React.useState<Date | null>(
      dateRange.fromDate ? new Date(dateRange.fromDate) : null
    );
  const [searchParameterToDate, setSearchParameterToDate] =
    React.useState<Date | null>(
      dateRange.toDate ? new Date(dateRange.toDate) : null
    );

  // ########################
  // TIMEFRAME
  // ########################
  // Timeframe range is NOT sent as part of query
  // Instead, we use this to determine the FROM and TO dates
  // This is set in the timeframe search box by the user
  // If the user edits any of the date fields otherwise, this is set to null
  const [timeframeRange, setTimeframeRange] =
    React.useState<TimeframeRange | null>(null);

  const calculateTimeframeDateRange = (
    timeframe: TimeframeRange
  ): { from: Date; to: Date } => {
    const to = new Date();
    const from = sub(new Date(to), { [timeframe.timescale]: timeframe.value });

    return { from, to };
  };

  const setRelativeTimeframe = React.useCallback(
    (timeframe: TimeframeRange | null) => {
      if (timeframe == null) {
        setTimeframeRange(null);
        return;
      }

      const { from, to } = calculateTimeframeDateRange(timeframe);
      setTimeframeRange(timeframe);
      setSearchParameterFromDate(from);
      setSearchParameterToDate(to);
    },
    []
  );

  // ########################
  // SHOT NUMBER MIN AND MAX
  // ########################
  // The SHOT NUMBER MIN AND MAX fields sent as part of the query (if any)
  const [searchParameterShotnumMin, setSearchParameterShotnumMin] =
    React.useState<number | undefined>(shotnumRange.min ?? undefined);
  const [searchParameterShotnumMax, setSearchParameterShotnumMax] =
    React.useState<number | undefined>(shotnumRange.max ?? undefined);

  const [maxShots, setMaxShots] =
    React.useState<SearchParams['maxShots']>(maxShotsParam);

  React.useEffect(() => {
    setParamsUpdated(true);
    // reset warning message when search params change
    setDisplayingWarningMessage(false);
  }, [
    searchParameterFromDate,
    searchParameterToDate,
    searchParameterShotnumMin,
    searchParameterShotnumMax,
    maxShots,
  ]);

  // ########################
  // RECORD LIMIT WARNING
  // ########################
  // The limit on how many records are fetched before displaying a warning to the user
  const recordLimitWarning = useAppSelector(selectRecordLimitWarning);
  const recordLimitSet = recordLimitWarning > -1;

  const [displayingWarningMessage, setDisplayingWarningMessage] =
    React.useState<boolean>(false);

  // ########################
  // INCOMING PARAMETERS
  // ########################
  // Parameters initially used to fetch the count of records in the new search request
  // Ties in with record limit warning message to get the count of new records before actually retrieving them
  // Can be thought of as working search parameters before the user commits to searching by them
  const [incomingParams, setIncomingParams] =
    React.useState<SearchParams>(searchParams);

  const { data: incomingCount, isLoading: countLoading } =
    useIncomingRecordCount(undefined, incomingParams);

  const queryClient = useQueryClient();

  const overRecordLimit = React.useCallback((): boolean => {
    return (
      !countLoading &&
      incomingCount !== undefined &&
      incomingCount > recordLimitWarning
    );
  }, [countLoading, incomingCount, recordLimitWarning]);

  // ########################
  // INITIATING THE SEARCH
  // ########################
  const handleSearch = React.useCallback(() => {
    const newDateRange: DateRange = {
      fromDate: searchParameterFromDate
        ? formatDateTimeForApi(searchParameterFromDate)
        : undefined,
      toDate: searchParameterToDate
        ? formatDateTimeForApi(searchParameterToDate)
        : undefined,
    };

    const newShotnumRange: ShotnumRange = {
      min: searchParameterShotnumMin,
      max: searchParameterShotnumMax,
    };

    const newSearchParams: SearchParams = {
      dateRange: newDateRange,
      shotnumRange: newShotnumRange,
      maxShots,
    };

    if (recordLimitSet) {
      setIncomingParams(newSearchParams);
      if (
        !displayingWarningMessage &&
        overRecordLimit() &&
        // search for if we have previously made a search with these params
        // use exact: false to ignore things like sort, pagination etc.
        queryClient.getQueriesData({
          exact: false,
          queryKey: [
            'records',
            { filters: filters, searchParams: newSearchParams },
          ],
        }).length === 0
      ) {
        setDisplayingWarningMessage(true);
        return;
      }
    }

    setDisplayingWarningMessage(false);
    dispatch(changeSearchParams(newSearchParams));
    setParamsUpdated(false);
  }, [
    searchParameterFromDate,
    searchParameterToDate,
    searchParameterShotnumMin,
    searchParameterShotnumMax,
    maxShots,
    recordLimitSet,
    dispatch,
    displayingWarningMessage,
    overRecordLimit,
    queryClient,
    filters,
  ]);

  const [refreshingData, setRefreshingData] = React.useState<boolean>(false);

  const refreshData = () => {
    setRelativeTimeframe(timeframeRange);
    setRefreshingData(true);
  };

  React.useEffect(() => {
    if (refreshingData) {
      handleSearch();
      setRefreshingData(false);
    }
  }, [handleSearch, refreshingData]);

  const { expanded } = props;

  return (
    <Collapse in={expanded} timeout="auto" unmountOnExit>
      <Grid container spacing={1} direction="row">
        <Grid container item xs={11} direction="column">
          <Grid item>
            <Grid container spacing={1} direction="row">
              <Grid item xs={5}>
                <DateTime
                  searchParameterFromDate={searchParameterFromDate}
                  searchParameterToDate={searchParameterToDate}
                  changeSearchParameterFromDate={setSearchParameterFromDate}
                  changeSearchParameterToDate={setSearchParameterToDate}
                  resetTimeframe={() => setRelativeTimeframe(null)}
                  timeframeRange={timeframeRange}
                />
              </Grid>
              <Grid item xs={2}>
                <Timeframe
                  timeframe={timeframeRange}
                  changeTimeframe={setRelativeTimeframe}
                />
              </Grid>
              <Grid item xs={2}>
                <Experiment />
              </Grid>
              <Grid item xs={2}>
                <ShotNumber
                  searchParameterShotnumMin={searchParameterShotnumMin}
                  searchParameterShotnumMax={searchParameterShotnumMax}
                  changeSearchParameterShotnumMin={setSearchParameterShotnumMin}
                  changeSearchParameterShotnumMax={setSearchParameterShotnumMax}
                />
              </Grid>
              <Grid item xs={1}>
                {displayingWarningMessage ? (
                  <Tooltip
                    componentsProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: 'yellow',
                          color: 'black',
                          border: '1px solid black',
                        },
                      },
                    }}
                    data-testid="results-tooltip"
                    arrow
                    placement="bottom"
                    title={
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          cursor: 'pointer',
                          overflow: 'hidden',
                        }}
                      >
                        <Warning
                          sx={{ fontSize: 25, padding: '10px 5px 5px 0px' }}
                        />
                        <div>
                          <Typography variant="caption" align="center">
                            {`This search will return over ${recordLimitWarning}
                      results.`}
                          </Typography>
                          <br />
                          <Typography variant="caption" align="center">
                            Click Search again to continue
                          </Typography>
                        </div>
                      </Box>
                    }
                  >
                    <Button
                      variant={paramsUpdated ? 'contained' : 'outlined'}
                      sx={{ height: '100%' }}
                      onClick={handleSearch}
                    >
                      Search
                    </Button>
                  </Tooltip>
                ) : (
                  <Button
                    variant={paramsUpdated ? 'contained' : 'outlined'}
                    sx={{ height: '100%' }}
                    onClick={handleSearch}
                  >
                    Search
                  </Button>
                )}
              </Grid>
            </Grid>
          </Grid>
          <Grid container direction="row">
            <Grid item>
              <MaxShots maxShots={maxShots} changeMaxShots={setMaxShots} />
            </Grid>
            <Grid item>
              <DataRefresh
                timeframeSet={!!timeframeRange}
                refreshData={refreshData}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Collapse>
  );
};

SearchBar.displayName = 'SearchBar';

export default SearchBar;
