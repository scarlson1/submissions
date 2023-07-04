import { useMemo } from 'react';

import { useTheme } from '@mui/material';
import { Toaster as HotToaster, DefaultToastOptions } from 'react-hot-toast';

export const lightToastOptions: DefaultToastOptions = {
  style: {
    color: '#3E5060',
    borderRadius: '8px',
  },
  success: {
    iconTheme: {
      primary: '#1DB45A', // '#1AA251',
      secondary: 'white',
    },
  },
  error: {
    iconTheme: {
      primary: '#EB0014',
      secondary: 'white',
    },
  },
};

export const darkToastOptions: DefaultToastOptions = {
  style: {
    color: '#B2BAC2',
    backgroundColor: '#132F4C',
    borderRadius: '8px',
  },
  success: {
    iconTheme: {
      primary: '#3EE07F',
      secondary: 'white',
    },
  },
  error: {
    iconTheme: {
      primary: '#EB0014',
      secondary: 'white',
    },
  },
};

export const Toaster = () => {
  const theme = useTheme();

  const options = useMemo(() => {
    if (theme.palette.mode === 'dark') return darkToastOptions;
    return lightToastOptions;
  }, [theme.palette.mode]);

  return <HotToaster toastOptions={options} />;
};
