import { Box } from '@mui/material';

import { LoadingSpinner } from 'components';
// import { useConcurrentLocation } from 'hooks';
// import ProgressBar from './ProgressBar';

const LoadingComponent = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        py: { xs: 3, md: 5, lg: 8 },
      }}
    >
      <LoadingSpinner loading={true} />
    </Box>
  );
};

export default LoadingComponent;
