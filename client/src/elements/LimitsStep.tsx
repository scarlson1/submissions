import React from 'react';
import Grid, { Grid2Props } from '@mui/material/Unstable_Grid2';
// import { useFormikContext } from 'formik';

import { FormikDollarMaskField, FormikDollarMaskFieldProps } from 'components/forms';
// import { FloodValues } from 'views/Quote';

// TODO: use increment cards & text field or slider ??
// TODO: round value to nearest 1,000

const limitFields = [
  {
    title: 'Building Coverage',
    // limitField: 'building',
    name: 'limitA', // 'coverages.building',
    inputLabel: 'Building Limit',
    description: 'TODO: add description here',
    coverageActiveField: 'coverageActiveBuilding',
  },
  {
    title: 'Additional Structures Coverage',
    name: 'limitB',
    inputLabel: 'Additional Structures Limit',
    description: 'TODO: add description here',
    coverageActiveField: 'coverageActiveStructures',
  },
  {
    title: 'Contents Coverage',
    name: 'limitC', // 'coverages.contents',
    inputLabel: 'Contents Limit',
    description: 'TODO: add description here',
    coverageActiveField: 'coverageActiveContents',
  },
  {
    title: 'Living Expenses Coverage',
    name: 'limitD', // 'coverages.additional',
    inputLabel: 'Additional Expenses Limit',
    description: 'TODO: add description here',
    coverageActiveField: 'coverageActiveAdditional',
  },
];

export interface LimitsStepProps {
  gridProps?: Grid2Props;
  inputProps?: Partial<FormikDollarMaskFieldProps>;
}

export const LimitsStep: React.FC<LimitsStepProps> = ({ gridProps, inputProps }) => {
  // const { values, setFieldValue, setFieldTouched, setStatus } = useFormikContext<FloodValues>();

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
            variant='standard'
            required
            disabled={false}
            fullWidth
            {...inputProps}
          />
        </Grid>
      ))}
    </Grid>
  );
};
