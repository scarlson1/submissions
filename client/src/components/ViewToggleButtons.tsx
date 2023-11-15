import {
  Box,
  IconProps,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from '@mui/material';
import { ReactElement } from 'react';

import { useSearchParamToggle } from 'hooks';

interface ViewToggleButtonsProps<T extends string>
  extends Omit<ToggleButtonGroupProps, 'value' | 'onChange'> {
  queryKey: string;
  options: T[];
  defaultOption: T;
  icons: Record<T, ReactElement<IconProps>>;
}
// TODO: need to wrap in context ?? like tabs (TabPanel)
export function ViewToggleButtons<T extends string>({
  queryKey,
  options,
  defaultOption,
  icons,
  ...props
}: ViewToggleButtonsProps<T>) {
  const [view, handleViewChange] = useSearchParamToggle<T>(queryKey, options, defaultOption);

  return (
    <Box>
      <ToggleButtonGroup
        value={view}
        onChange={handleViewChange}
        exclusive
        size='small'
        aria-label='view'
        {...props}
      >
        {options.map((o) => (
          <ToggleButton value={o} aria-label={o} key={o}>
            {icons[o] || o}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
