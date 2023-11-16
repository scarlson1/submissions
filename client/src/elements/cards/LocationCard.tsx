import { EditRounded } from '@mui/icons-material';
import {
  Avatar,
  AvatarGroup,
  Box,
  CardActionArea,
  CardMedia,
  Divider,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { noop } from 'lodash';
import { useCallback } from 'react';

import { ILocation, Policy, WithId, fallbackImages } from 'common';
import { FlexCard, FlexCardContent } from 'components';
import { FlexCardContentWrapper } from 'components/FlexCard';
import { dollarFormat, formatFirestoreTimestamp } from 'modules/utils';
import { Item } from 'views';

// TODO: use <CardActions disableSpacing> for avatar

export interface LocationCardProps {
  location: WithId<ILocation>;
  namedInsured: Policy['namedInsured'];
  handleClick?: (id: string) => void;
  // policyId: string;
  onEdit?: (location: WithId<ILocation>) => void;
}

export const LocationCard = ({
  location,
  namedInsured,
  handleClick = noop,
  // policyId,
  onEdit,
}: LocationCardProps) => {
  const theme = useTheme();

  const handleEdit = useCallback(() => {
    onEdit && onEdit(location);
  }, [onEdit, location]);

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
      {/* <CardActionArea onClick={() => handleClick(location.locationId)} sx={{ height: '100%' }}> */}
      <FlexCardContentWrapper>
        <CardMedia
          sx={{ height: 140, flex: '0 0 auto', position: 'relative' }}
          // TODO: get random fallback img
          image={
            (theme.palette.mode === 'dark'
              ? location.imageURLs?.dark
              : location.imageURLs?.light) || fallbackImages[0]
          }
          title={`${location?.address?.addressLine1} map`}
          // component={
          //   <BlurrableImg
          //     img={location.imageURLs?.light || fallbackImages[0]}
          //     blurDataUrl={`LEHV6nWB2yk8pyo0adR*.7kCMdnj`}
          //   />
          // }
        >
          {onEdit ? (
            <Tooltip title='location change request'>
              <IconButton
                size='small'
                edge='end'
                aria-label='location change request'
                sx={{ position: 'absolute', top: 10, right: 10 }}
                onClick={handleEdit}
              >
                <EditRounded fontSize='inherit' />
              </IconButton>
            </Tooltip>
          ) : null}
        </CardMedia>
        <CardActionArea onClick={() => handleClick(location.locationId)} sx={{ height: '100%' }}>
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
                  {location?.address?.addressLine1}
                </Typography>
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
                    <Tooltip title={`${namedInsured.displayName}`} key={namedInsured.email}>
                      {/* <Avatar src={f.img} alt={p.namedInsured.firstName} /> */}
                      <Avatar alt={namedInsured.displayName || 'i d'} />
                    </Tooltip>
                  ) : null}
                  {location?.additionalInsureds?.length
                    ? location.additionalInsureds.map((f, i) => (
                        <Tooltip title={`${f?.name}`} key={`${f.email}-${i}`}>
                          {/* <Avatar src={f.img} alt={f.name} />  */}
                          <Avatar alt={`${f.email}-${i}`} />
                        </Tooltip>
                      ))
                    : null}
                </AvatarGroup>
              </Box>
            </Box>
          </FlexCardContent>
        </CardActionArea>
      </FlexCardContentWrapper>
    </FlexCard>
  );
};
