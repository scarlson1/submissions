import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Divider,
  Container,
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import Lottie from 'lottie-react';
import { createSearchParams, useLoaderData, useNavigate } from 'react-router-dom';

import * as CheckmarkLottie from 'assets/checkmark.json';
import { ROUTES, createPath, AUTH_ROUTES } from 'router';
import { Submission } from 'common/types';
import { useAuth } from 'modules/components/AuthContext';

// TODO: create account

interface FAQ {
  title: React.ReactNode;
  secondary?: React.ReactNode;
  description: React.ReactNode;
  id: string;
}

const generalFaqs: FAQ[] = [
  {
    title: `When will I get my quote?`,
    // secondary: 'Contact us to get set up in the system',
    description:
      'You should expect a reply within 24 hours. Most replies are generated within the hour during daytime hours.',
    id: 'panel0',
  },
  {
    title: `Can I improve my quote?`,
    // secondary: 'Contact us to get set up in the system',
    description: `There are two ways to reduce your premium. You can review the data we found on your property, such as a finished vs unfinished basement. If it's incorrect, correcting the input can improve your quote. Another way to reduce your premium is by changing the deductible. The deductible is defaulted to about 1% of the total coverage. If you choose to increase the deductible, the premium will usually go down.`,
    id: 'panel1',
  },
  // {
  //   title: `What if the Replacement Cost Value (RCV) is wrong?`,
  //   // secondary: 'Contact us to get set up in the system',
  //   description:
  //     'Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto ipsa labore accusantium dolores ratione doloremque veniam delectus officia! Ea est nihil tenetur, quod laborum et recusandae commodi consectetur modi alias!',
  //   id: 'panel2',
  // },
  // {
  //   title: `Does the policy cover replacement costs if replacement costs more than my policy limit?`,
  //   // secondary: 'Contact us to get set up in the system',
  //   description:
  //     'Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto ipsa labore accusantium dolores ratione doloremque veniam delectus officia! Ea est nihil tenetur, quod laborum et recusandae commodi consectetur modi alias!',
  //   id: 'panel3',
  // },
];

interface FaqAccordionProps {
  q: FAQ;
  expanded: string | boolean;
  handleChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
}

const FaqAccordion: React.FC<FaqAccordionProps> = ({ q, expanded, handleChange }) => {
  return (
    <Accordion expanded={expanded === q.id} onChange={handleChange(q.id)} key={q.id}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls={`${q.id}-content`}
        id={`${q.id}-header1`}
      >
        <Typography variant='subtitle2' sx={{ width: '90%', flexShrink: 0 }}>
          {q.title}
        </Typography>
        {/* <Typography variant='subtitle2' color='text.secondary'>
                {q.secondary}
              </Typography> */}
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant='body2' color='text.secondary'>
          {q.description}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
};

const SubmissionFAQs = () => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box>
      <Divider sx={{ mt: 4, mb: 2 }}>
        <Typography variant='h6' color='text.secondary' sx={{ px: 3 }}>
          Questions on your mind?
        </Typography>
      </Divider>

      <Box sx={{ py: 3 }}>
        <Typography variant='overline' color='text.secondary' sx={{ pl: 4, mb: 3 }}>
          General FAQs
        </Typography>
        {generalFaqs.map((q) => (
          <FaqAccordion q={q} expanded={expanded} handleChange={handleChange} key={q.id} />
        ))}
      </Box>
    </Box>
  );
};

export const SuccessStep: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAnonymous } = useAuth();
  const data = useLoaderData() as Submission;

  return (
    <Container maxWidth='sm' sx={{ py: { xs: 3, sm: 4, md: 6, lg: 8 } }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='overline' color='text.secondary' sx={{ lineHeight: 1.4 }}>
                  Status
                </Typography>
                <Typography variant='subtitle2'>{data.status}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant='overline'
                  color='text.secondary'
                  textAlign='right'
                  sx={{ lineHeight: 1.4 }}
                >
                  Address
                </Typography>
                <Typography variant='subtitle2' textAlign='right'>
                  {`${data?.addressLine1}${data.addressLine2 ? ' ' + data.addressLine2 + ' ' : ''}`}
                </Typography>
                <Typography variant='subtitle2' textAlign='right'>
                  {`${data.city}, ${data.state} ${data.postal}`}
                </Typography>
              </Box>
            </Box>
            <Divider flexItem sx={{ my: 3 }} />
            <Lottie
              animationData={CheckmarkLottie}
              loop={false}
              style={{ height: 100, width: 100, marginTop: -12 }}
            />
            <Typography variant='h5' gutterBottom>
              Submission Received!
            </Typography>

            <Typography variant='body2' color='text.secondary' sx={{ p: 4 }} gutterBottom>
              {data.firstName ? `Thanks, ${data.firstName}! ` : 'Thank you!'} We'll send the quote
              for your review shortly. If you have any question or need to get in touch, please
              don't hesitate to reach out.
            </Typography>
            <Divider flexItem sx={{ mt: 3, mb: -4 }} />
          </Box>
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-between' }}>
          <>
            {Boolean(isAnonymous || !user) && (
              <Button
                onClick={() =>
                  navigate(
                    {
                      pathname: createPath({ path: AUTH_ROUTES.CREATE_ACCOUNT }),
                      search: createSearchParams({
                        email: data.email,
                        firstName: data.firstName,
                        lastName: data.lastName,
                      }).toString(),
                    }
                    // { replace: true }
                  )
                }
                sx={{ mr: 2 }}
              >
                Create An Account
              </Button>
            )}
            {/* <Button
            onClick={() =>
              navigate(createPath({ path: AUTH_ROUTES.CREATE_ACCOUNT }), { replace: true })
            }
            sx={{ ml: 2 }}
          >
            Contact Us
          </Button> */}
            <Button
              onClick={() =>
                navigate(
                  createPath({ path: ROUTES.SUBMISSION_NEW }),

                  { replace: true }
                )
              }
              sx={{ ml: 2 }}
            >
              New Quote
            </Button>
          </>
        </CardActions>
      </Card>
      <Box sx={{ py: 8 }}>
        <SubmissionFAQs />
      </Box>
    </Container>
  );
};
