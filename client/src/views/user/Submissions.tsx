import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Collapse,
  IconButton,
  IconButtonProps,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { styled, SxProps } from '@mui/system';
import { ExpandMoreRounded } from '@mui/icons-material';
import { onSnapshot, query, orderBy, where, limit, getFirestore } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import { useAuth } from 'modules/components/AuthContext';
import { fallbackImages } from '../PoliciesOld';
import { dollarFormat, formatFirestoreTimestamp, numberFormat } from 'modules/utils/helpers';
import { createPath, ROUTES } from 'router';
import { Submission, submissionsCollection, WithId } from 'common';

export const useUserSubmissions = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<WithId<Submission>[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.uid) {
      setError('Must be authenticated');
      return;
    }

    // const submissionsCollection = collection(
    //   getFirestore(),
    //   COLLECTIONS.SUBMISSIONS
    // ) as CollectionReference<Submission>;
    const q = query(
      submissionsCollection(getFirestore()),
      where('userId', '==', user.uid),
      orderBy('metadata.created', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        const s: WithId<Submission>[] = [];
        querySnap.forEach((snap) => {
          s.push({ ...snap.data(), id: snap.id });
        });

        setSubmissions([...s]);
      },
      (err) => {
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { submissions, error };
};

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto', // @ts-ignore
  transition: theme.transitions.create('transform', {
    // @ts-ignore
    duration: theme.transitions?.duration.shortest,
  }),
}));

export const Item = ({
  label,
  value,
  containerSx,
}: {
  label: string;
  value: string;
  containerSx?: SxProps;
}) => {
  return (
    <Box
      sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'nowrap', ...containerSx }}
    >
      <Typography color='text.secondary' lineHeight={1.8} fontSize={13}>
        {label}
      </Typography>
      <Typography
        color='text.secondary'
        lineHeight={1.8}
        fontSize={13}
        fontWeight='fontWeightMedium'
        sx={{ ml: 3 }}
      >
        {value}
      </Typography>
    </Box>
  );
};

export const Submissions: React.FC = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<{ [key: string]: boolean } | null>(null);
  const { submissions, error } = useUserSubmissions();

  const handleExpandClick = (id: string) => {
    setExpanded((expanded) => ({ ...expanded, [id]: expanded ? !expanded[id] : true }));
  };

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ pl: 3 }}>
        Your Submissions
      </Typography>
      {error && (
        <Typography variant='subtitle2' color='error.main'>
          {error}
        </Typography>
      )}
      {submissions && submissions.length === 0 && (
        <Box>
          <Typography variant='subtitle2' color='text.secondary' align='center'>
            No Submissions
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Button
              onClick={() =>
                navigate(
                  createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } })
                )
              }
            >
              Start a quote
            </Button>
          </Box>
        </Box>
      )}
      <Grid container spacing={8} sx={{ my: 4 }}>
        {submissions.map((s, i) => (
          <Grid xs={12} sm={6} md={4} lg={4} key={s.id}>
            <Card
              sx={{
                maxWidth: 340,
                boxShadow: '0 8px 40px -12px rgba(0,0,0,0.3)',
                '&:hover': {
                  boxShadow: '0 16px 70px -12.125px rgba(0,0,0,0.3)',
                },
                mx: { xs: 'auto' },
              }}
              variant='elevation'
              raised
            >
              <CardMedia
                sx={{ height: 140 }}
                // image={fallbackImages[i] || fallbackImages[0]}
                image={s.satelliteMapImageURL || fallbackImages[i] || fallbackImages[0]}
                // image={
                //   (theme.palette.mode === 'dark' ? s.darkMapImageURL : s.lightMapImageURL) ||
                //   getRandomItem(fallbackImages)
                // }
                title={`${s.addressLine1} map`}
              />
              <CardContent sx={{ p: 5 }}>
                <Typography fontWeight={900} fontSize={24} gutterBottom>
                  {s.addressLine1}
                </Typography>
                <Item label='Building Coverage' value={dollarFormat(s.limitA)} />
                <Item label='Other Structures Coverage' value={dollarFormat(s.limitB)} />
                <Item label='Contents Coverage' value={dollarFormat(s.limitC)} />
                <Item label='Additional Expenses Coverage' value={dollarFormat(s.limitD)} />
                <Item
                  label='Submitted'
                  value={formatFirestoreTimestamp(s.metadata.created)}
                  containerSx={{ pt: 2 }}
                />
              </CardContent>
              <CardActions
                disableSpacing
                sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}` }}
              >
                <Chip size='small' label={s.status} />
                <ExpandMore
                  expand={Boolean(expanded && !!expanded[s.id])}
                  onClick={() => handleExpandClick(s.id)}
                  aria-expanded={Boolean(expanded && !!expanded[s.id])}
                  aria-label='show more'
                  size='small'
                >
                  <ExpandMoreRounded fontSize='inherit' />
                </ExpandMore>
              </CardActions>
              <Collapse in={Boolean(expanded && !!expanded[s.id])} timeout='auto' unmountOnExit>
                <CardContent>
                  <Item label='Submitted by' value={`${s.firstName} ${s.lastName}`} />
                  <Item label='Email' value={s.email} />
                  <Item
                    label='Year built'
                    value={s.yearBuilt?.toString() || '--'}
                    containerSx={{ pt: 2 }}
                  />
                  <Item label='# Stories' value={s.numStories?.toString() || '--'} />
                  <Item
                    label='Square Footage'
                    value={s.sqFootage ? numberFormat(s.sqFootage) : '--'}
                  />
                  <Item label='Basement' value={s.basement ?? '--'} />
                  <Item label='Flood Zone' value={s.floodZone ?? '--'} />
                  <Item
                    label='Est. Replacement Cost'
                    value={s.replacementCost ? dollarFormat(s.replacementCost) : '--'}
                  />
                  <Item label='Submission ID' value={s.id} containerSx={{ pt: 2 }} />
                </CardContent>
              </Collapse>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
