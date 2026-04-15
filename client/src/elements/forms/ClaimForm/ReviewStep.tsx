import { Box, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { useFunctions } from 'reactfire';

import type { DraftPolicyClaim, WithId } from '@idemand/common';
import {
  AccountBalanceRounded,
  EmailRounded,
  PhoneRounded,
} from '@mui/icons-material';
import { submitClaim } from 'api';
import { WizardNavButtons } from 'components/forms';
import { useWizard } from 'hooks';
import {
  formatFirestoreTimestamp,
  formatPhoneNumber,
  logDev,
} from 'modules/utils';
import { ContactList } from '../AgencyReviewStep';
import { ClaimImages } from './ImagesStep';

// TODO: navigate back to previous steps with edit icon button

interface ReviewStepProps {
  claim: WithId<Partial<DraftPolicyClaim>>;
  onError?: (msg: string) => void;
}

export const ReviewStep = ({ claim, onError }: ReviewStepProps) => {
  const functions = useFunctions();
  const { handleStep } = useWizard();

  handleStep(async () => {
    try {
      // call cloud func to covert draft to submitted & send notifications
      const policyId = claim.policyId;
      const claimId = claim.id;
      if (!(policyId && claimId)) throw new Error('missing policy or claim ID');
      await submitClaim(functions, { policyId, claimId });
    } catch (err: any) {
      logDev('error submitting claim: ', err);
      onError && onError('error submitting quote');
    }
  });

  return (
    <Box>
      <Typography variant='h5' align='center' gutterBottom>
        Review
      </Typography>
      <Grid container rowSpacing={8} columnSpacing={6}>
        <Grid xs>
          <Typography variant='overline' color='text.secondary'>
            Occurrence
          </Typography>
          <Typography>
            {claim.occurrenceDate
              ? formatFirestoreTimestamp(claim.occurrenceDate, 'date')
              : 'occurrence date required'}
          </Typography>
          <Box sx={{ py: 3 }}>
            <Typography variant='overline' color='text.secondary'>
              Description
            </Typography>
            <Typography>{claim.description || ''}</Typography>
          </Box>
        </Grid>
        <Grid xs={12} sm='auto'>
          <Typography variant='overline' color='text.secondary'>
            Contact
          </Typography>

          {claim.contact ? (
            <ContactList
              items={[
                {
                  primaryText: `${claim.contact.firstName || ''} ${claim.contact.firstName || ''}`,
                  icon: (
                    <AccountBalanceRounded fontSize='small' color='primary' />
                  ),
                },
                {
                  primaryText: claim.contact.email || '',
                  icon: <EmailRounded fontSize='small' color='primary' />,
                },
                {
                  primaryText:
                    formatPhoneNumber(claim.contact.phone || '') || '',
                  icon: <PhoneRounded fontSize='small' color='primary' />,
                },
              ]}
            />
          ) : (
            // <Box>
            //   <Typography>{`${claim.contact.firstName || ''} ${
            //     claim.contact.firstName || ''
            //   }`}</Typography>
            //   <Typography>{claim.contact.email}</Typography>
            //   <Typography>{formatPhoneNumber(claim.contact.phone)}</Typography>
            //   <Typography>{`Preference: ${claim.contact.preferredMethod}`}</Typography>
            // </Box>
            <Typography>contact required</Typography>
          )}
        </Grid>
        <Grid xs={12}>
          <Typography variant='overline' color='text.secondary'>
            Images
          </Typography>
          {claim.images ? <ClaimImages imgURLs={claim.images} /> : null}
        </Grid>
      </Grid>

      <WizardNavButtons buttonText='Submit' />
    </Box>
  );
};
