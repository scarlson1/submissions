import {
  Avatar,
  AvatarGroup,
  CardActionArea,
  CardMedia,
  Divider,
  Tooltip,
  Typography,
} from '@mui/material';
import { isEmpty, noop } from 'lodash';

import { Policy, WithId, fallbackImages } from 'common';
import { FlexCard, FlexCardContent } from 'components';
import { formatFirestoreTimestamp } from 'modules/utils';
import { Item } from './Item';

// TODO: replace items with TIV, etc. ?? instead of agency
// TODO: generate / use policy image

// TODO: use rxjs to get user profile for avatars
// const additionalInsureds = [
//   { img: 'http://i.pravatar.cc/300?img=3', name: 'John Doe', email: 'test1@user.com' },
//   { img: 'http://i.pravatar.cc/300?img=1', name: 'Jane Smith', email: 'test2@user.com' },
//   { img: 'http://i.pravatar.cc/300?img=4', name: 'Tim Jones', email: 'test3@user.com' },
// ];

const currentMS = new Date().getTime();

export interface PolicyCardProps {
  policy: WithId<Policy>;
  onClick?: (policyId: string) => void;
  i: number; // TODO: delete - temp for fallback img
}
export const PolicyCard = ({ policy, onClick = noop, i }: PolicyCardProps) => {
  // TODO: only use new Policy schema ??
  const location =
    policy.locations && typeof policy.locations === 'object' && !isEmpty(policy.locations)
      ? Object.values(policy.locations)[0]
      : policy;

  const activeLocationCount = Object.entries(policy.locations || {}).filter(
    ([id, lcn]) =>
      !lcn.cancelEffDate || (lcn.cancelEffDate && lcn.cancelEffDate.toMillis() > currentMS)
  ).length;

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
      <CardActionArea onClick={() => onClick(policy.id)}>
        <CardMedia
          sx={{ height: 140 }}
          // TODO: create policy images
          image={fallbackImages[i] || fallbackImages[0]}
          // @ts-ignore
          title={`policy cover image`}
        />
        <FlexCardContent sx={{ policy: 5 }}>
          <Typography fontWeight={900} fontSize={24}>
            {/* @ts-ignore */}
            {location?.address?.addressLine1}
          </Typography>
          <Item
            label='Named Insured'
            value={`${policy.namedInsured?.displayName}`}
            // value={`${policy.namedInsured?.firstName || 'John'} ${
            //   policy.namedInsured?.lastName || 'Doe'
            // }`}
          />
          <Item label='Agent' value={policy.agent.name ?? 'iDemand'} />
          <Item label='Agency' value={policy.agency.name ?? 'iDemand Insurance Agency, Inc.'} />
          <Item
            label='Effective'
            value={`${formatFirestoreTimestamp(
              policy.effectiveDate,
              'date'
            )} - ${formatFirestoreTimestamp(policy.expirationDate, 'date')}`}
          />
          <Item label='# locations' value={`${activeLocationCount}`} />
          <Divider light sx={{ my: { xs: 3, md: 4 } }} />
          <AvatarGroup max={4} sx={{ justifyContent: 'flex-end' }}>
            {policy.namedInsured ? (
              <Tooltip title={`${policy.namedInsured.displayName}`} key={policy.namedInsured.email}>
                {/* <Avatar src={f.img} alt={policy.namedInsured.firstName} /> */}
                <Avatar alt={`${policy.namedInsured.displayName}`} />
              </Tooltip>
            ) : null}
          </AvatarGroup>
        </FlexCardContent>
      </CardActionArea>
    </FlexCard>
  );
};
