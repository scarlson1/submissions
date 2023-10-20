import { DataObject, FloodRounded, MapRounded } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { GridActionsCellItem, GridActionsCellItemProps, GridRowParams } from '@mui/x-data-grid';
import { DocumentData, FirestoreDataConverter } from 'firebase/firestore';
import { ReactElement, useCallback } from 'react';
import {
  SignInCheckOptionsBasic,
  SignInCheckOptionsClaimsObject,
  SignInCheckOptionsClaimsValidator,
  useSigninCheck,
} from 'reactfire';

import { Submission, WithId } from 'common';
import { openGoogleMaps } from 'modules/utils';
import { useFloodFactor } from './useFloodFactor';
import { useShowJson } from './useShowJson';
import { useWidth } from './utils/useWidth';

export type ActionOptions = Omit<Partial<GridActionsCellItemProps>, 'onClick' | 'label' | 'icon'>;

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
      (<GridActionsCellItem
        icon={
          <Tooltip title='Google maps' placement='top'>
            <MapRounded />
          </Tooltip>
        }
        onClick={openMap(params)}
        label='Google Maps'
        showInMenu={isSmall}
        {...(options || {})}
      />)
    ),
    [openMap, isSmall]
  );

  const floodFactorAction = useCallback(
    (params: GridRowParams, options?: ActionOptions) => (
      // @ts-ignore
      (<GridActionsCellItem
        icon={
          <Tooltip title='Flood Factor' placement='top'>
            <FloodRounded />
          </Tooltip>
        }
        onClick={openFloodFactor(params)}
        label='Flood Factor'
        showInMenu={isSmall}
        {...(options || {})}
      />)
    ),
    [openFloodFactor, isSmall]
  );

  return { googleMapsAction, floodFactorAction };
};

export const useGridShowJson = <T extends DocumentData>(
  colName: string,
  options?: ActionOptions,
  signInCheckOptions?:
    | SignInCheckOptionsBasic
    | SignInCheckOptionsClaimsObject
    | SignInCheckOptionsClaimsValidator
    | undefined,
  getTitle?: null | ((data: WithId<T>) => string),
  converter?: FirestoreDataConverter<T>,
  getPath?: (params: GridRowParams) => string
): ((params: GridRowParams) => ReactElement<GridActionsCellItemProps>[]) => {
  const { data } = useSigninCheck(signInCheckOptions);
  const showJson = useShowJson<T>(colName, [], getTitle, converter);

  const handleShowJson = useCallback(
    (params: GridRowParams) => () => {
      let docPath = getPath ? getPath(params) : params.id.toString();
      showJson(docPath);
    },
    [showJson, getPath]
  );

  const renderActions = useCallback(
    (params: GridRowParams) => [
      // @ts-ignore
      <GridActionsCellItem
        onClick={handleShowJson(params)}
        icon={
          <Tooltip title='Show JSON' placement='top'>
            <DataObject />
          </Tooltip>
        }
        label='Show JSON'
        {...(options || {})}
      />,
    ],
    [handleShowJson, options]
  );

  if (!data.hasRequiredClaims) return () => [];

  return renderActions;
};
