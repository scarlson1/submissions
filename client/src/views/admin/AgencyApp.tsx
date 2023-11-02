import ReactJson from '@microlink/react-json-view';
import { Box, Typography, useTheme } from '@mui/material';

import { useDocDataOnce, useSafeParams } from 'hooks';
import { PageMeta } from 'router';

export const AgencyApp = () => {
  const theme = useTheme();
  const { submissionId } = useSafeParams(['submissionId']);
  const { data, status } = useDocDataOnce('AGENCY_APPLICATIONS', submissionId);

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <>
      <PageMeta title={`iDemand - Agency App ${submissionId}`} />
      <Box>
        <Typography variant='h5' sx={{ ml: { sm: 3, md: 4 }, pb: 4 }}>
          Agency Submission
        </Typography>
        <Typography variant='body2' color='text.secondary' component='div'>
          <ReactJson
            src={data}
            theme={theme.palette.mode === 'dark' ? 'tomorrow' : 'rjv-default'}
            style={{ background: 'transparent' }}
            iconStyle='circle'
            enableClipboard
            collapseStringsAfterLength={60}
          />
        </Typography>
      </Box>
    </>
  );
};
