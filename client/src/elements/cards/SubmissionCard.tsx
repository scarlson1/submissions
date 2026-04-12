import { ExpandMoreRounded } from '@mui/icons-material';
import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Collapse,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';

import type { WithId } from '@idemand/common';
import { fallbackImages, Submission } from 'common';
import {
  dollarFormat,
  formatFirestoreTimestamp,
  numberFormat,
} from 'modules/utils';
import { Link } from 'react-router-dom';
import { createPath, ROUTES } from 'router';
import { Item } from '.';
import { ExpandMoreButton } from './ExpandMoreButton';

export function SubmissionCard({
  submission: s,
}: {
  submission: WithId<Submission>;
}) {
  const [expanded, setExpanded] = useState<boolean>(false);

  const handleExpandClick = useCallback(() => {
    setExpanded((expanded) => !expanded);
  }, []);

  return (
    <Card
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
      <CardActionArea
        component={Link}
        to={createPath({
          path: ROUTES.SUBMISSION_VIEW,
          params: { submissionId: s.id },
        })}
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
          <Item
            label='Building Coverage'
            value={dollarFormat(s.limits?.limitA)}
          />
          <Item
            label='Other Structures Coverage'
            value={dollarFormat(s.limits?.limitB)}
          />
          <Item
            label='Contents Coverage'
            value={dollarFormat(s.limits?.limitC)}
          />
          <Item
            label='Additional Expenses Coverage'
            value={dollarFormat(s.limits?.limitD)}
          />
          <Item
            label='Submitted'
            value={formatFirestoreTimestamp(s.metadata.created)}
            containerSx={{ pt: 2 }}
          />
        </CardContent>
      </CardActionArea>
      <CardActions
        disableSpacing
        sx={{ borderTop: (theme) => `1px solid ${theme.vars.palette.divider}` }}
      >
        <Chip size='small' label={s.status} />
        <ExpandMoreButton
          // expand={Boolean(expanded && !!expanded[s.id])}
          expand={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label='show more'
          size='small'
        >
          <ExpandMoreRounded fontSize='inherit' />
        </ExpandMoreButton>
      </CardActions>
      <Collapse in={expanded} timeout='auto' unmountOnExit>
        <CardContent>
          <Item
            label='Submitted by'
            value={`${s.contact?.firstName} ${s.contact?.lastName}`}
          />
          <Item label='Email' value={s.contact?.email} />
          <Item
            label='Year built'
            value={s.ratingPropertyData?.yearBuilt?.toString() || '--'}
            containerSx={{ pt: 2 }}
          />
          <Item
            label='# Stories'
            value={s.ratingPropertyData?.numStories?.toString() || '--'}
          />
          <Item
            label='Square Footage'
            value={
              s.ratingPropertyData?.sqFootage
                ? numberFormat(s.ratingPropertyData?.sqFootage)
                : '--'
            }
          />
          <Item
            label='Basement'
            value={s.ratingPropertyData?.basement ?? '--'}
          />
          <Item
            label='Flood Zone'
            value={s.ratingPropertyData?.floodZone ?? '--'}
          />
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
