import React from 'react';
import { Chip, ChipProps, Link, Stack } from '@mui/material';
import { GridRenderCellParams } from '@mui/x-data-grid';

import { formatPhoneNumber } from 'modules/utils/helpers';

export const renderGridPhone = (params: GridRenderCellParams<any, any, any>) => {
  if (params.value == null) return '';

  return (
    <Link href={`tel:${params.value}`} underline='hover'>
      {formatPhoneNumber(params.value)}
    </Link>
  );
};
export const renderGridEmail = (params: GridRenderCellParams<any, any, any>) => {
  if (params.value == null) return '';

  return (
    <Link href={`mailto:${params.value}`} underline='hover' onClick={(e) => e.stopPropagation()}>
      {params.value}
    </Link>
  );
};

export const renderChips = (params: GridRenderCellParams<any, any, any>, chipProps?: ChipProps) => {
  return (
    <Stack spacing={1} direction='row'>
      {params.value.map((i: string) => (
        <Chip key={i} label={i} size='small' {...chipProps} />
      ))}
    </Stack>
  );
};
