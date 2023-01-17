import React, { useMemo } from 'react';
import Grid, { Grid2Props } from '@mui/material/Unstable_Grid2';
import { useFormikContext } from 'formik';

import { FormikDollarMaskField, FormikDollarMaskFieldProps } from 'components/forms';
import { FloodValues } from 'views/Quote';
import { round, roundToNearest } from 'modules/utils/helpers';
import { LimitKeys } from 'common/types';

// TODO: use increment cards & text field or slider ??
// TODO: round value to nearest 1,000

enum FieldNames {
  A = 'limitA',
  B = 'limitB',
  C = 'limitC',
  D = 'limitD',
}

const limitFields = [
  {
    title: 'Building Coverage',
    // limitField: 'building',
    name: FieldNames.A, // 'limitA', // 'coverages.building',
    inputLabel: 'Building Limit',
    description: 'TODO: add description here',
    coverageActiveField: 'coverageActiveBuilding',
  },
  {
    title: 'Additional Structures Coverage',
    name: FieldNames.B, // 'limitB',
    inputLabel: 'Additional Structures Limit',
    description: 'TODO: add description here',
    coverageActiveField: 'coverageActiveStructures',
  },
  {
    title: 'Contents Coverage',
    name: FieldNames.C, // 'limitC', // 'coverages.contents',
    inputLabel: 'Contents Limit',
    description: 'TODO: add description here',
    coverageActiveField: 'coverageActiveContents',
  },
  {
    title: 'Living Expenses Coverage',
    name: FieldNames.D, // 'limitD', // 'coverages.additional',
    inputLabel: 'Additional Expenses Limit',
    description: 'TODO: add description here',
    coverageActiveField: 'coverageActiveAdditional',
  },
];

const getFormattedPct = (portion: number, total: number) => round((portion / total) * 100, 1);

export interface LimitsStepProps {
  gridProps?: Grid2Props;
  inputProps?: Partial<FormikDollarMaskFieldProps>;
  replacementCost: number | undefined;
}

export const LimitsStep: React.FC<LimitsStepProps> = ({
  gridProps,
  inputProps,
  replacementCost,
}) => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext<FloodValues>(); // setFieldValue, setFieldTouched, setStatus

  // const handleCoverageActive = useCallback(
  //   async (
  //     event: React.ChangeEvent<HTMLInputElement>,
  //     coverageActiveField: CovActiveTypes,
  //     limitField: LimitKeys,
  //     dbField: LimitKeys
  //   ) => {
  //     event.stopPropagation();
  //     if (coverageActiveField === 'coverageActiveBuilding') {
  //       toast.info(
  //         'Building coverage cannot be exclued. Click the edit icon on the right to change the limit amount.',
  //         { autoClose: 8000 }
  //       );
  //       return;
  //     }
  //     setFieldValue(coverageActiveField, event.target.checked);

  //     let coverageActive = event.target.checked; // values[coverageActiveField];
  //     let newValue = coverageActive ? values[limitField] : 0;
  //     console.log(`Updating ${dbField} to ${newValue}`);

  //     if (event.target.checked && dollarFormatToNumber(values[limitField]) === 0) return;

  //     await updateQuote({
  //       limits: { [dbField]: newValue },
  //     });
  //   },
  //   [updateQuote, setFieldValue, values]
  // );

  const helperText = useMemo(() => {
    let result: { [key: string]: string | undefined } = {
      limitA: undefined,
      limitB: undefined,
      limitC: undefined,
      limitD: undefined,
    };
    if (!replacementCost) return result;

    Object.keys(result).forEach((key) => {
      const ht = getFormattedPct(parseInt(values[key as LimitKeys]), replacementCost);
      if (!isNaN(ht)) {
        result[key] = `${ht}% of building replacement cost`;
      }
    });

    return result;
  }, [values, replacementCost]);

  return (
    // TODO: move container to parent ??
    <Grid
      container
      rowSpacing={{ xs: 4, sm: 6, md: 8 }}
      columnSpacing={{ xs: 6, sm: 9, md: 12 }}
      {...gridProps}
    >
      {limitFields.map((field) => (
        <Grid xs={12} sm={6} key={field.name}>
          <FormikDollarMaskField
            name={field.name}
            label={field.inputLabel}
            helperText={helperText[field.name]}
            variant='standard'
            required
            disabled={false}
            fullWidth
            onBlur={(e) => {
              const digits = ('' + e.target.value).replace(/\D/g, '');
              const newVal = roundToNearest(parseInt(digits), 3);
              setFieldValue(field.name, newVal);
              setTimeout(() => {
                setFieldTouched(field.name, true);
              }, 100);
            }}
            {...inputProps}
          />
        </Grid>
      ))}
    </Grid>
  );
};
