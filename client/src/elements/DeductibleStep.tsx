import { Box, Typography } from '@mui/material';
import Grid, { Grid2Props } from '@mui/material/Unstable_Grid2';

import { FormikIncrementor } from 'components/forms';
import { dollarFormat } from 'modules/utils/helpers';

export interface DeductibleStepProps {
  gridProps?: Grid2Props;
  maxDeductible?: number;
}

// TODO: Tell me more accordion
//    - more detailed explaination
//    - deductible faq
//    - link to "Deductibles explained" article once written

export const DeductibleStep = ({ gridProps, maxDeductible }: DeductibleStepProps) => {
  // TODO: calc max as 20% of limits
  return (
    <Grid
      container
      rowSpacing={{ xs: 4, sm: 6, md: 8 }}
      columnSpacing={{ xs: 6, sm: 9, md: 12 }}
      {...gridProps}
    >
      <Grid xs={12} sx={{ pt: 1 }}>
        <Typography variant='subtitle1' color='text.secondary'>
          The deductible is the amount subtracted from a claim payout. It's the portion of the claim
          covered by the policy holder.
        </Typography>
        {/* <Typography variant='subtitle1' color='text.secondary'>
          The default deductible is set to 1% of the Building Coverage from the previous step, but
          you can adjust it. Generally, a higher deductible lowers premium and, vice versa.
        </Typography> */}
      </Grid>
      <Grid xs={12}>
        <FormikIncrementor
          name='deductible'
          incrementBy={500}
          min={1000}
          max={maxDeductible}
          valueFormatter={(val: number | undefined) => {
            if (!val) return;
            return dollarFormat(val);
          }}
        />
      </Grid>
    </Grid>
  );
};

export function DeductibleDetails() {
  <Box>
    <Typography variant='subtitle2' color='warning.main'>
      TODO: detailed deductible explaination
    </Typography>
    <Typography variant='subtitle2' color='warning.main'>
      TODO: deductible FAQs
    </Typography>
    <Typography variant='subtitle2' color='warning.main'>
      TODO: write & link to "Deductibles Explained" Article
    </Typography>
  </Box>;
}
