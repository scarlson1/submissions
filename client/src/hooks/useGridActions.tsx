import { useCallback } from 'react';
import { GridActionsCellItem, GridActionsCellItemProps, GridRowParams } from '@mui/x-data-grid';
import { Tooltip } from '@mui/material';
import { FloodRounded, MapRounded } from '@mui/icons-material';

import { Submission } from 'common';
import { useFloodFactor } from './useFloodFactor';
import { useWidth } from './useWidth';
import { openGoogleMaps } from 'modules/utils';

type ActionOptions = Omit<Partial<GridActionsCellItemProps>, 'onClick' | 'label' | 'icon'>;

export const useGridActions = (onError?: (msg: string) => void) => {
  const openFF = useFloodFactor(onError);
  const { isSmall } = useWidth();

  const openMap = useCallback(
    (params: GridRowParams<Submission>) => () => {
      const latitude = params.row.coordinates?.latitude;
      const longitude = params.row.coordinates?.longitude;
      if (!(latitude && longitude)) return onError && onError('Missing coordinates');

      openGoogleMaps(latitude, longitude);
    },
    [onError]
  );

  const openFloodFactor = useCallback(
    (params: GridRowParams<Submission>) => () => {
      const address = params.row.address;
      if (!(address && address.addressLine1)) return onError && onError('Missing address');

      openFF(address);
    },
    [openFF, onError]
  );

  const googleMapsAction = useCallback(
    (params: GridRowParams, options?: ActionOptions) => (
      // @ts-ignore
      <GridActionsCellItem
        icon={
          <Tooltip title='Google maps' placement='top'>
            <MapRounded />
          </Tooltip>
        }
        onClick={openMap(params)}
        label='Google Maps'
        showInMenu={isSmall}
        {...(options || {})}
      />
    ),
    [openMap, isSmall]
  );

  const floodFactorAction = useCallback(
    (params: GridRowParams, options?: ActionOptions) => (
      // @ts-ignore
      <GridActionsCellItem
        icon={
          <Tooltip title='Flood Factor' placement='top'>
            <FloodRounded />
          </Tooltip>
        }
        onClick={openFloodFactor(params)}
        label='Flood Factor'
        showInMenu={isSmall}
        {...(options || {})}
      />
    ),
    [openFloodFactor, isSmall]
  );

  return { googleMapsAction, floodFactorAction };
};
