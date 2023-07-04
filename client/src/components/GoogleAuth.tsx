import { useCallback } from 'react';

import { Button } from '@mui/material';
import { AiOutlineGoogle } from 'react-icons/ai';
import { toast } from 'react-hot-toast';

import { useSocialAuth } from 'hooks';
import { UserCredential } from 'firebase/auth';

export interface GoogleAuthProps {
  reauth?: boolean;
  skipRedirect?: boolean;
  onSuccess?: (userCred: UserCredential) => void;
}

export const GoogleAuth = ({ reauth = false, skipRedirect, onSuccess }: GoogleAuthProps) => {
  const { loginWithGoogle, reauthWithGoogle } = useSocialAuth({
    onSuccess, // () => {},
    onError: (err: any) => {
      console.log('ERROR: ', err);
      toast.error('An error occurred. See console for details.');
    },
    skipRedirect,
  });

  const handleClick = useCallback(() => {
    if (reauth) return reauthWithGoogle();
    return loginWithGoogle();
  }, [loginWithGoogle, reauthWithGoogle, reauth]);

  return (
    <Button
      variant='outlined'
      onClick={handleClick}
      // onClick={() => loginWithGoogle()}
      startIcon={<AiOutlineGoogle size={16} />}
    >
      Google
    </Button>
  );
};

export default GoogleAuth;
