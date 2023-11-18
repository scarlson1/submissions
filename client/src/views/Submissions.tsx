import { Button, Card } from '@mui/material';
import { User } from 'firebase/auth';
import { QueryFieldFilterConstraint, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import invariant from 'tiny-invariant';

import { GridViewRounded, MapRounded, TableRowsRounded } from '@mui/icons-material';
import { COLLECTIONS, VIEW_QUERY_KEY } from 'common';
import { ToggleViewLayout, ToggleViewPanel } from 'components/toggleView';
import { SubmissionCards } from 'elements/cards';
import { SubmissionsGrid } from 'elements/grids';
import { SubmissionsMap } from 'elements/maps';
import { DataViewType, TDataViewType, useClaims, useWidth } from 'hooks';
import { ROUTES, createPath } from 'router';
import { AdminSubmissionsGrid } from './admin/AdminSubmissionsGrid';

function getQueryProps(
  user: User,
  claims: {
    iDemandAdmin: boolean;
    orgAdmin: boolean;
    agent: boolean;
  }
): { constraints: QueryFieldFilterConstraint[] } {
  let props: { constraints: QueryFieldFilterConstraint[] } = { constraints: [] };
  if (claims?.iDemandAdmin) {
    props = {
      constraints: [],
    };
  } else if (claims?.orgAdmin && user.tenantId) {
    props = {
      // TODO: uncomment once verifying org ID is set on all quotes
      // constraints: [where('agency.orgId', '==', `${user.tenantId}`)],
      constraints: [where('agent.userId', '==', `${user?.uid}`)],
    };
  } else if (claims?.agent) {
    props = {
      constraints: [where('agent.userId', '==', `${user?.uid}`)],
    };
  } else {
    props = {
      constraints: [where('userId', '==', user.uid)],
    };
  }
  return props;
}

export const Submissions = () => {
  const navigate = useNavigate();
  const { claims, user } = useClaims();
  invariant(user);
  const { isMobile } = useWidth();

  const queryProps = useMemo(() => getQueryProps(user, claims), [user, claims]);

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
      isFetchingOptions={{ queryKey: [`infinite-${COLLECTIONS.SUBMISSIONS}`] }}
      actions={
        <Button
          onClick={() =>
            navigate(createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } }))
          }
          size='small'
          sx={{ maxHeight: 36 }}
        >
          {isMobile ? 'New' : 'New Submission'}
        </Button>
      }
      headerContainerSx={{ pb: { xs: 2, sm: 3, lg: 4 } }}
    >
      <ToggleViewPanel value={DataViewType.Enum.cards}>
        <SubmissionCards {...queryProps} />
      </ToggleViewPanel>
      <ToggleViewPanel value={DataViewType.Enum.grid}>
        {claims?.iDemandAdmin ? <AdminSubmissionsGrid /> : <SubmissionsGrid {...queryProps} />}
      </ToggleViewPanel>
      <ToggleViewPanel value={DataViewType.Enum.map}>
        <Card sx={{ height: { xs: 300, sm: 400, md: 460, lg: 500 }, width: '100%' }}>
          <SubmissionsMap {...queryProps} />
        </Card>
      </ToggleViewPanel>
    </ToggleViewLayout>
  );
};
