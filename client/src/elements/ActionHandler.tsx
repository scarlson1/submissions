import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';

import { getParamByName } from 'modules/utils/helpers';
import { assignQuote } from 'modules/api';
import { getFunctions } from 'firebase/functions';

export const ActionHandler: React.FC = () => {
  const mode = useMemo(() => getParamByName(window.location.search, 'mode'), []);
  const actionCode = useMemo(() => getParamByName(window.location.search, 'oobCode'), []);
  const continueUrl = useMemo(() => getParamByName(window.location.search, 'continueUrl'), []);

  if (mode === 'assignQuote') {
    if (!actionCode) throw new Error('Missing quoteId');
    return <AssignQuoteHandler continueUrl={continueUrl || '/'} quoteId={actionCode} />;
  }

  if (!actionCode) return <div>Something went wrong</div>;

  // if (mode === 'resetPassword')
  //   return <ResetPasswordHandler oobCode={actionCode} continueUrl={continueUrl} />;
  // if (mode === 'recoverEmail')
  //   return <RecoverEmailHandler actionCode={actionCode} continueUrl={continueUrl} />;
  // if (mode === 'verifyEmail')
  //   return <VerifyEmailHandler oobCode={actionCode} continueUrl={continueUrl} />;
  return <div>An error occurred.</div>;
};

export function AssignQuoteHandler({
  continueUrl,
  quoteId,
}: {
  continueUrl: string;
  quoteId: string;
}) {
  // const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignSuccessful, setAssignSuccessful] = useState(false);

  const setUserId = useCallback(async () => {
    try {
      await assignQuote(getFunctions(), { quoteId });

      setLoading(false);
      setAssignSuccessful(true);
    } catch (err) {
      console.log(err);

      setLoading(false);
      setAssignSuccessful(false);
    }
  }, [quoteId]);

  useEffect(() => {
    if (!loading) return;
    setUserId(); // eslint-disable-next-line
  }, []);

  if (!!loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
        <CircularProgress size={24} />
      </Box>
    );

  if (!loading && assignSuccessful) {
    if (continueUrl) {
      // RELATIVE URL. NEED TO USE new URL() if supporting absolute urls ??
      return <Navigate to={continueUrl} replace={true} />;
    }
    return <Navigate to='/' replace={true} />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 240,
      }}
    >
      <Typography variant='h6' gutterBottom>
        Something went wrong. See console for details.
      </Typography>
      {/* <Button onClick={handleResend}>Resend verification email</Button> */}
    </Box>
  );
}
