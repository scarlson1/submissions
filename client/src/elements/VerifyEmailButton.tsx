import { Typography } from '@mui/material';
import { useAuthActions } from 'context';
import { useAsyncToast } from 'hooks';
import { useCallback } from 'react';

export function VerifyEmailButton() {
  const toast = useAsyncToast();
  const { sendVerification } = useAuthActions();
  const sendEmailVerification = useCallback(async () => {
    try {
      const email = await sendVerification();
      toast.info(`verification email sent to ${email}`);
    } catch (err: any) {
      const errMsg = err?.message ? err.message : 'Error sending verification email';
      toast.error(errMsg);
    }
  }, [toast, sendVerification]);

  return (
    <Typography
      variant='subtitle2'
      color='primary.700'
      onClick={sendEmailVerification}
      sx={{
        '&:hover': { textDecoration: 'underline', color: (theme) => theme.palette.primary[800] },
      }}
    >
      Verify your email
    </Typography>
  );
}
