import React from 'react';
import { HexColorPicker } from 'react-colorful';
import { Box } from '@mui/material';
import { useClickOutside } from '../../../hooks';

type ColourPickerProps = {
  channelName: string;
  colour: string;
  changeColour: (colour: string) => void;
};

const ColourPicker = (props: ColourPickerProps) => {
  const { channelName, colour, changeColour } = props;
  const popover = React.useRef<HTMLDivElement | null>(null);
  const parent = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, toggle] = React.useState(false);

  const close = React.useCallback(() => toggle(false), []);
  // use parent node which is always mounted to get the document to attach event listeners to
  useClickOutside(popover, close, parent.current?.ownerDocument);

  return (
    <Box sx={{ position: 'relative' }} ref={parent}>
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '8px',
          border: '3px solid #fff',
          boxShadow:
            '0 0 0 1px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          backgroundColor: colour,
        }}
        component="button"
        onClick={() => toggle(!isOpen)}
        aria-label={`Pick ${channelName} colour`}
        aria-haspopup="dialog"
      />

      {isOpen && (
        <Box
          role="dialog"
          sx={{
            position: 'absolute',
            top: -95,
            right: 30,
            zIndex: 1,
            borderRadius: 9,
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
            '& .react-colorful': {
              height: 125,
              width: 125,
            },
            '& .react-colorful__saturation': {
              borderBottom: '5px solid #000',
            },
            '& .react-colorful__hue': {
              height: 16,
            },
            '& .react-colorful__saturation-pointer, .react-colorful__hue-pointer':
              {
                height: 16,
                width: 16,
              },
          }}
          ref={popover}
        >
          <HexColorPicker
            color={colour}
            onChange={(newColour: string) => {
              changeColour(newColour);
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ColourPicker;
