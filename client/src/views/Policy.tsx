import React, { useCallback, useMemo } from 'react';
import { alpha, Box, Container, IconButton, Tooltip, Typography } from '@mui/material';
import { ArrowBackIosNewRounded, EditRounded } from '@mui/icons-material';
import Grid from '@mui/material/Unstable_Grid2';
import { doc, getDoc } from 'firebase/firestore';
import { LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';

import { policiesCollection, Policy as IPolicy, WithId } from 'common';
import { FlexCard, FlexCardContent, InputDialog } from 'components';
import { dollarFormat } from 'modules/utils/helpers';
import { useConfirmation } from 'modules/components/ConfirmationService';
import { createPath, ROUTES } from 'router';
import {
  SweetHomeSVG,
  BreakingBarriersSVG,
  RelaxingAtHomeSVG,
  ApartmentRentSVG,
} from 'assets/images';

export const policyLoader = async ({ params }: LoaderFunctionArgs) => {
  try {
    const policyRef = doc(policiesCollection, params.policyId);
    console.log(`fetching policy: ${params.policyId}`);
    const snap = await getDoc(policyRef);
    let data = snap.data();

    if (!snap.exists() || !data) {
      throw new Response('Not Found', { status: 404 });
    }

    return { ...data, id: snap.id };
  } catch (err) {
    throw new Response(`Error fetching submission (ID: ${params.submissionId})`);
  }
};

export const Policy: React.FC = () => {
  const navigate = useNavigate();
  const data = useLoaderData() as WithId<IPolicy>;
  const confirm = useConfirmation();
  console.log('data: ', data);

  const limits = useMemo(
    () => [
      {
        icon: <SweetHomeSVG style={{ width: 'inherit', height: 'inherit', margin: 'auto' }} />,
        title: 'Building Coverage',
        description: `Lorem ipsum dolor sit amet consectetur adipisicing elit. Fugiat laudantium
                  quisquam commodi neque, id delectus cum corporis explicabo.`,
        amount: data?.limits?.limitA,
        field: 'limitA',
      },
      {
        icon: (
          <BreakingBarriersSVG style={{ width: 'inherit', height: 'inherit', margin: 'auto' }} />
        ),
        title: 'Additional Structures Coverage',
        description: `Lorem ipsum dolor sit amet consectetur adipisicing elit. Fugiat laudantium
                  quisquam commodi neque, id delectus cum corporis explicabo. Lorem ipsum dolor sit amet consectetur adipisicing elit. Id delectus cum corporis explicabo.`,
        amount: data?.limits?.limitB,
        field: 'limitB',
      },
      {
        icon: <RelaxingAtHomeSVG style={{ width: 'inherit', height: 'inherit', margin: 'auto' }} />,
        title: 'Contents Coverage',
        description: `Lorem ipsum dolor sit amet consectetur adipisicing elit. Fugiat laudantium
                  quisquam commodi neque, id delectus cum corporis explicabo.`,
        amount: data?.limits?.limitC,
        field: 'limitC',
      },
      {
        icon: <ApartmentRentSVG style={{ width: 'inherit', height: 'inherit', margin: 'auto' }} />,
        title: 'Expenses Coverage',
        description: `Lorem ipsum dolor sit amet consectetur adipisicing elit. Fugiat laudantium
                  quisquam commodi neque, id delectus cum corporis explicabo.`,
        amount: data?.limits?.limitD,
        field: 'limitD',
      },
    ],
    [data]
  );

  const handleRequestEdit = useCallback(
    async (field: string, initialValue?: string | number) => {
      console.log('request edit', field);
      try {
        const initVal = typeof initialValue === 'number' ? initialValue.toString() : initialValue;

        const newVal = await confirm({
          catchOnCancel: false,
          variant: 'danger',
          title: 'Request policy change',
          description: `Please enter the value you'd like to change to.`,
          component: (
            <InputDialog
              onAccept={() => {}}
              onClose={() => {}}
              open={false}
              initialInputValue={initVal || ''}
              inputProps={{ type: 'text', label: field, name: field }}
              confirmButtonText='Request update'
            />
          ),
        });

        if (!newVal) return;
        console.log('new val: ', newVal);

        // TODO: send update request
      } catch (err) {
        console.log(err);
      }

      // TODO: send email notification requesting change
      // policyId, policy field, new value
    },
    [confirm]
  );

  return (
    <Box>
      <Container
        maxWidth='xl'
        sx={{
          backgroundColor: 'inherit',
          backgroundImage: (theme) =>
            `linear-gradient(${alpha(theme.palette.background.paper, 0.8)}, ${alpha(
              theme.palette.background.paper,
              0.55
            )}), url(${
              theme.palette.mode === 'dark'
                ? data.imageUrls?.darkMapImageURL
                : data.imageUrls?.lightMapImageURL
              // theme.palette.mode === 'dark' ? data.darkMapImageURL : data.lightMapImageURL
            })`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            color='primary'
            sx={{
              position: { xs: 'relative', sm: 'absolute' },
              top: { xs: 12, sm: 16, md: 20 },
              left: { xs: 4, sm: 8, md: 16 },
            }}
            onClick={() => navigate(createPath({ path: ROUTES.USER_POLICIES }))}
          >
            <ArrowBackIosNewRounded />
          </IconButton>
          <Typography
            variant='h3'
            gutterBottom
            align='center'
            fontSize={{ xs: '1.6rem', sm: '2rem', md: '2.4rem' }}
            fontWeight='fontWeightMedium'
            sx={{ pt: { xs: 4, md: 8, lg: 12 }, pb: { sm: 6, md: 8 } }}
          >{`Your ${data.address.addressLine1} Flood Policy`}</Typography>
        </Box>

        <Box sx={{ pt: 4, pb: { xs: 8, md: 10, lg: 16 }, px: { md: 3, lg: 4 } }}>
          <Grid container spacing={6}>
            {limits.map((limit) => (
              <Grid xs={12} sm={6} lg={3} key={limit.title}>
                <FlexCard sx={{ maxWidth: 340, mx: 'auto' }}>
                  <FlexCardContent>
                    <Box
                      sx={{
                        textAlign: 'center',
                        height: { xs: '50px', sm: '60px', md: '80px' },
                        m: 3,
                        mb: 5,
                      }}
                    >
                      {limit.icon}
                    </Box>
                    <Typography
                      variant='overline'
                      component='h6'
                      align='center'
                      gutterBottom
                      sx={{ fontSize: '0.925rem', fontWeight: 'fontWeightMedium', lineHeight: 1.2 }}
                    >
                      {limit.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ py: 3 }}>
                      {limit.description}
                    </Typography>
                  </FlexCardContent>
                  <Box sx={{ pt: 2, pb: 4, position: 'relative' }}>
                    <Typography variant='h5' align='center' fontWeight='fontWeightMedium'>
                      {dollarFormat(limit.amount) || '--'}
                    </Typography>
                    <Tooltip title='Request change'>
                      <IconButton
                        size='small'
                        color='info'
                        onClick={() => handleRequestEdit(limit.field)}
                        sx={{ position: 'absolute', right: 12, top: 10 }}
                      >
                        <EditRounded fontSize='inherit' />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </FlexCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
      <Box
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.primaryDark[700] // theme.palette.background.default
              : theme.palette.background.paper,
          py: 10,
          width: '100%',
          px: 'auto',
        }}
      >
        <Container maxWidth='sm'>
          <Typography variant='h4' align='center' gutterBottom>
            Your Deductible
          </Typography>
          <Typography variant='subtitle1' color='text.secondary'>
            The deductible is the amount paid out of pocket by the policy holder before an insurance
            provider will pay any expenses.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <Typography variant='h5' align='center' fontWeight='fontWeightMedium'>
              {data.deductible ? dollarFormat(data.deductible) : '--'}
            </Typography>
            <Tooltip title='Request change'>
              <IconButton
                size='small'
                color='info'
                onClick={() => handleRequestEdit('deductible')}
                sx={{ px: 3, mr: -10 }}
              >
                <EditRounded fontSize='inherit' />
              </IconButton>
            </Tooltip>
          </Box>
        </Container>
      </Box>
      {/* <Container sx={{ py: { xs: 8, md: 10, lg: 16 } }}>
        <Typography variant='h4' align='center' gutterBottom>
          What's Covered?
        </Typography>
        <AirRounded />
      </Container> */}
    </Box>
  );
};
