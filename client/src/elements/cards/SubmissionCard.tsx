import { ExpandMoreRounded } from '@mui/icons-material';
import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Collapse,
  IconButton,
  IconButtonProps,
  Typography,
  styled,
} from '@mui/material';
import { useCallback, useState } from 'react';

import { Submission, WithId, fallbackImages } from 'common';
import { dollarFormat, formatFirestoreTimestamp, numberFormat } from 'modules/utils';
import { Item } from '.';

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

export function SubmissionCard({ submission: s }: { submission: WithId<Submission> }) {
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
        <Item label='Building Coverage' value={dollarFormat(s.limits?.limitA)} />
        <Item label='Other Structures Coverage' value={dollarFormat(s.limits?.limitB)} />
        <Item label='Contents Coverage' value={dollarFormat(s.limits?.limitC)} />
        <Item label='Additional Expenses Coverage' value={dollarFormat(s.limits?.limitD)} />
        <Item
          label='Submitted'
          value={formatFirestoreTimestamp(s.metadata.created)}
          containerSx={{ pt: 2 }}
        />
      </CardContent>
      <CardActions
        disableSpacing
        sx={{ borderTop: (theme) => `1px solid ${theme.vars.palette.divider}` }}
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
          <Item label='Submitted by' value={`${s.contact?.firstName} ${s.contact?.lastName}`} />
          <Item label='Email' value={s.contact?.email} />
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
