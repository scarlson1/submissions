import { WarningAmberRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  // Unstable_Grid2 as Grid,
  Tooltip,
  Typography,
  tooltipClasses,
} from '@mui/material';
import { FormikErrors, setNestedObjectValues, useFormikContext } from 'formik';
import { useCallback, useMemo } from 'react';

import { flattenObj } from 'modules/utils';

export function RequiredFieldsIndicator({
  getErrorEntries,
}: {
  getErrorEntries?: (errors: FormikErrors<any>) => [string, unknown][];
}) {
  const { values, errors, setTouched } = useFormikContext();

  // TODO: need to extract all nested fields (or use flatten)
  const errorEntries = useMemo(() => {
    if (getErrorEntries) return getErrorEntries(errors);

    const flattened = flattenObj(errors);
    return Object.entries(flattened);
  }, [errors, getErrorEntries]);

  const handleRevealErrors = useCallback(() => {
    setTouched({
      ...setNestedObjectValues(values, true),
    });
  }, [setTouched, values]);

  const stateIcon = errorEntries.length ? (
    <WarningAmberRounded
      fontSize='small'
      color='warning'
      sx={{ mx: 2, '&:hover': { cursor: 'pointer' } }}
      onClick={handleRevealErrors}
    />
  ) : null;

  return (
    <Tooltip
      title={
        <Box>
          {errorEntries.length > 0 ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant='body1' fontWeight={500} gutterBottom>
                  Errors
                </Typography>
                <Button onClick={handleRevealErrors} size='small' sx={{ ml: 2 }}>
                  reveal
                </Button>
              </Box>

              {errorEntries.map(([field, errMsg]) => (
                <Typography variant='body2' sx={{ py: 0.5 }} key={field}>{`${errMsg}`}</Typography>
              ))}

              {/* {errorEntries.map(([fieldname, errMsg]) => (
                <Grid container spacing={2} key={fieldname}>
                  <Grid 
                    xs={5}
                    // xs='auto'
                  >
                    <Typography
                      variant='body2'
                      component='span'
                      sx={{ pr: 2, fontWeight: 500 }}
                    >{`${fieldname}`}</Typography>
                  </Grid>

                  {typeof errMsg === 'string' ? (
                    <Grid xs>
                      <Typography variant='body2' component='span'>{`${errMsg}`}</Typography>
                    </Grid>
                  ) : (
                    <Grid xs={12}>
                      <Typography variant='body2' component='span'>
                        <pre>{JSON.stringify(errMsg, null, 2)}</pre>
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              ))} */}
            </>
          ) : (
            <Typography variant='body2' fontWeight={500}>
              No errors
            </Typography>
          )}
        </Box>
      }
      placement='bottom'
      sx={{
        [`& .${tooltipClasses.tooltip}`]: {
          maxWidth: 460,
        },
      }}
    >
      <Box
        sx={{
          minHeight: 20,
          minWidth: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {stateIcon}
      </Box>
    </Tooltip>
  );
}
