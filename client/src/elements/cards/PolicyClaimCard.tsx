import type { PolicyClaim, WithId } from '@idemand/common';
import {
  Avatar,
  AvatarGroup,
  Box,
  CardActionArea,
  CardMedia,
  Divider,
  Link,
  Tooltip,
  Typography,
} from '@mui/material';
import { FlexCard } from 'components';
import { FlexCardContentWrapper } from 'components/FlexCard';
import { noop } from 'lodash';
import { formatFirestoreTimestamp } from 'modules/utils';
import { Link as RouterLink } from 'react-router-dom';
import { createPath, ROUTES } from 'router';
import { Item } from './Item';

export interface PolicyClaimCardProps {
  claim: WithId<PolicyClaim>;
  onClick?: (policyId: string, claimId: string) => void;
}

export const PolicyClaimCard = ({
  claim,
  onClick = noop,
}: PolicyClaimCardProps) => {
  return (
    <FlexCard>
      <FlexCardContentWrapper>
        <CardMedia />
        <CardActionArea
          onClick={() => onClick(claim.policyId, claim.id)}
          sx={{ flex: '1 0 auto' }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'nowrap',
              alignItems: 'center',
            }}
          >
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
              {claim.address?.addressLine1 || '[Address unavailable]'}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 0 auto' }}>
            <Item
              label='Named Insured'
              value={`${claim.namedInsured?.displayName || '--'}`}
            />
            <Item label='Agent' value={claim.agent?.name ?? 'Unavailable'} />
            <Item label='Agency' value={claim.agency?.name ?? 'Unavailable'} />
            <Item
              label='Occurrence'
              value={`${formatFirestoreTimestamp(claim.occurrenceDate, 'date')}`}
            />
            <Item
              label='Policy'
              value={
                <Link
                  component={RouterLink}
                  to={createPath({
                    path: ROUTES.POLICY,
                    params: { policyId: claim.policyId },
                  })}
                  underline='hover'
                >
                  {claim.policyId}
                </Link>
              }
            />
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
              {claim.namedInsured ? (
                <Tooltip
                  title={`${claim.namedInsured.displayName}`}
                  key={claim.namedInsured.email}
                >
                  {/* <Avatar src={f.img} alt={claim.namedInsured.firstName} /> */}
                  <Avatar
                    alt={`${claim.namedInsured.displayName}`}
                    sx={{
                      width: { xs: 30, md: 36 },
                      height: { xs: 30, md: 36 },
                    }}
                  />
                </Tooltip>
              ) : null}
            </AvatarGroup>
          </Box>
        </CardActionArea>
      </FlexCardContentWrapper>
    </FlexCard>
  );
};
