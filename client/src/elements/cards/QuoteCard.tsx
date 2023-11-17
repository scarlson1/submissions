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

import { Quote, WithId, fallbackImages } from 'common';
import { FlexCard } from 'components';
import { FlexCardContent, FlexCardContentWrapper } from 'components/FlexCard';
import { dollarFormat } from 'modules/utils';
import { Item } from '.';

export interface QuoteCardProps {
  data: WithId<Quote>;
  onClick?: (id: string) => void;
}

export function QuoteCard({ data, onClick = noop }: QuoteCardProps) {
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
      <FlexCardContentWrapper>
        <CardMedia
          sx={{ height: 140, flex: '0 0 auto', position: 'relative' }}
          // TODO: get random fallback img
          image={
            (theme.palette.mode === 'dark' ? data.imageURLs?.dark : data.imageURLs?.light) ||
            fallbackImages[0]
          }
          title={`${data?.address?.addressLine1} map`}
        />
        <CardActionArea onClick={() => onClick(data.id)} sx={{ flex: '1 0 auto' }}>
          <FlexCardContent sx={{ height: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
              }}
            >
              <Box sx={{ flex: '1 0 auto' }}>
                <Typography fontWeight={900} fontSize={24}>
                  {data?.address?.addressLine1}
                </Typography>
                <Item label='Building' value={`${dollarFormat(data?.limits?.limitA || 0)}`} />
                <Item
                  label="Add'l Structures"
                  value={`${dollarFormat(data?.limits?.limitB || 0)}`}
                />
                <Item label='Contents' value={`${dollarFormat(data?.limits?.limitC || 0)}`} />
                <Item label='BI' value={`${dollarFormat(data?.limits?.limitD || 0)}`} />
              </Box>
              <Box>
                <Divider light sx={{ my: { xs: 3, md: 4 } }} />
                <AvatarGroup max={4} sx={{ justifyContent: 'flex-end' }}>
                  {data.namedInsured ? (
                    <Tooltip
                      title={`${data?.namedInsured?.firstName}`}
                      key={data?.namedInsured?.email}
                    >
                      <Avatar
                        alt={data?.namedInsured?.firstName || 'i d'}
                        sx={{
                          width: { xs: 30, sm: 36, md: 40 },
                          height: { xs: 30, sm: 36, md: 40 },
                        }}
                      />
                    </Tooltip>
                  ) : null}
                  {data?.additionalInterests?.length
                    ? data.additionalInterests.map((f, i) => (
                        <Tooltip title={`${f?.name}`} key={`${f.email}-${i}`}>
                          <Avatar
                            alt={`${f.email}-${i}`}
                            sx={{
                              width: { xs: 30, sm: 36, md: 40 },
                              height: { xs: 30, sm: 36, md: 40 },
                            }}
                          />
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
}
