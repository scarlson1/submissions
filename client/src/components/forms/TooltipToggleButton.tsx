import { forwardRef } from 'react';
import ToggleButton, { ToggleButtonProps } from '@mui/material/ToggleButton';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';

export type TooltipToggleButtonProps = ToggleButtonProps & {
  TooltipProps: Omit<TooltipProps, 'children'>;
};

// Catch props and forward to ToggleButton
export const TooltipToggleButton: React.FC<TooltipToggleButtonProps> = forwardRef(
  ({ TooltipProps, ...props }, ref) => {
    return (
      <Tooltip placement='top' {...TooltipProps}>
        <ToggleButton ref={ref} {...props} />
      </Tooltip>
    );
  }
);
