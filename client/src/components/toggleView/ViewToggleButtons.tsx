import {
  Box,
  IconProps,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from '@mui/material';
import { ReactElement } from 'react';

import { useToggleContext } from 'context';
import { useSearchParamToggle } from 'hooks';

// TODO: theme toggle buttons size small --> smaller padding on buttons
// see mui api toggle buttons for reference
// mui color mode ref (local storage): https://github.com/mui/material-ui/blob/master/packages/mui-system/src/cssVars/useCurrentColorScheme.ts
// TODO: get default option from local storage

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

interface ViewToggleButtonsPropsCtx<T extends string>
  extends Omit<ToggleButtonGroupProps, 'value'> {
  queryKey: string;
  options: T[];
  defaultOption: T;
  icons: Record<T, ReactElement<IconProps>>;
}

// TODO: replace above with context based component once shifted over
// decide whether to wrap state management with context ?? or follow tabs example and pass value to context provider ??
export function ToggleViewButtonsCtx<T extends string>({
  queryKey,
  options,
  defaultOption,
  icons,
  onChange,
  ...props
}: ViewToggleButtonsPropsCtx<T>) {
  const { value } = useToggleContext();

  return (
    <ToggleButtonGroup value={value} exclusive size='small' {...props}>
      {options.map((o) => (
        <ToggleButton value={o} aria-label={o} key={o}>
          {icons[o] || o}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
