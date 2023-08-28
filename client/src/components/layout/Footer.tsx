import { useCallback } from 'react';
import { Container, Box, Typography, Link } from '@mui/material';
import { generateHTML } from '@tiptap/react';
import { where } from 'firebase/firestore';

import { EDITOR_EXTENSION_DEFAULTS, useCollectionData, useDialog } from 'hooks';
import { Disclosure } from 'common';

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
  const { data } = useCollectionData<Disclosure>('DISCLOSURES', [
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
          {content.map((c, i) => (
            <div dangerouslySetInnerHTML={{ __html: c }} key={`disclosure-content-${i}`} />
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
