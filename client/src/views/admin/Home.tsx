import { KeyboardArrowRightRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  CardActionArea,
  CardActions,
  CardContentProps,
  CardProps,
  Unstable_Grid2 as Grid,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from 'reactfire';

import { Collection, Moratorium } from 'common';
import { FlexCard, FlexCardContent, IconButtonMenu } from 'components';
import {
  collection,
  getDocs,
  getFirestore,
  Query,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { useFetchDocCount } from 'hooks';
import { ADMIN_ROUTES, createPath, ROUTES } from 'router';

export const Home = () => {
  // const navigate = useNavigate();
  const { data: user } = useUser({ suspense: false });
  const fName = useMemo(
    () => (user && user.displayName?.split(' ')[0]) || '',
    [user],
  );

  return (
    <Box>
      <Box
        sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}
      >
        <Typography
          variant='h5'
          gutterBottom
        >{`Welcome back${fName && `, ${fName}`}`}</Typography>
        <Box>
          <IconButtonMenu
            menuItems={[
              {
                label: 'Create submission',
                action: createPath({
                  path: ROUTES.SUBMISSION_NEW,
                  params: { productId: 'flood' },
                }),
              },
              {
                label: 'Create Agency',
                action: () => createPath({ path: ADMIN_ROUTES.CREATE_TENANT }),
              },
              {
                label: 'Invite Agent',
                action: () => alert('Invite agent not done yet'),
              },
              {
                label: 'New Moratorium',
                action: createPath({ path: ADMIN_ROUTES.MORATORIUM_NEW }),
              },
            ]}
          />
        </Box>
      </Box>

      <Grid container spacing={6}>
        <Grid xs={6} sm={4} md={3}>
          <NewSubmissionsCard />
        </Grid>
        <Grid xs={6} sm={4} md={3}>
          <ActiveMoratoriumsCard />
        </Grid>
        <Grid xs={6} sm={4} md={3}>
          <StatCard
            cardClick={() => alert('test card action')}
            title='Agency Applications'
            content={
              <Typography variant='body2' color='primary'>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Sapiente sequi tenetur alias voluptatum dolore esse perferendis.
              </Typography>
            }
            cardProps={{ sx: { maxWidth: 340 } }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

interface StateCardProps {
  title: string;
  content: React.ReactNode;
  cardClick?: () => void;
  actionClick?: () => void;
  buttonText?: string;
  cardProps?: CardProps;
  cardContentProps?: CardContentProps;
}

function StatCard({
  title,
  content,
  cardClick,
  actionClick,
  buttonText = 'view',
  cardProps,
  cardContentProps,
}: StateCardProps) {
  return (
    <FlexCard {...cardProps}>
      <CardActionArea onClick={cardClick} sx={{ flex: '1 0 auto' }}>
        <FlexCardContent {...cardContentProps}>
          <Typography variant='overline' color='text.secondary'>
            {title}
          </Typography>
          <Box typography='h4' component='div'>
            {content}
          </Box>
        </FlexCardContent>
      </CardActionArea>
      {(cardClick || actionClick) && (
        <CardActions
          sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}` }}
        >
          <Button
            onClick={actionClick ?? cardClick}
            size='small'
            endIcon={<KeyboardArrowRightRounded />}
            sx={{ textTransform: 'none' }}
          >
            {buttonText}
          </Button>
        </CardActions>
      )}
    </FlexCard>
  );
}

function NewSubmissionsCard() {
  const navigate = useNavigate();
  const [count, setCount] = useState<number | null>(null);
  const fetchCount = useFetchDocCount('submissions', [
    where('status', '==', 'submitted'),
  ]);

  useEffect(() => {
    fetchCount().then((result) => {
      setCount(result.data().count);
    });
  }, [fetchCount]);

  return (
    <StatCard
      cardClick={() => navigate(createPath({ path: ROUTES.SUBMISSIONS }))}
      title='Submissions'
      content={`${count || '--'} new`}
      cardProps={{ sx: { maxWidth: 340 } }}
    />
  );
}

function ActiveMoratoriumsCard() {
  const navigate = useNavigate();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (count) return;
    const q = query(
      collection(getFirestore(), Collection.Enum.moratoriums),
      where('effectiveDate', '<=', Timestamp.now()),
    ) as Query<Moratorium>;
    getDocs(q)
      .then((querySnap) => {
        const tNow = Timestamp.now().toMillis();
        const active = querySnap.docs
          .map((snap) => ({ ...snap.data(), id: snap.id }))
          .filter((doc) => {
            if (!doc.expirationDate) return true;

            return doc.expirationDate.toMillis() > tNow;
          });

        if (active) setCount(active.length);
      })
      .catch(console.error);
  }, [count]);

  return (
    <StatCard
      cardClick={() => navigate(createPath({ path: ADMIN_ROUTES.MORATORIUMS }))}
      title='Moratoriums'
      content={`${count || '--'} active`}
      cardProps={{ sx: { maxWidth: 340 } }}
    />
  );
}
