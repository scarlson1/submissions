import {
  GridViewRounded,
  MapRounded,
  TableRowsRounded,
} from '@mui/icons-material';
import { alpha, Button, Card, type Theme } from '@mui/material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import invariant from 'tiny-invariant';

import { Collection } from '@idemand/common';
import { VIEW_QUERY_KEY } from 'common';
import { ToggleViewLayout, ToggleViewPanel } from 'components/toggleView';
import { SubmissionCards } from 'elements/cards';
import { SubmissionsGrid } from 'elements/grids';
import { SubmissionsMap } from 'elements/maps';
import { DataViewType, TDataViewType, useClaims, useWidth } from 'hooks';
import { getSubmissionQueryProps } from 'modules/db/query';
import { createPath, ROUTES } from 'router';
import { AdminSubmissionsGrid } from './admin/AdminSubmissionsGrid';

export const Submissions = () => {
  const navigate = useNavigate();
  const { claims, user } = useClaims();
  invariant(user);
  const { isMobile } = useWidth();

  const queryProps = useMemo(
    () => getSubmissionQueryProps(user, claims),
    [user, claims],
  );

  return (
    <ToggleViewLayout<TDataViewType>
      title='Submissions'
      queryKey={VIEW_QUERY_KEY}
      options={DataViewType.options}
      defaultOption='cards'
      icons={{
        cards: <GridViewRounded />,
        grid: <TableRowsRounded />,
        map: <MapRounded />,
      }}
      isFetchingOptions={{
        queryKey: [`infinite-${Collection.Enum.submissions}`],
      }}
      actions={
        <Button
          onClick={() =>
            navigate(
              createPath({
                path: ROUTES.SUBMISSION_NEW,
                params: { productId: 'flood' },
              }),
            )
          }
          size='small'
          sx={{ maxHeight: 36 }}
        >
          {isMobile ? 'New' : 'New Submission'}
        </Button>
      }
      headerContainerSx={{
        pb: { xs: 2, sm: 3, lg: 4 },
        position: 'sticky',
        top: 10,
        zIndex: 1,
        pt: { xs: 2, sm: 3 },
        // bgcolor: 'background.default',
        backgroundColor: (theme) =>
          alpha((theme as Theme).palette.background.default, 0.75),
        borderRadius: 1,
        backdropFilter: 'blur(10px)',
      }}
    >
      <ToggleViewPanel value={DataViewType.Enum.cards}>
        <SubmissionCards {...queryProps} />
      </ToggleViewPanel>
      <ToggleViewPanel value={DataViewType.Enum.grid}>
        {claims?.iDemandAdmin ? (
          <AdminSubmissionsGrid />
        ) : (
          <SubmissionsGrid {...queryProps} />
        )}
      </ToggleViewPanel>
      <ToggleViewPanel value={DataViewType.Enum.map}>
        <Card
          sx={{ height: { xs: 300, sm: 400, md: 460, lg: 500 }, width: '100%' }}
        >
          <SubmissionsMap {...queryProps} />
        </Card>
      </ToggleViewPanel>
    </ToggleViewLayout>
  );
};
