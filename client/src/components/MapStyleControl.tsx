import { useCallback, useMemo } from 'react';
import { ToggleButton, ToggleButtonGroup, ToggleButtonGroupProps } from '@mui/material';
import { useMap } from 'react-map-gl';

import { useLocalStorage } from 'hooks';

export const MAPBOX_LIGHT = 'mapbox://styles/mapbox/light-v11';
export const MAPBOX_DARK = 'mapbox://styles/spencer-carlson/cl8dxgtum000w14qix5ft9gw5';
export const MAPBOX_STREETS = 'mapbox://styles/mapbox/streets-v12';
export const MAPBOX_SATELLITE = 'mapbox://styles/mapbox/satellite-v9';

export const usePreferredMapStyle = (initVal: string = MAPBOX_STREETS) => {
  const [mapStyle, setStyle] = useLocalStorage<string>('preferred-map-style', initVal);

  const setMapStyle = useCallback(
    (newStyle: string) => {
      console.log('SETTING STYLE: ', newStyle);
      setStyle(newStyle);
    },
    [setStyle]
  );

  return [mapStyle, setMapStyle] as const;
};

export const useMapboxStyleControl = (
  initial: string,
  props?: Omit<ToggleButtonGroupProps, 'onChange' | 'value' | 'exclusive'>
): ToggleButtonGroupProps => {
  const { current: map } = useMap();
  // const [style, setStyle] = useState<string>(initial);
  const [style, setStyle] = usePreferredMapStyle(initial);

  const handleChange = useCallback(
    (event: React.MouseEvent<HTMLElement>, newVal: string) => {
      if (newVal) {
        setStyle(newVal);
        map?.getMap().setStyle(newVal, { diff: true });
      }
    },
    [map, setStyle]
  );

  return useMemo(
    () => ({
      onChange: handleChange,
      value: style,
      exclusive: true,
      size: 'small',
      'aria-label': 'style',
      ...props,
      sx: {
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 0.5,
        ...(props?.sx || {}),
      },
    }),
    [props, style, handleChange]
  );
};

const DEFAULT_STYLE_OPTIONS = [
  { label: 'Light', value: MAPBOX_LIGHT },
  { label: 'Dark', value: MAPBOX_DARK },
  { label: 'Streets', value: MAPBOX_STREETS },
  { label: 'Satellite', value: MAPBOX_SATELLITE },
];

interface MapboxStyleControlProps
  extends Omit<ToggleButtonGroupProps, 'onChange' | 'value' | 'exclusive'> {
  initStyle: string;
  options?: { label: string; value: string }[];
}

export function MapStyleControl({
  options = DEFAULT_STYLE_OPTIONS,
  initStyle,
  ...props
}: MapboxStyleControlProps) {
  const styleProps = useMapboxStyleControl(initStyle, props);

  return (
    <ToggleButtonGroup {...styleProps} sx={{ borderRadius: 0.5, ...(styleProps.sx || {}) }}>
      {options.map((s) => (
        <ToggleButton
          value={s.value}
          key={s.value}
          sx={{
            border: 'none !important',
            backgroundColor: (theme) => theme.palette.background.paper,
            '&:hover, &.Mui-selected:hover': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.primaryDark[700]
                  : theme.palette.grey[50],
            },
          }}
        >
          {s.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
