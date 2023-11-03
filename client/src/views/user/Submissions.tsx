import { ExpandMoreRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Collapse,
  Unstable_Grid2 as Grid,
  IconButton,
  IconButtonProps,
  Typography,
} from '@mui/material';
import { SxProps, styled } from '@mui/system';
import { getFirestore, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { useUser } from 'reactfire';

import { LoadingButton } from '@mui/lab';
import { VoidSVG } from 'assets/images';
import { COLLECTIONS, Submission, WithId, fallbackImages, submissionsCollection } from 'common';
import { LoadingSpinner } from 'components';
import { useAuth } from 'context/AuthContext';
import { useInfiniteDocs } from 'hooks';
import { dollarFormat, formatFirestoreTimestamp, numberFormat } from 'modules/utils/helpers';
import { ROUTES, createPath } from 'router';

// TODO: use useSignInCheck

export const useUserSubmissionsOld = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<WithId<Submission>[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.uid) {
      setError('Must be authenticated');
      return;
    }

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

// TODO: need to throw if no user
const useUserSubmissions = (userId: string) => {
  const { ref, inView } = useInView();
  const { data, error, status, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteDocs<Submission>(COLLECTIONS.SUBMISSIONS, [
      where('userId', '==', userId),
      orderBy('metadata.created', 'desc'),
    ]);

  useEffect(() => {
    if (!hasNextPage) return;
    if (inView) {
      console.log('fetchNextPage...');
      fetchNextPage();
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasNextPage]);

  return useMemo(
    () => ({
      data,
      error,
      isFetchingNextPage,
      hasNextPage,
      status,
      fetchNextPage,
      loadMoreRef: ref,
    }),
    [data, error, isFetchingNextPage, hasNextPage, status, fetchNextPage, ref]
  );
};

export const Submissions = () => {
  const navigate = useNavigate();
  const { data: user } = useUser();
  if (!user?.uid) throw new Error('must be signed in');
  const { data, status, error, isFetchingNextPage, hasNextPage, fetchNextPage, loadMoreRef } =
    useUserSubmissions(user.uid);

  useEffect(() => {
    console.log('DATA: ', data);
  }, [data]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant='h5' gutterBottom sx={{ pl: 3 }}>
          Your Submissions
        </Typography>
        <LoadingSpinner loading={isFetchingNextPage} />
      </Box>

      {status === 'pending' ? (
        <Typography align='center'>Loading...</Typography>
      ) : (
        <>
          {data && data?.pages?.length > 0 ? (
            <>
              <Grid container spacing={8} sx={{ my: 4 }}>
                {data?.pages.map((group, i) => (
                  <Fragment key={`submission-group-${i}`}>
                    {group.data.map((s) => (
                      <Grid xs={12} sm={6} md={4} lg={4} xl={3} key={s.id}>
                        <SubmissionCard submission={s} />
                      </Grid>
                    ))}
                  </Fragment>
                ))}
                <Grid xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <LoadingButton
                    ref={loadMoreRef}
                    onClick={() => fetchNextPage()}
                    disabled={!hasNextPage || isFetchingNextPage}
                    loading={isFetchingNextPage}
                  >
                    {isFetchingNextPage
                      ? 'Loading more...'
                      : hasNextPage
                      ? 'Load more'
                      : 'All items loaded'}
                  </LoadingButton>
                </Grid>
              </Grid>
            </>
          ) : (
            <Box>
              <Box sx={{ height: { xs: 60, sm: 80, md: 100 }, width: '100%' }}>
                {/* <VoidSVG height='100%' width='100%' preserveAspectRatio='xMidYMin meet' /> */}
                <VoidSVG height='100%' width='100%' preserveAspectRatio='xMidYMin meet' />
              </Box>
              <Typography variant='subtitle2' color='text.secondary' align='center' sx={{ py: 2 }}>
                No Submissions
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
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
        </>
      )}

      {Boolean(error) && (
        <>
          <Typography gutterBottom>Something went wrong</Typography>
          <Typography component='div' variant='body2' color='text.secondary'>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </Typography>
        </>
      )}
    </Box>
  );
};

function SubmissionCard({ submission: s }: { submission: WithId<Submission> }) {
  const [expanded, setExpanded] = useState<boolean>(false);

  const handleExpandClick = useCallback(() => {
    setExpanded((expanded) => !expanded);
  }, []);

  return (
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
        image={s?.imageURLs?.satellite || fallbackImages[0]}
        title={`${s.address?.addressLine1} map`}
      />
      <CardContent sx={{ p: 5 }}>
        <Typography fontWeight={900} fontSize={24} gutterBottom>
          {s.address?.addressLine1}
        </Typography>
        <Item label='Building Coverage' value={dollarFormat(s.limits.limitA)} />
        <Item label='Other Structures Coverage' value={dollarFormat(s.limits.limitB)} />
        <Item label='Contents Coverage' value={dollarFormat(s.limits.limitC)} />
        <Item label='Additional Expenses Coverage' value={dollarFormat(s.limits.limitD)} />
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
          // expand={Boolean(expanded && !!expanded[s.id])}
          expand={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label='show more'
          size='small'
        >
          <ExpandMoreRounded fontSize='inherit' />
        </ExpandMore>
      </CardActions>
      <Collapse in={expanded} timeout='auto' unmountOnExit>
        <CardContent>
          <Item label='Submitted by' value={`${s.contact.firstName} ${s.contact.lastName}`} />
          <Item label='Email' value={s.contact.email} />
          <Item
            label='Year built'
            value={s.ratingPropertyData?.yearBuilt?.toString() || '--'}
            containerSx={{ pt: 2 }}
          />
          <Item label='# Stories' value={s.ratingPropertyData?.numStories?.toString() || '--'} />
          <Item
            label='Square Footage'
            value={
              s.ratingPropertyData?.sqFootage ? numberFormat(s.ratingPropertyData?.sqFootage) : '--'
            }
          />
          <Item label='Basement' value={s.ratingPropertyData?.basement ?? '--'} />
          <Item label='Flood Zone' value={s.ratingPropertyData?.floodZone ?? '--'} />
          <Item
            label='Est. Replacement Cost'
            value={
              s.ratingPropertyData?.replacementCost
                ? dollarFormat(s.ratingPropertyData?.replacementCost)
                : '--'
            }
          />
          <Item label='Submission ID' value={s.id} containerSx={{ pt: 2 }} />
        </CardContent>
      </Collapse>
    </Card>
  );
}

// export const SubmissionsOld = () => {
//   const navigate = useNavigate();
//   const [expanded, setExpanded] = useState<{ [key: string]: boolean } | null>(null);
//   const { submissions, error } = useUserSubmissionsOld();
//   // TODO: use reactfire useCollectionData hook

//   const handleExpandClick = (id: string) => {
//     setExpanded((expanded) => ({ ...expanded, [id]: expanded ? !expanded[id] : true }));
//   };

//   return (
//     <Box>
//       <Typography variant='h5' gutterBottom sx={{ pl: 3 }}>
//         Your Submissions
//       </Typography>
//       {error && (
//         <Typography variant='subtitle2' color='error.main'>
//           {error}
//         </Typography>
//       )}
//       {submissions && submissions.length === 0 && (
// <Box>
//   <Box sx={{ height: { xs: 60, sm: 80, md: 100 }, width: '100%' }}>
//     <VoidSVG height='100%' width='100%' preserveAspectRatio='xMidYMin meet' />
//   </Box>
//   <Typography variant='subtitle2' color='text.secondary' align='center' sx={{ py: 2 }}>
//     No Submissions
//   </Typography>
//   <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
//     <Button
//       onClick={() =>
//         navigate(
//           createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } })
//         )
//       }
//     >
//       Start a quote
//     </Button>
//   </Box>
// </Box>
//       )}
//       <Grid container spacing={8} sx={{ my: 4 }}>
//         {submissions.map((s, i) => (
//           <Grid xs={12} sm={6} md={4} lg={4} key={s.id}>
//             <Card
//               sx={{
//                 maxWidth: 340,
//                 boxShadow: '0 8px 40px -12px rgba(0,0,0,0.3)',
//                 '&:hover': {
//                   boxShadow: '0 16px 70px -12.125px rgba(0,0,0,0.3)',
//                 },
//                 mx: { xs: 'auto' },
//               }}
//               variant='elevation'
//               raised
//             >
//               <CardMedia
//                 sx={{ height: 140 }}
//                 // image={fallbackImages[i] || fallbackImages[0]}
//                 image={s?.imageURLs?.satellite || fallbackImages[i] || fallbackImages[0]}
//                 title={`${s.address?.addressLine1} map`}
//               />
//               <CardContent sx={{ p: 5 }}>
//                 <Typography fontWeight={900} fontSize={24} gutterBottom>
//                   {s.address?.addressLine1}
//                 </Typography>
//                 <Item label='Building Coverage' value={dollarFormat(s.limits.limitA)} />
//                 <Item label='Other Structures Coverage' value={dollarFormat(s.limits.limitB)} />
//                 <Item label='Contents Coverage' value={dollarFormat(s.limits.limitC)} />
//                 <Item label='Additional Expenses Coverage' value={dollarFormat(s.limits.limitD)} />
//                 <Item
//                   label='Submitted'
//                   value={formatFirestoreTimestamp(s.metadata.created)}
//                   containerSx={{ pt: 2 }}
//                 />
//               </CardContent>
//               <CardActions
//                 disableSpacing
//                 sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}` }}
//               >
//                 <Chip size='small' label={s.status} />
//                 <ExpandMore
//                   expand={Boolean(expanded && !!expanded[s.id])}
//                   onClick={() => handleExpandClick(s.id)}
//                   aria-expanded={Boolean(expanded && !!expanded[s.id])}
//                   aria-label='show more'
//                   size='small'
//                 >
//                   <ExpandMoreRounded fontSize='inherit' />
//                 </ExpandMore>
//               </CardActions>
//               <Collapse in={Boolean(expanded && !!expanded[s.id])} timeout='auto' unmountOnExit>
//                 <CardContent>
//                   <Item
//                     label='Submitted by'
//                     value={`${s.contact.firstName} ${s.contact.lastName}`}
//                   />
//                   <Item label='Email' value={s.contact.email} />
//                   <Item
//                     label='Year built'
//                     value={s.ratingPropertyData?.yearBuilt?.toString() || '--'}
//                     containerSx={{ pt: 2 }}
//                   />
//                   <Item
//                     label='# Stories'
//                     value={s.ratingPropertyData?.numStories?.toString() || '--'}
//                   />
//                   <Item
//                     label='Square Footage'
//                     value={
//                       s.ratingPropertyData?.sqFootage
//                         ? numberFormat(s.ratingPropertyData?.sqFootage)
//                         : '--'
//                     }
//                   />
//                   <Item label='Basement' value={s.ratingPropertyData?.basement ?? '--'} />
//                   <Item label='Flood Zone' value={s.ratingPropertyData?.floodZone ?? '--'} />
//                   <Item
//                     label='Est. Replacement Cost'
//                     value={
//                       s.ratingPropertyData?.replacementCost
//                         ? dollarFormat(s.ratingPropertyData?.replacementCost)
//                         : '--'
//                     }
//                   />
//                   <Item label='Submission ID' value={s.id} containerSx={{ pt: 2 }} />
//                 </CardContent>
//               </Collapse>
//             </Card>
//           </Grid>
//         ))}
//       </Grid>
//     </Box>
//   );
// };
