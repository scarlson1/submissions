import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Container,
  Divider,
  Typography,
} from '@mui/material';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';
import Lottie from 'lottie-react';
import { useEffect, useMemo, useState } from 'react';
import { createSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useFirestore, useFirestoreDocData } from 'reactfire';

// import * as CheckmarkLottie from 'assets/checkmark.json';
import { CheckmarkLottie } from 'assets';
import {
  ANALYTICS_EVENTS,
  Charge,
  fallbackImages,
  finTrxCollection,
  quotesCollection,
  submissionsCollection,
  withIdConverter,
} from 'common';
import { Submission } from 'common/types';
import { useAuth } from 'context/AuthContext';
import { FormattedAddress } from 'elements/FormattedAddress';
import { useAnalyticsEvent } from 'hooks';
import { dollarFormat2 } from 'modules/utils/helpers';
import { AUTH_ROUTES, ROUTES, createPath } from 'router';

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
];

interface FaqAccordionProps {
  q: FAQ;
  expanded: string | boolean;
  handleChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
}

const FaqAccordion = ({ q, expanded, handleChange }: FaqAccordionProps) => {
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

export const SuccessStep = () => {
  const navigate = useNavigate();
  const { user, isAnonymous } = useAuth();
  const { submissionId } = useParams();
  if (!submissionId) throw new Error('missing submissionId');

  const firestore = useFirestore();
  const submissionRef = doc(submissionsCollection(firestore), submissionId).withConverter(
    withIdConverter<Submission>()
  );
  const { status, data } = useFirestoreDocData(submissionRef);

  if (status === 'loading') {
    return <span>loading...</span>;
  }

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
                <FormattedAddress address={data?.address} variant='subtitle2' textAlign='right' />
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
              {data.contact.firstName ? `Thanks, ${data.contact.firstName}! ` : 'Thank you!'} We'll
              send the quote for your review shortly. If you have any question or need to get in
              touch, please don't hesitate to reach out.
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
                        email: data.contact.email,
                        firstName: data.contact.firstName,
                        lastName: data.contact.lastName,
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
            <Button
              onClick={() =>
                navigate(
                  createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } }),

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

export const useFetchTransaction = (id: string) => {
  const [transaction, setTransaction] = useState<Charge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return setLoading(false);

    let ref = doc(finTrxCollection(getFirestore()), id);

    onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setError(null);
          setTransaction({ ...snap.data() });
        } else {
          setTransaction(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
      }
    );
  }, [id]);

  return useMemo(() => ({ transaction, loading, error }), [transaction, loading, error]);
};

// TODO: redo component (not using card)

// TODO: use rxjs to fetch transaction from quote response
export const BindSuccess = () => {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const { quoteId } = useParams();
  if (!quoteId) throw new Error('missing quoteId');

  const firestore = useFirestore();
  const quoteRef = doc(quotesCollection(firestore), quoteId);
  const { data } = useFirestoreDocData(quoteRef);

  const { transaction } = useFetchTransaction(transactionId || '');
  const logEvent = useAnalyticsEvent();

  useEffect(() => {
    let eventLogged = false;
    if (eventLogged || !transactionId || !data) return;

    logEvent(ANALYTICS_EVENTS.PURCHASE, {
      transaction_id: transactionId,
      quoteId,
      value: data.quoteTotal || undefined,
      status: data.status,
      agentId: data.agent.userId,
      userId: data.userId,
      agencyId: data.agency.orgId,
      product: data.product,
    });
    eventLogged = true;
    return () => {
      eventLogged = false;
    };
  }, [logEvent, data, transactionId, quoteId]);

  return (
    <Container maxWidth='xs'>
      <Card sx={{ mt: { xs: 4, sm: 6, md: 8 } }}>
        <CardMedia
          sx={{ height: { xs: 140, sm: 160, md: 180 } }}
          image={data?.imageURLs?.satellite || fallbackImages[0]}
          title={`map`}
        />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='overline' color='text.secondary' lineHeight={2}>
                Quote&nbsp;ID
              </Typography>
              <Typography variant='body2' fontSize='0.775rem'>
                {quoteId}
              </Typography>
            </Box>
            <Box>
              <Typography variant='overline' color='text.secondary' align='right' lineHeight={2}>
                TRX.&nbsp;ID
              </Typography>
              <Typography variant='body2' align='right' fontSize='0.775rem'>
                {transactionId || '--'}
              </Typography>
            </Box>
          </Box>
          <Typography variant='h5' align='center' sx={{ my: { xs: 3, md: 4, lg: 5 } }}>
            Thank you!
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ pb: 5 }}>
            We're excited to have your with us! You will receive email with your policy attached in
            the next 24 hours. If you have any questions, please don't hesitate to reach out.
          </Typography>
          {/* <Typography>
            TODO: transaction amount, status, receipt email, payer, etc. (and insured address, name,
            etc.)
          </Typography> */}
          {transaction && (
            <Box>
              <Typography variant='body2' color='text.secondary'>{`Amount: ${dollarFormat2(
                transaction.amount
              )}`}</Typography>
              <Typography
                variant='body2'
                color='text.secondary'
              >{`Status: ${transaction.status}`}</Typography>
              <Typography
                variant='body2'
                color='text.secondary'
              >{`Receipt email: ${transaction.receiptEmail}`}</Typography>
            </Box>
          )}
        </CardContent>
        <CardActions sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Button onClick={() => navigate('/')}>Home</Button>
        </CardActions>
      </Card>
      <Box sx={{ px: 4, mt: 2, mb: 5 }}>
        <Typography component='div' variant='body2' color='text.secondary'>
          Questions?{' '}
          <Box
            sx={{
              typography: 'body2',
              color: 'text.secondary',
              display: 'inline-block',
              '&:hover': { textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 },
              transition: 'fontWeight 200ms',
            }}
            onClick={() => navigate(createPath({ path: ROUTES.CONTACT }))}
          >
            Contact us
          </Box>
        </Typography>
      </Box>
    </Container>
  );
};
