import React from 'react';
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import type { PlotContinuity, PlotType } from '../../app.types';

export interface PlotContinuityRadioGroupProps {
  plotType: PlotType;
  plotContinuity: PlotContinuity;
  changePlotContinuity: (plotContinuity: PlotContinuity) => void;
}

const PlotContinuityRadioGroup = (props: PlotContinuityRadioGroupProps) => {
  const { plotType, plotContinuity, changePlotContinuity } = props;

  const handleChangePlotContinuity = React.useCallback(
    (continuity: PlotContinuity) => {
      changePlotContinuity(continuity);
    },
    [changePlotContinuity]
  );

  return (
    <FormControl
      disabled={plotType === 'scatter'}
      sx={{ flexDirection: 'row', alignItems: 'center' }}
    >
      <FormLabel id="plot-continuity-label" sx={{ mr: 1 }}>
        Continuity
      </FormLabel>
      <RadioGroup
        row
        aria-labelledby="plot-continuity-label"
        name="plot continuity radio buttons group"
        value={plotContinuity}
        onChange={(_, value) =>
          handleChangePlotContinuity(value as PlotContinuity)
        }
      >
        <FormControlLabel
          value="continuous"
          control={<Radio />}
          label="Continuous"
        />
        <FormControlLabel
          value="discontinuous"
          control={<Radio />}
          label="Discontinuous"
        />
      </RadioGroup>
    </FormControl>
  );
};

export default PlotContinuityRadioGroup;
