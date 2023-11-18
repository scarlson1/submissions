import {
  Avatar,
  AvatarGroup,
  Box,
  CardActionArea,
  CardMedia,
  Divider,
  Tooltip,
  Typography,
} from '@mui/material';
import { noop } from 'lodash';

import { Policy, WithId, fallbackImages } from 'common';
import { FlexCard, FlexCardContent } from 'components';
import { FlexCardContentWrapper } from 'components/FlexCard';
import { formatFirestoreTimestamp } from 'modules/utils';
import { Item } from './Item';

// TODO: replace items with TIV, etc. ?? instead of agency
// TODO: generate / use policy image

const currentMS = new Date().getTime();

export interface PolicyCardProps {
  policy: WithId<Policy>;
  onClick?: (policyId: string) => void;
  i: number; // TODO: delete - temp for fallback img
}
export const PolicyCard = ({ policy, onClick = noop, i }: PolicyCardProps) => {
  const location = Object.values(policy.locations || {})[0];

  const activeLocationCount = Object.entries(policy.locations || {}).filter(
    ([id, lcn]) =>
      !lcn.cancelEffDate || (lcn.cancelEffDate && lcn.cancelEffDate.toMillis() > currentMS)
  ).length;

  const moreCount = activeLocationCount > 1 ? activeLocationCount - 1 : 0;

  return (
    <FlexCard
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
      <FlexCardContentWrapper>
        <CardMedia
          sx={{ height: 140 }}
          // TODO: create policy images
          image={fallbackImages[i] || fallbackImages[0]}
          title={`policy cover image`}
        />
        <CardActionArea onClick={() => onClick(policy.id)} sx={{ flex: '1 0 auto' }}>
          <FlexCardContent sx={{ p: 5, height: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography fontWeight={900} fontSize={24} sx={{ pr: 2 }}>
                  {location?.address?.s1 || ''}
                </Typography>
                {moreCount > 0 ? (
                  <Typography color='text.tertiary' variant='subtitle2'>
                    {`+${moreCount} more`}
                  </Typography>
                ) : null}
              </Box>
              <Box sx={{ flex: '1 0 auto' }}>
                <Item label='Named Insured' value={`${policy.namedInsured?.displayName}`} />
                <Item label='Agent' value={policy.agent?.name ?? 'iDemand'} />
                <Item
                  label='Agency'
                  value={policy.agency?.name ?? 'iDemand Insurance Agency, Inc.'}
                />
                <Item
                  label='Effective'
                  value={`${formatFirestoreTimestamp(
                    policy.effectiveDate,
                    'date'
                  )} - ${formatFirestoreTimestamp(policy.expirationDate, 'date')}`}
                />
                <Item label='# locations' value={`${activeLocationCount}`} />
              </Box>
              <Divider light sx={{ my: { xs: 3, md: 4 } }} />
              <AvatarGroup max={4} sx={{ justifyContent: 'flex-end' }}>
                {policy.namedInsured ? (
                  <Tooltip
                    title={`${policy.namedInsured.displayName}`}
                    key={policy.namedInsured.email}
                  >
                    {/* <Avatar src={f.img} alt={policy.namedInsured.firstName} /> */}
                    <Avatar
                      alt={`${policy.namedInsured.displayName}`}
                      sx={{ width: { xs: 30, md: 36 }, height: { xs: 30, md: 36 } }}
                    />
                  </Tooltip>
                ) : null}
              </AvatarGroup>
            </Box>
          </FlexCardContent>
        </CardActionArea>
      </FlexCardContentWrapper>
    </FlexCard>
  );
};
