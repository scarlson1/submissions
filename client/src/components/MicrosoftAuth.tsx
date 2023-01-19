import React, { useCallback } from 'react';
import { Button } from '@mui/material';
import { toast } from 'react-hot-toast';
import { BsMicrosoft } from 'react-icons/bs';

import { useSocialAuth } from 'hooks';
import { UserCredential } from 'firebase/auth';

export interface MicrosoftAuthProps {
  reauth?: boolean;
  skipRedirect?: boolean;
  onSuccess?: (userCred: UserCredential) => void;
}

export const MicrosoftAuth: React.FC<MicrosoftAuthProps> = ({
  reauth = false,
  skipRedirect,
  onSuccess,
}) => {
  const { loginWithMicrosoft, reauthWithMicrosoft } = useSocialAuth({
    onSuccess,
    onError: (err) => {
      console.log('ERROR: ', err);
      toast.error('An error occurred. See console for details.');
    },
    skipRedirect,
  });

  const handleClick = useCallback(() => {
    if (reauth) return reauthWithMicrosoft();
    return loginWithMicrosoft();
  }, [loginWithMicrosoft, reauthWithMicrosoft, reauth]);

  return (
    <Button
      variant='outlined'
      onClick={handleClick}
      // onClick={loginWithMicrosoft}
      startIcon={<BsMicrosoft size={16} />}
    >
      Microsoft
    </Button>
  );
};

export default MicrosoftAuth;
