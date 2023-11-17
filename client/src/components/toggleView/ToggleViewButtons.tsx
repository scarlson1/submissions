import { IconProps, ToggleButton, ToggleButtonGroup, ToggleButtonGroupProps } from '@mui/material';
import { ReactElement } from 'react';

import { getPanelId, getTabId, useToggleContext } from 'context';

export interface ToggleViewButtonsProps<T extends string>
  extends Omit<ToggleButtonGroupProps, 'value'> {
  queryKey: string;
  options: T[];
  defaultOption: T;
  icons: Record<T, ReactElement<IconProps>>;
}

// TODO: replace above with context based component once shifted over
// decide whether to wrap state management with context ?? or follow tabs example and pass value to context provider ??
export function ToggleViewButtons<T extends string>({
  queryKey,
  options,
  defaultOption,
  icons,
  onChange,
  ...props
}: ToggleViewButtonsProps<T>) {
  const context = useToggleContext();

  return (
    <ToggleButtonGroup value={context.value} onChange={onChange} exclusive size='small' {...props}>
      {options.map((o) => (
        <ToggleButton
          value={o}
          aria-label={o}
          aria-controls={getPanelId(context, o) || `${context.idPrefix}-${o}`}
          id={getTabId(context, o) || `${context.idPrefix}-${o}`}
          key={o}
        >
          {icons[o] || o}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
