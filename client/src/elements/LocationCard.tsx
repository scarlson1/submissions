import {
  Avatar,
  AvatarGroup,
  Box,
  CardActionArea,
  CardMedia,
  Divider,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { noop } from 'lodash';

import { FlexCard, FlexCardContent } from 'components';
import { dollarFormat, formatFirestoreTimestamp } from 'modules/utils';
import { Item } from 'views';
import { Policy, PolicyLocation, fallbackImages } from 'common';
import { FlexCardContentWrapper } from 'components/FlexCard';

export interface LocationCardProps {
  location: PolicyLocation;
  namedInsured: Policy['namedInsured'];
  // agent: Policy['agent'];
  // agency: Policy['agency'];
  handleClick?: (id: string) => void;
}

export const LocationCard = ({
  location,
  namedInsured,
  // agent,
  // agency,
  handleClick = noop,
}: LocationCardProps) => {
  const theme = useTheme();

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
      <CardActionArea onClick={() => handleClick(location.locationId)} sx={{ height: '100%' }}>
        <FlexCardContentWrapper>
          <CardMedia
            sx={{ height: 140, flex: '0 0 auto' }}
            // TODO: get random fallback img
            image={
              (theme.palette.mode === 'dark'
                ? location.imageURLs?.dark
                : location.imageURLs?.light) || fallbackImages[0]
            }
            // @ts-ignore
            title={`${location?.address?.addressLine1} map`}
          />
          <FlexCardContent sx={{ p: 5 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
              }}
            >
              <Box>
                <Typography fontWeight={900} fontSize={24}>
                  {/* @ts-ignore */}
                  {location?.address?.addressLine1}
                </Typography>
                {/* <Item
            label='Named Insured'
            value={`${namedInsured?.displayName}`}
            // value={`${p.namedInsured?.firstName || 'John'} ${
            //   p.namedInsured?.lastName || 'Doe'
            // }`}
          />
           <Item label='Agent' value={agent.name ?? 'iDemand'} />
          <Item label='Agency' value={agency.name ?? 'iDemand Insurance Agency, Inc.'} /> */}
                <Item label='Building' value={`${dollarFormat(location.limits.limitA || 0)}`} />
                <Item
                  label="Add'l Structures"
                  value={`${dollarFormat(location.limits.limitB || 0)}`}
                />
                <Item label='Contents' value={`${dollarFormat(location.limits.limitC || 0)}`} />
                <Item label='BI' value={`${dollarFormat(location.limits.limitD || 0)}`} />
                <Item
                  label='Effective'
                  value={`${formatFirestoreTimestamp(
                    location.effectiveDate,
                    'date'
                  )} - ${formatFirestoreTimestamp(location.expirationDate, 'date')}`}
                />
              </Box>
              <Box>
                <Divider light sx={{ my: { xs: 3, md: 4 } }} />
                <AvatarGroup max={4} sx={{ justifyContent: 'flex-end' }}>
                  {namedInsured ? (
                    <Tooltip
                      // title={`${p.namedInsured.firstName} ${p.namedInsured.lastName}`}
                      title={`${namedInsured.displayName}`}
                      key={namedInsured.email}
                    >
                      {/* <Avatar src={f.img} alt={p.namedInsured.firstName} /> */}
                      <Avatar alt={`${namedInsured.displayName}`} />
                    </Tooltip>
                  ) : null}
                  {location?.additionalInsureds?.length
                    ? location.additionalInsureds.map((f, i) => (
                        <Tooltip
                          // title={`${f?.firstName} ${f.lastName}`}
                          title={`${f?.name}`}
                          key={`${f.email}-${i}`}
                        >
                          {/* <Avatar src={f.img} alt={f.name} /> */}
                          <Avatar alt={`${f.email}-${i}`} />
                        </Tooltip>
                      ))
                    : null}
                </AvatarGroup>
              </Box>
            </Box>
          </FlexCardContent>
        </FlexCardContentWrapper>
      </CardActionArea>
    </FlexCard>
  );
};
