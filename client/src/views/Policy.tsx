import {
  AccountBalanceRounded,
  CancelRounded,
  EditRounded,
  EmailRounded,
  FiberNewRounded,
  GridViewRounded,
  MapRounded,
  PhoneRounded,
  TableRowsRounded,
} from '@mui/icons-material';
import {
  Avatar,
  Badge,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Unstable_Grid2 as Grid,
  Link,
  MenuItem,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { PickingInfo } from 'deck.gl/typed';
import { where } from 'firebase/firestore';
import { isEmpty } from 'lodash';
import { Suspense, useCallback, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { z } from 'zod';

import { ILocation, Policy as IPolicy, WithId } from 'common';
import { ErrorFallback, LoadingSpinner, NotFound } from 'components';
import { IconMenu } from 'components/IconButtonMenu';
import { LocationsMap, PolicyLocationCards } from 'elements';
import {
  ChangeRequestsDialog,
  useViewChangeRequestsDialogProps,
} from 'elements/ChangeRequestDialog';
import { ContactList } from 'elements/forms';
import { LocationsGrid } from 'elements/grids';
import {
  useCreatePolicyChangeRequest,
  useDocData,
  useGeneratePDF,
  useSafeParams,
  useSearchParamToggle,
  useWidth,
} from 'hooks';
import { useCreateCancelRequest } from 'hooks/useCreateCancelRequest';
import { useCreateLocationChangeRequest } from 'hooks/useCreateLocationChangeRequest';
import {
  calcPolicyStatus,
  compressedToFormattedAddr,
  formatDate,
  formatFirestoreTimestamp,
  formatPhoneNumber,
  stringAvatar,
} from 'modules/utils';
import { useNavigate } from 'react-router-dom';
import { ROUTES, createPath } from 'router';

// TODO: should locations grid be passed location IDs explicitly ?? instead if querying locations collection
// would require new grid component (Can't do it with ServerDataGrid)

// TODO: make location card flip on hover to show additional details ??

// TODO:
//    - policy overview details
//    - submit claim

// TODO: locations cards container needs max height w/ scroll so if there's a lot of policies the user can still reach the bottom

// TODO: store "view" preference in local storage ??
const DataViewType = z.enum(['cards', 'grid', 'map']);
type TDataViewType = z.infer<typeof DataViewType>;

export const Policy = () => {
  const { policyId } = useSafeParams(['policyId']);
  const navigate = useNavigate();
  const { isMobile } = useWidth();
  const [locationsView, handleViewChange] = useSearchParamToggle<TDataViewType>(
    'l_view',
    DataViewType.options,
    'cards'
  );

  // TODO: use policy converter to get status ?? need to create usePolicy() hook ??
  const { data } = useDocData<IPolicy>('POLICIES', policyId);
  const { downloadPDF: downloadPolicy } = useGeneratePDF('generateDecPDF');

  const locationChangeDialog = useCreateLocationChangeRequest();
  const cancelDialog = useCreateCancelRequest();

  const locationConstraints = useMemo(
    () => [where('policyId', '==', policyId), where('parentType', '==', 'policy')],
    [policyId]
  );
  // BUG: won't work - can only have 50 values in "in" query
  // https://firebase.google.com/docs/firestore/query-data/queries#limits_on_or_queries
  // const locationConstraints = useMemo(
  //   () => [where(documentId(), 'in', Object.keys(data?.locations || {}))],
  //   [data]
  // );

  const handleDownloadPolicy = useCallback(
    () => downloadPolicy(policyId),
    [downloadPolicy, policyId]
  );

  const handleLocationChangeRequest = useCallback(
    (location: WithId<ILocation>) => locationChangeDialog(policyId, location.id),
    [locationChangeDialog, policyId]
  );

  const handleLocationChangeDialog = useCallback(
    (params: GridRowParams) => () => {
      locationChangeDialog(params.row.policyId, params.id.toString());
    },
    [locationChangeDialog]
  );

  const handleCancelPolicy = useCallback(async () => {
    await cancelDialog(policyId);
  }, [cancelDialog, policyId]);

  const handleCancelLocation = useCallback(
    ({ id }: GridRowParams<ILocation>) =>
      async () => {
        cancelDialog(policyId, id.toString());
      },
    [cancelDialog, policyId]
  );

  const handleNewClaim = useCallback(
    ({ id }: GridRowParams<ILocation>) =>
      () =>
        navigate(
          createPath({ path: ROUTES.CLAIM_NEW, params: { policyId, locationId: id.toString() } })
        ),
    [navigate, policyId]
  );

  const renderLocationGridActions = useCallback(
    (params: GridRowParams) => {
      return [
        <GridActionsCellItem
          icon={
            <Tooltip title='request change' placement='top'>
              <EditRounded />
            </Tooltip>
          }
          onClick={handleLocationChangeDialog(params)}
          label='Request change'
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title='new claim' placement='top'>
              <FiberNewRounded />
            </Tooltip>
          }
          onClick={handleNewClaim(params)}
          label='New claim'
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title='cancel location' placement='top'>
              <CancelRounded />
            </Tooltip>
          }
          onClick={handleCancelLocation(params)}
          label='Cancel location'
          showInMenu={true}
        />,
      ];
    },
    [handleCancelLocation, handleLocationChangeDialog, handleNewClaim]
  );

  const [locations, locationsCount] = useMemo(() => {
    const lcns = Object.entries(data.locations || {})
      .filter(([id, l]) => !isEmpty(l))
      .map(([id, l]) => ({
        ...l,
        coordinates: l.coords,
        formattedAddress: compressedToFormattedAddr(l.address),
        id,
      }));

    const count = lcns.length;

    return [lcns, count];
  }, [data]);

  // TODO: throw & handle in error boundary ??
  if (!data) return <NotFound title='Policy not found' />;

  // TODO: container ?? layout ??
  return (
    <Box sx={{ px: { xs: 2, sm: 4, lg: 10 }, py: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Typography
          variant='overline'
          color='text.secondary'
          gutterBottom
          align='center'
          sx={{ lineHeight: 1.4 }}
        >{`Policy ID: ${policyId}`}</Typography>
        <Box>
          {/* <Button size='small' onClick={handleNewClaim}>
            Submit Claim
          </Button> */}
          <PolicyIconMenu policyId={policyId} />
        </Box>
      </Box>
      <Divider />
      <Box sx={{ pb: { xs: 6, sm: 8, md: 10 }, pt: { xs: 3, sm: 4, md: 5 } }}>
        <Grid container spacing={5}>
          <Grid
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ pb: 6 }}>
              <Typography variant='overline' color='text.secondary'>
                Named Insured
              </Typography>
              <Box sx={{ display: 'flex' }}>
                <Box sx={{ flex: '0 0 auto', mr: { xs: 3, sm: 4 } }}>
                  <Avatar />
                </Box>
                <Box sx={{ flex: '1 0 auto' }}>
                  <Typography variant='h6' sx={{ fontSize: '1.2rem', lineHeight: 1.2 }}>
                    {data?.namedInsured?.displayName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {data?.namedInsured?.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Paper sx={{ py: { xs: 2, md: 3 }, px: { xs: 4, md: 5 } }}>
              <Stack
                direction='row'
                spacing={{ xs: 3, sm: 4, md: 6, lg: 8 }}
                divider={<Divider orientation='vertical' flexItem />}
                justifyContent='space-between'
              >
                {/* TODO: uncomment once insured value is available */}
                {/* <StatBox title='Insured Value' value='$1.2M' /> */}
                <StatBox
                  title='Effective'
                  value={formatDate(
                    data?.effectiveDate?.toDate(),
                    isMobile ? 'MM/dd/yy' : 'MMM dd, yyyy'
                  )}
                />
                <StatBox
                  title='Status'
                  value={calcPolicyStatus(data)}
                  // value={`${data?.status === POLICY_STATUS.PAID ? 'active' : 'inactive'}`}
                />
                <StatBox title='Term' value={`${data?.term || ''}`} />
                <StatBox title='Locations' value={`${locationsCount || '--'}`} />
              </Stack>
            </Paper>
          </Grid>
          <Grid xs={12} sm='auto'>
            <Card>
              <CardHeader
                avatar={<Avatar {...stringAvatar(`${data?.agent?.name}`)}></Avatar>}
                // action={
                //   <IconButton aria-label='settings'>
                //     <MoreVertIcon />
                //   </IconButton>
                // }
                title={
                  <Typography
                    variant='body1'
                    fontSize='1.1rem'
                    fontWeight={500}
                    sx={{ lineHeight: 1.2 }}
                  >{`${data?.agent?.name}`}</Typography>
                }
                subheader={
                  <Typography
                    variant='body2'
                    fontSize='0.725rem'
                    fontWeight={500}
                    color='text.secondary'
                  >
                    Agent
                  </Typography>
                }
              />
              <CardContent>
                <ContactList
                  items={[
                    {
                      primaryText: `${data?.agency?.name || ''}`,
                      icon: <AccountBalanceRounded fontSize='small' color='primary' />,
                    },
                    {
                      primaryText: `${data?.agent?.email}`,
                      icon: <EmailRounded fontSize='small' color='primary' />,
                    },
                    {
                      primaryText: formatPhoneNumber(`${data?.agent?.phone}`) || '',
                      icon: <PhoneRounded fontSize='small' color='primary' />,
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      <Divider />
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: { xs: 2, md: 3 },
          }}
        >
          <Typography variant='h6'>Locations</Typography>
          <Box>
            <ToggleButtonGroup
              value={locationsView}
              onChange={handleViewChange}
              exclusive
              size='small'
              aria-label='locations view'
            >
              <ToggleButton value='cards' aria-label='cards'>
                <GridViewRounded />
              </ToggleButton>
              <ToggleButton value='grid' aria-label='grid'>
                <TableRowsRounded />
              </ToggleButton>
              <ToggleButton value='map' aria-label='map'>
                <MapRounded />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<LoadingSpinner loading={true} />}>
            {locationsView === 'cards' ? (
              <Box sx={{ py: 2 }}>
                <PolicyLocationCards policyId={policyId} onEdit={handleLocationChangeRequest} />
              </Box>
            ) : null}
            {locationsView === 'grid' ? (
              <LocationsGrid
                constraints={locationConstraints}
                renderActions={renderLocationGridActions}
              />
            ) : null}
            {locationsView === 'map' ? (
              <Card sx={{ height: 500, width: '100% ' }}>
                <LocationsMap
                  data={locations}
                  layerProps={{ pickable: true }}
                  renderTooltipContent={(info: PickingInfo) => (
                    <Box sx={{ px: 2, borderRadius: 0.5 }}>
                      <Typography variant='body2' fontWeight='fontWeightMedium'>
                        {`${info.object?.address?.s1 || ''}`}
                      </Typography>
                      <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>
                        {`${info.object?.address?.c || ''}, ${info.object?.address?.st || ''}`}
                      </Typography>
                      {info.object?.cancelEffDate ? (
                        <Typography
                          variant='body2'
                          color='text.secondary'
                        >{`Cancelled: ${formatFirestoreTimestamp(
                          info.object?.cancelEffDate,
                          'date'
                        )}`}</Typography>
                      ) : null}
                    </Box>
                  )}
                />
              </Card>
            ) : null}
          </Suspense>
        </ErrorBoundary>
      </Box>
      <Box sx={{ py: { xs: 4, md: 5, lg: 8 } }}>
        <Box sx={{ py: { xs: 4, md: 5, lg: 8 } }}>
          <Typography variant='body2' component='div' color='text.secondary'>
            {data?.effectiveDate && data?.expirationDate ? (
              <Typography component='span' variant='body2'>
                {`This policy is effective ${formatFirestoreTimestamp(
                  data.effectiveDate,
                  'date'
                )} - ${formatFirestoreTimestamp(data.expirationDate, 'date')}. `}
              </Typography>
            ) : null}
            You can{' '}
            <Link component='button' variant='body2' onClick={handleDownloadPolicy}>
              download a copy of your policy
            </Link>
            {/* TODO: uncomment once handler set up */}
            {/* {', '}
          <Link component='button' variant='body2' onClick={handleChangeRequest}>
            request a change
          </Link> */}
            {', or '}
            <Link component='button' variant='body2' underline='hover' onClick={handleCancelPolicy}>
              cancel
            </Link>
            {' anytime.'}
          </Typography>
        </Box>
        {/* <Button onClick={handleTest}>Test Policy Dec</Button> */}
      </Box>
    </Box>
  );
};

interface StatBoxProps {
  title: string;
  value: string | number;
}

function StatBox({ title, value }: StatBoxProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant='subtitle2' fontWeight={500} fontSize='0.75rem' color='text.secondary'>
        {title}
      </Typography>
      <Typography variant='h6' color='primary.main'>
        {value}
      </Typography>
    </Box>
  );
}

function PolicyIconMenu({ policyId }: { policyId: string }) {
  const policyChangeRequest = useCreatePolicyChangeRequest();
  const { open, handleOpen, handleClose, count } = useViewChangeRequestsDialogProps(policyId);

  const handleNewRequest = useCallback(() => {
    policyChangeRequest(policyId);
  }, [policyChangeRequest, policyId]);

  return (
    <>
      <Badge badgeContent={count || 0} color='primary'>
        <IconMenu iconButtonProps={{ sx: { ml: 2, borderRadius: 1 } }}>
          <MenuItem onClick={handleNewRequest}>Request policy change</MenuItem>
          <Badge
            badgeContent={count || 0}
            color='primary'
            sx={{ '& .MuiBadge-badge': { right: '8px' } }}
          >
            <MenuItem onClick={handleOpen}>View change requests</MenuItem>
          </Badge>
        </IconMenu>
      </Badge>
      <ChangeRequestsDialog open={open} handleClose={handleClose} policyId={policyId} />
    </>
  );
}
