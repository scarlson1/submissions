import { ReactElement, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useFormikContext } from 'formik';
import { isEmpty } from 'lodash';
import {
  CalculateOutlined,
  CalculateRounded,
  CheckCircleOutlineRounded,
} from '@mui/icons-material';
import { Box, Divider, Tooltip, Typography } from '@mui/material';

import { useGetDiff, useJsonDialog } from 'hooks';
import { Obj } from 'modules/utils';

// TODO: use something like recoil for automatically derived state ??
// TODO: generalize component (ratingInputsPrev --> inputsPrev, etc.)

interface DiffProps {
  inputsPrev: any; // TODO: type - generic type ?? "inputsPrev"
  onDiffChange: (diff: Obj | undefined, isDiff: boolean) => void;
  getStateIcon: (handleClick: () => void) => ReactElement;
  extractInputsFromValues: (values: any) => Record<string, any>;
  checkFields?: string[];
  children?: ReactNode;
}

export const Diff = ({
  inputsPrev,
  onDiffChange,
  getStateIcon,
  checkFields,
  extractInputsFromValues,
  children,
}: DiffProps) => {
  const { values } = useFormikContext<any>();
  const dialog = useJsonDialog();
  const [getDiff, diff, isDiff] = useGetDiff(checkFields);

  const inputsCurr: Record<string, any> = useMemo(
    () => extractInputsFromValues(values),
    [values, extractInputsFromValues]
  );

  // recalc diff whenever monitored inputs change
  useEffect(() => {
    // console.log('OLD OBJ: ', ratingInputsPrev);
    // console.log('NEW OBJ: ', ratingInputsCurr);

    getDiff(inputsPrev, inputsCurr);
  }, [getDiff, inputsPrev, inputsCurr]);

  // recalc: if any diff between prev and current rating fields
  // rerate: if rerate key is included in diff
  useEffect(() => {
    onDiffChange(diff, isDiff);
  }, [diff, isDiff, onDiffChange]);

  const handleClick = useCallback(() => {
    if (!diff) return;
    dialog(diff, 'Inputs Diff');
  }, [dialog, diff]);

  return (
    <>
      <Tooltip
        title={
          <Box>
            {children}
            {isDiff ? (
              <Typography variant='body2' component='div'>
                <Divider sx={{ my: 2 }} />
                <pre>{JSON.stringify(diff, null, 2)}</pre>
              </Typography>
            ) : (
              <Typography variant='body2' sx={{ p: 2 }} align='center'>
                no rating/premium changes
              </Typography>
            )}
          </Box>
        }
        placement='bottom'
      >
        {getStateIcon(handleClick)}
      </Tooltip>
    </>
  );
};
