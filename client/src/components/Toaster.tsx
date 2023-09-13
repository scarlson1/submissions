import { useTheme } from '@mui/material';
import { useMemo } from 'react';
import {
  DefaultToastOptions,
  Toaster as HotToaster,
  ToastBar,
  ToastOptions,
  // ToastType as ToastTypeOrig,
} from 'react-hot-toast';
import { CustomToast } from './CustomToast';

// TODO: extend types
// declare module 'react-hot-toast' {
//   export type ToastType = ToastTypeOrig | 'info' | 'warn';
// }

export const lightToastOptions: DefaultToastOptions = {
  style: {
    color: '#3E5060',
    borderRadius: '8px',
    overflowX: 'hidden',
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
    backgroundColor: '#1F262E',
    borderRadius: '8px',
    overflowX: 'hidden',
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
  // warn: {
  //   iconTheme: {
  //     primary: 'white'
  //   }
  // }
};

export interface CustomToastOptions extends ToastOptions {
  withProgress?: boolean;
}

export const Toaster = () => {
  const theme = useTheme();

  const options = useMemo(() => {
    if (theme.palette.mode === 'dark') return darkToastOptions;
    return lightToastOptions;
  }, [theme.palette.mode]);

  // return <HotToaster toastOptions={options} />;

  return (
    <HotToaster toastOptions={options}>
      {(t) => <ToastBar toast={t}>{(props) => <CustomToast {...props} t={t} />}</ToastBar>}
    </HotToaster>
  );
};
