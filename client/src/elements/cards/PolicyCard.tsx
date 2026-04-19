import type { Policy, WithId } from '@idemand/common';
import {
  AddCircleRounded,
  DescriptionRounded,
  PaymentsRounded,
} from '@mui/icons-material';
import {
  Avatar,
  AvatarGroup,
  Box,
  CardActionArea,
  CardMedia,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { fallbackImages } from 'common';
import { FlexCard, FlexCardContent } from 'components';
import { FlexCardContentWrapper } from 'components/FlexCard';
import { useGeneratePDF } from 'hooks';
import { noop } from 'lodash';
import { formatFirestoreTimestamp } from 'modules/utils';
import { useNavigate } from 'react-router-dom';
import { createPath, ROUTES } from 'router';
import { Item } from './Item';

// TODO: replace items with TIV, etc. ?? instead of agency

const currentMS = new Date().getTime();

export interface PolicyCardProps {
  policy: WithId<Policy>;
  onClick?: (policyId: string) => void;
  i: number; // TODO: delete - temp for fallback img
}
export const PolicyCard = ({ policy, onClick = noop, i }: PolicyCardProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = Object.values(policy.locations || {})[0];

  const activeLocationCount = Object.entries(policy.locations || {}).filter(
    ([id, lcn]) =>
      !lcn.cancelEffDate ||
      (lcn.cancelEffDate && lcn.cancelEffDate.toMillis() > currentMS),
  ).length;

  const moreCount = activeLocationCount > 1 ? activeLocationCount - 1 : 0;

  const { downloadPDF: downloadPolicy, loading } =
    useGeneratePDF('generateDecPDF');

  return (
    <FlexCard
      sx={{
        maxWidth: 400,
        boxShadow: '0 8px 40px -12px rgba(0,0,0,0.3)',
        '&:hover': {
          boxShadow: '0 16px 70px -12.125px rgba(0,0,0,0.3)',
        },
        mx: { xs: 'auto' },
      }}
      variant='elevation'
      raised
    >
      <FlexCardContentWrapper>
        <CardMedia
          sx={{ height: 140 }}
          image={
            (theme.palette.mode === 'dark'
              ? policy.imageURLs?.dark
              : policy.imageURLs?.light) ||
            fallbackImages[i] ||
            fallbackImages[0]
          }
          title={`policy cover image`}
        />
        <CardActionArea
          onClick={() => onClick(policy.id)}
          sx={{ flex: '1 0 auto' }}
        >
          <FlexCardContent sx={{ p: 5, height: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  alignItems: 'center',
                }}
              >
                {/* TODO: overflow ellipses */}
                <Typography
                  fontWeight={900}
                  fontSize={24}
                  sx={{
                    pr: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: '1 1 auto',
                  }}
                >
                  {location?.address?.s1 || ''}
                </Typography>
                {moreCount > 0 ? (
                  <Typography
                    color='text.tertiary'
                    variant='subtitle2'
                    sx={{ flex: '0 0 auto' }}
                  >
                    {`+${moreCount} more`}
                  </Typography>
                ) : null}
              </Box>
              <Box sx={{ flex: '1 0 auto' }}>
                <Item
                  label='Named Insured'
                  value={`${policy.namedInsured?.displayName}`}
                />
                <Item
                  label='Agent'
                  value={policy.agent?.name ?? 'Unavailable'}
                />
                <Item
                  label='Agency'
                  value={policy.agency?.name ?? 'Unavailable'}
                />
                <Item
                  label='Effective'
                  value={`${formatFirestoreTimestamp(
                    policy.effectiveDate,
                    'date',
                  )} - ${formatFirestoreTimestamp(policy.expirationDate, 'date')}`}
                />
                <Item label='# locations' value={`${activeLocationCount}`} />
              </Box>
              <Divider light sx={{ my: { xs: 3, md: 4 } }} />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <AvatarGroup max={4} sx={{ justifyContent: 'flex-end' }}>
                  {policy.namedInsured ? (
                    <Tooltip
                      title={`${policy.namedInsured.displayName}`}
                      key={policy.namedInsured.email}
                    >
                      {/* <Avatar src={f.img} alt={policy.namedInsured.firstName} /> */}
                      <Avatar
                        alt={`${policy.namedInsured.displayName}`}
                        sx={{
                          width: { xs: 30, md: 36 },
                          height: { xs: 30, md: 36 },
                        }}
                      />
                    </Tooltip>
                  ) : null}
                </AvatarGroup>
                <Stack direction='row' spacing={1}>
                  <Tooltip placement='top' title='new claim'>
                    <IconButton
                      aria-label='new claim'
                      size='small'
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(
                          createPath({
                            path: ROUTES.CLAIM_START,
                            search: { policyId: policy.id },
                          }),
                        );
                      }}
                    >
                      <AddCircleRounded fontSize='inherit' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip placement='top' title='view policy'>
                    <IconButton
                      aria-label='download policy'
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadPolicy(policy.id);
                      }}
                      size='small'
                      disabled={loading}
                      // loading={loading} TODO: enable for mui v7
                    >
                      <DescriptionRounded fontSize='inherit' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip placement='top' title='invoices'>
                    <IconButton
                      aria-label='invoices'
                      size='small'
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(
                          createPath({
                            path: ROUTES.POLICY_RECEIVABLES,
                            params: { policyId: policy.id },
                          }),
                        );
                      }}
                    >
                      <PaymentsRounded fontSize='inherit' />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Box>
          </FlexCardContent>
        </CardActionArea>
      </FlexCardContentWrapper>
    </FlexCard>
  );
};
