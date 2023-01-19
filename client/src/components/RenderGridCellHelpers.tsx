import React from 'react';
import { Link } from '@mui/material';
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
