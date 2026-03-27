import { Box, Container, Divider, Link, Typography } from '@mui/material';
import { generateHTML } from '@tiptap/react';
import { where } from 'firebase/firestore';
import { useCallback } from 'react';

import { Disclosure } from 'common';
import { EDITOR_EXTENSION_DEFAULTS, useCollectionData, useDialog } from 'hooks';

const Copyright = () => {
  return (
    <Typography variant='body2' color='text.secondary'>
      {'Copyright © '}
      <Link color='inherit' href='https://idemandinsurance.com/'>
        iDemand Insurance Agency, Inc.
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
};

export const Footer = () => {
  const { data } = useCollectionData<Disclosure>('disclosures', [
    where('type', '==', 'general disclosure'),
  ]);
  const dialog = useDialog();

  const showDisclosure = useCallback(async () => {
    if (!data || data.length < 1) return;
    const content: string[] = [];

    data.forEach((d) => content.push(generateHTML(d.content, EDITOR_EXTENSION_DEFAULTS)));

    dialog.prompt({
      variant: 'info',
      catchOnCancel: false,
      title: 'Disclosure',
      content: (
        <div>
          {content.map((c, i, arr) => (
            <Box key={`disclosure-content-${i}`}>
              <div dangerouslySetInnerHTML={{ __html: c }} />
              {arr.length > 1 && i !== arr.length - 1 ? <Divider sx={{ my: 3 }} /> : null}
            </Box>
          ))}
        </div>
      ),
      slotProps: {
        dialog: {
          maxWidth: 'sm',
        },
      },
    });
  }, [dialog, data]);

  return (
    <Box
      component='footer'
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        backdropFilter: 'blur(20px)',
        webkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container
        maxWidth='xl'
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: 'monospace, Courier-Bold, -apple-system, system-ui',
              fontWeight: 700,
              letterSpacing: '.24rem',
              color: 'text.primary',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            iDemand
          </Typography>
          <Copyright />
        </Box>
        {data && data.length > 0 ? (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ '&:hover': { textDecoration: 'underline', cursor: 'pointer' } }}
            onClick={showDisclosure}
          >
            Disclosure
          </Typography>
        ) : null}
      </Container>
    </Box>
  );
};

export default Footer;
