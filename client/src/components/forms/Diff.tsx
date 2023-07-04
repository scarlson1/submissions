import { useCallback, useEffect, useMemo } from 'react';
import { useFormikContext } from 'formik';
import { isEmpty } from 'lodash';
import {
  CalculateOutlined,
  CalculateRounded,
  CheckCircleOutlineRounded,
} from '@mui/icons-material';
import { Box, Divider, Tooltip, Typography } from '@mui/material';

import { useGetDiff, useJsonDialog } from 'hooks';

// TODO: use something like recoil for automatically derived state ??
// TODO: generalize component

export const Diff = ({
  ratingInputsPrev,
  rerateFields,
  checkFields,
  ratingState: { rerateRequired, recalcRequired },
  setRatingState,
  extractInputsFromValues,
}: {
  ratingInputsPrev: any; // TODO: type - generic type ??
  rerateFields: string[];
  ratingState: { rerateRequired: boolean; recalcRequired: boolean };
  setRatingState: (newVals: { rerateRequired: boolean; recalcRequired: boolean }) => void;
  extractInputsFromValues: (values: any) => Record<string, any>;
  checkFields?: string[];
}) => {
  const { values } = useFormikContext<any>();
  const dialog = useJsonDialog();
  const [getDiff, diff, isDiff] = useGetDiff(checkFields);

  // const {
  //   coordinates,
  //   limits,
  //   deductible,
  //   address,
  //   ratingPropertyData,
  //   priorLossCount,
  //   subproducerCommission,
  // } = values;

  // const ratingInputsCurr: Record<string, any> = useMemo(
  //   () => extractInputsFromValues(values),
  //   // TODO: pass values instead of destructuring ?? calcs more, but more general & correct
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [
  //     coordinates,
  //     limits,
  //     deductible,
  //     subproducerCommission,
  //     priorLossCount,
  //     address,
  //     ratingPropertyData,
  //     extractInputsFromValues,
  //   ]
  // );

  const ratingInputsCurr: Record<string, any> = useMemo(
    () => extractInputsFromValues(values),
    // TODO: pass values instead of destructuring ?? calcs more, but more general & correct
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, extractInputsFromValues]
  );

  // recalc diff whenever ratingInputs change
  useEffect(() => {
    // console.log('OLD OBJ: ', ratingInputsPrev);
    // console.log('NEW OBJ: ', ratingInputsCurr);

    getDiff(ratingInputsPrev, ratingInputsCurr);
  }, [getDiff, ratingInputsPrev, ratingInputsCurr]);

  // recalc: if any diff between prev and current rating fields
  // rerate: if rerate key is included in diff
  useEffect(() => {
    if (isEmpty(diff)) return setRatingState({ rerateRequired: false, recalcRequired: false });
    const shouldRerate = rerateFields.some((key) => {
      return diff[key];
    });
    // TODO: fix bug - overriding on first render - checking AAL values
    setRatingState({ rerateRequired: shouldRerate, recalcRequired: isDiff });
  }, [diff, isDiff, rerateFields, setRatingState]);

  const handleClick = useCallback(() => {
    if (!diff) return;
    dialog(diff, 'Rating Inputs Diff');
  }, [dialog, diff]);

  const stateIcon =
    !rerateRequired && !recalcRequired ? (
      <CheckCircleOutlineRounded fontSize='small' color='success' sx={{ mx: 2 }} />
    ) : rerateRequired ? (
      <CalculateRounded fontSize='small' color='warning' sx={{ mx: 2 }} onClick={handleClick} />
    ) : (
      <CalculateOutlined fontSize='small' color='info' sx={{ mx: 2 }} onClick={handleClick} />
    );

  return (
    <>
      <Tooltip
        title={
          <Box>
            <Typography variant='body2' fontWeight={500}>
              {`Rerate (AAL) required: ${rerateRequired === null ? 'no changes' : rerateRequired}`}
            </Typography>
            <Typography variant='body2' fontWeight={500}>
              {`Premium calc required: ${recalcRequired}`}
            </Typography>
            {isDiff && (
              <Typography variant='body2' component='div'>
                <Divider sx={{ my: 2 }} />
                <pre>{JSON.stringify(diff, null, 2)}</pre>
              </Typography>
            )}
          </Box>
        }
        placement='bottom'
      >
        {stateIcon}
      </Tooltip>
    </>
  );
};
