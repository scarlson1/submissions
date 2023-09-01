import { Box, Divider, Tooltip, Typography } from '@mui/material';
import { useFormikContext } from 'formik';
import { ReactElement, ReactNode, useCallback, useEffect, useMemo } from 'react';

import { useGetDiff, useJsonDialog } from 'hooks';
import { Obj } from 'modules/utils';

// TODO: use something like recoil to derived state ??

interface DiffProps {
  inputsPrev: any;
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
  const dialog = useJsonDialog({ slotProps: { dialog: { maxWidth: 'md' } } });
  const [getDiff, diff, isDiff] = useGetDiff(checkFields);

  const inputsCurr: Record<string, any> = useMemo(
    () => extractInputsFromValues(values),
    [values, extractInputsFromValues]
  );

  // recalc diff whenever monitored inputs change
  useEffect(() => {
    // console.log('OLD OBJ: ', inputsPrev);
    // console.log('NEW OBJ: ', inputsCurr);

    getDiff(inputsPrev, inputsCurr);
  }, [getDiff, inputsPrev, inputsCurr]);

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
