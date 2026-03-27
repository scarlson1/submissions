import ReactJson from '@microlink/react-json-view';
import { Box, Typography } from '@mui/material';

import { PageMeta } from 'components';
import { useDocDataOnce, useJsonTheme, useSafeParams } from 'hooks';

export const AgencyApp = () => {
  const jsonTheme = useJsonTheme();
  const { submissionId } = useSafeParams(['submissionId']);
  const { data } = useDocDataOnce('agencySubmissions', submissionId);

  return (
    <>
      <PageMeta title={`iDemand - Agency App ${submissionId}`} />
      <Box>
        <Typography variant='h5' sx={{ ml: { sm: 3, md: 4 }, pb: 4 }}>
          Agency Submission
        </Typography>
        <Typography variant='body2' component='div'>
          <ReactJson
            src={data}
            theme={jsonTheme}
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
