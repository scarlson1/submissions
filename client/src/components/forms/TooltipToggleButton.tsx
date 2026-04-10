import ToggleButton, { ToggleButtonProps } from '@mui/material/ToggleButton';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import { forwardRef } from 'react';

export type TooltipToggleButtonProps = ToggleButtonProps & {
  TooltipProps: Omit<TooltipProps, 'children'>;
};

// : React.FC<TooltipToggleButtonProps>
// Catch props and forward to ToggleButton
export const TooltipToggleButton = forwardRef<
  HTMLButtonElement,
  TooltipToggleButtonProps
>(({ TooltipProps, ...props }, ref) => {
  return (
    <Tooltip placement='top' {...TooltipProps}>
      <ToggleButton ref={ref} {...props} />
    </Tooltip>
  );
});
