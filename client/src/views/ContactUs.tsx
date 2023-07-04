import { Container, Typography } from '@mui/material';

import { ContactForm } from 'elements';

export const ContactUs = () => {
  return (
    <Container maxWidth='sm'>
      <Typography variant='h5' sx={{ pl: 3, pb: 4 }}>
        Contact Us
      </Typography>
      <ContactForm />
    </Container>
  );
};
