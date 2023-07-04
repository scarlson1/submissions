import { useMemo } from 'react';
import { Box, Tooltip, Typography, Unstable_Grid2 as Grid, tooltipClasses } from '@mui/material';
import { WarningAmberRounded } from '@mui/icons-material';
import { FormikErrors } from 'formik';

export function RequiredFieldsIndicator({
  errors,
  displayErrors,
  getErrorEntries,
}: {
  errors: FormikErrors<any>; // FormikErrors<NewQuoteValues>;
  displayErrors?: () => void;
  getErrorEntries?: (errors: FormikErrors<any>) => [string, unknown][];
}) {
  // TODO: need to extract all nested fields
  const errorEntries = useMemo(() => {
    if (getErrorEntries) return getErrorEntries(errors);
    return Object.entries(errors);
    // TODO: pass func as prop and uncomment above
    // return Object.entries(
    //   merge(
    //     omit(errors, ['ratingPropertyData', 'limits', 'agent', 'agency', 'AAL', 'address']),
    //     errors.ratingPropertyData || {},
    //     errors.address || {},
    //     errors.limits || {},
    //     errors.agent || {},
    //     omit(errors.agency, 'address') || {},
    //     errors.agency?.address ? { 'agency.address': errors.agency?.address } : {},
    //     errors.AAL || {}
    //   )
    // );
  }, [errors, getErrorEntries]);

  const stateIcon = errorEntries.length ? (
    <WarningAmberRounded
      fontSize='small'
      color='warning'
      sx={{ mx: 2 }}
      onClick={() => displayErrors && displayErrors()}
    />
  ) : null;

  return (
    <Tooltip
      title={
        <Box>
          {errorEntries.length > 0 ? (
            <>
              <Typography variant='body1' fontWeight={500} gutterBottom>
                Errors
              </Typography>
              {errorEntries.map(([fieldname, errMsg]) => (
                <Grid container spacing={2} key={fieldname}>
                  <Grid xs='auto'>
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
              ))}
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
        // maxWidth: 400,
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
