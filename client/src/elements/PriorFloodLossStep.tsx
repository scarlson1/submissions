import React, { useCallback } from 'react';
import { ToggleButton } from '@mui/material';
import { FormikToggleButtonGroup } from 'components/forms';
import { useFormikContext } from 'formik';
import { FloodValues } from 'views/Quote';

export interface PriorFloodLossStepProps {}

export const PriorFloodLossStep: React.FC<PriorFloodLossStepProps> = () => {
  const { values, setFieldValue } = useFormikContext<FloodValues>();

  const handleLossCountChange = useCallback(
    (event: React.MouseEvent<HTMLElement>, newValue: number | null) => {
      if (!newValue) return;
      setFieldValue('priorLossCount', newValue);
    },
    [setFieldValue]
  );

  //
  return (
    <FormikToggleButtonGroup
      name='priorLossCount'
      value={values.priorLossCount}
      onChange={handleLossCountChange}
      exclusive
    >
      <ToggleButton name='priorLossCount' value={0} aria-label='0' sx={{ py: 2, px: 4 }}>
        0
      </ToggleButton>
      <ToggleButton name='priorLossCount' value={1} aria-label='1' sx={{ py: 2, px: 4 }}>
        1
      </ToggleButton>
      <ToggleButton name='priorLossCount' value={2} aria-label='2' sx={{ py: 2, px: 4 }}>
        2
      </ToggleButton>
      <ToggleButton name='priorLossCount' value={3} aria-label='3+' sx={{ py: 2, px: 4 }}>
        3+
      </ToggleButton>
    </FormikToggleButtonGroup>
  );
};
