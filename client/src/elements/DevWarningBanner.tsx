import { CloseRounded } from '@mui/icons-material';
import { Alert, Box, Collapse, IconButton } from '@mui/material';
import { memo } from 'react';
import { create } from 'zustand';

interface BannerState {
  open: boolean;
  handleDismiss: () => void;
}

const useDevStore = create<BannerState>((set) => ({
  open: true,
  handleDismiss: () => set({ open: false }), // set((state) => ({ bears: state.bears + 1 })),
}));

export const DevWarningBanner = memo(() => {
  const { open, handleDismiss } = useDevStore();

  return (
    <Box sx={{ width: '100%' }}>
      <Collapse in={open}>
        <Alert
          severity='warning'
          action={
            <IconButton
              aria-label='close'
              color='inherit'
              size='small'
              onClick={() => {
                handleDismiss();
              }}
            >
              <CloseRounded fontSize='inherit' />
            </IconButton>
          }
          // sx={{ mb: 2 }}
        >
          {/* <AlertTitle>This is the dev site</AlertTitle> */}
          This site is for development.
          {/* If you're looking for the production site, visit{' '}
          <Link href='https://idemand-submissions.web.app' underline='hover' variant='body2'>
            the production site.
          </Link> */}
        </Alert>
      </Collapse>
    </Box>
  );
});
