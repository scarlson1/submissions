import { useMemo } from 'react';

import { Typography } from '@mui/material';
import Grid, { Grid2Props } from '@mui/material/Unstable_Grid2';
import { useFormikContext } from 'formik';
import { round } from 'lodash';

import type { FloodValues } from '@idemand/common';
import { LimitKeys } from 'common/types';
import {
  FormikDollarMaskField,
  FormikDollarMaskFieldProps,
} from 'components/forms';
import { extractNumber } from 'modules/utils/helpers';

// TODO: use increment cards & text field or slider ??
// TODO: round value to nearest 1,000
// remove "description" jsx

// TODO: use zod
enum FieldNames {
  A = 'limits.limitA',
  B = 'limits.limitB',
  C = 'limits.limitC',
  D = 'limits.limitD',
}

const limitFields = [
  {
    title: 'Building Coverage',
    // limitField: 'building',
    name: FieldNames.A, // 'limitA', // 'coverages.building',
    inputLabel: 'Building Limit',
    description: '', // 'TODO: add description here',
    coverageActiveField: 'coverageActiveBuilding',
  },
  {
    title: 'Additional Structures Coverage',
    name: FieldNames.B, // 'limitB',
    inputLabel: 'Additional Structures Limit',
    description: '', // 'TODO: add description here',
    coverageActiveField: 'coverageActiveStructures',
  },
  {
    title: 'Contents Coverage',
    name: FieldNames.C, // 'limitC', // 'coverages.contents',
    inputLabel: 'Contents Limit',
    description: '', // 'TODO: add description here',
    coverageActiveField: 'coverageActiveContents',
  },
  {
    title: 'Living Expenses Coverage',
    name: FieldNames.D, // 'limitD', // 'coverages.additional',
    inputLabel: 'Additional Expenses Limit',
    description: '', // 'TODO: add description here',
    coverageActiveField: 'coverageActiveAdditional',
  },
];

const getFormattedPct = (portion: number, total: number) =>
  round((portion / total) * 100, 1);

export interface LimitsStepProps {
  gridProps?: Grid2Props;
  gridItemProps?: Grid2Props;
  inputProps?: Partial<FormikDollarMaskFieldProps>;
  replacementCost: number | undefined;
  description?: string;
}

export const LimitsStep = ({
  gridProps,
  gridItemProps,
  inputProps,
  replacementCost,
  description,
}: LimitsStepProps) => {
  const { values, setFieldValue, setFieldTouched } =
    useFormikContext<FloodValues>();

  const helperText = useMemo(() => {
    let result: { [key: string]: string | undefined } = {
      limitA: undefined,
      limitB: undefined,
      limitC: undefined,
      limitD: undefined,
    };
    if (!replacementCost) return result;

    Object.keys(result).forEach((key) => {
      const limitVal = values.limits[key as LimitKeys];
      const limitNum =
        typeof limitVal === 'string' ? parseInt(limitVal) : limitVal;
      const ht = getFormattedPct(limitNum, replacementCost);
      if (!isNaN(ht)) {
        result[key] = `${ht}% of building replacement cost`;
      }
    });

    return result;
  }, [values, replacementCost]);

  return (
    <Grid
      container
      rowSpacing={{ xs: 4, sm: 6, md: 8 }}
      columnSpacing={{ xs: 6, sm: 9, md: 12 }}
      {...gridProps}
    >
      {description && (
        <Grid xs={12}>
          <Typography color='text.secondary' gutterBottom>
            {description}
          </Typography>
        </Grid>
      )}
      {limitFields.map((field) => (
        <Grid xs={12} sm={6} key={field.name} {...gridItemProps}>
          <FormikDollarMaskField
            name={field.name}
            label={field.inputLabel}
            helperText={helperText[field.name]}
            variant='standard'
            required
            disabled={false}
            fullWidth
            onBlur={(e) => {
              const num = extractNumber(e.target.value || '');
              const newVal = round(num);
              setFieldValue(field.name, newVal);
              setTimeout(() => {
                setFieldTouched(field.name, true);
              }, 50);
            }}
            inputProps={{ inputMode: 'numeric' }}
            {...inputProps}
          />
        </Grid>
      ))}
    </Grid>
  );
};
