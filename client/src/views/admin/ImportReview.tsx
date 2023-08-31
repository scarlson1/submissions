import { Badge, Box, ListItemIcon, ListItemText, MenuItem, Tooltip } from '@mui/material';
import { useCallback, useMemo } from 'react';
import {
  GridActionsCellItem,
  GridActionsColDef,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarFilterButton,
  gridRowSelectionStateSelector,
  useGridApiContext,
} from '@mui/x-data-grid';
import { LoadingButton } from '@mui/lab';

import { COLLECTIONS, ImportSummary } from 'common';
import { useAsyncToast, useDocData, useManageImports, useSafeParams } from 'hooks';
import { IconMenu, ServerDataGrid } from 'components';
import {
  policyStagingRecordCols,
  quoteStagingRecordCols,
  transactionStagingRecordCols,
} from 'modules/muiGrid/gridColumnDefs';
import { useAuth } from 'context';
import { ThumbDownRounded, ThumbUpRounded } from '@mui/icons-material';

// TODO: admin grid actions (approve selected, etc.)
// TODO: action button top right of grid (custom toolbar) to approve/decline all

const ImportToolBar = ({
  handleDeclineImport,
  handleApproveImport,
  updateLoading,
  declineLoading,
}: any) => {
  const { claims } = useAuth();
  const apiRef = useGridApiContext();
  const selected = gridRowSelectionStateSelector(apiRef.current.state);

  const onApprove = useCallback(async () => {
    const val = selected.length ? selected : null;
    handleApproveImport(val);
  }, [selected, handleApproveImport]);

  const onDecline = useCallback(async () => {
    const val = selected.length ? selected : null;
    handleDeclineImport(val);
  }, [selected, handleDeclineImport]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box sx={{ flex: '1 1 auto' }}>
        <GridToolbarContainer sx={{ pt: 2.5 }}>
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
        </GridToolbarContainer>
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'block' }, flex: '0 0 auto' }}>
        <GridToolbarContainer sx={{ pt: 2.5, pr: 2.5 }}>
          <Badge badgeContent={selected.length} color='primary'>
            <LoadingButton
              onClick={onApprove}
              size='small'
              color='primary'
              variant='outlined'
              disabled={!claims?.iDemandAdmin || declineLoading}
              loading={updateLoading}
              startIcon={<ThumbUpRounded />}
            >
              {`Approve ${selected.length ? 'Selected' : 'All'}`}
            </LoadingButton>
          </Badge>
          <Badge badgeContent={selected.length} color='primary'>
            <LoadingButton
              onClick={onDecline}
              size='small'
              color='secondary'
              variant='outlined'
              disabled={!claims?.iDemandAdmin || updateLoading}
              loading={declineLoading}
              startIcon={<ThumbDownRounded />}
            >
              {`Decline ${selected.length ? 'Selected' : 'All'}`}
            </LoadingButton>
          </Badge>
        </GridToolbarContainer>
      </Box>
      <Box sx={{ display: { xs: 'block', md: 'none' }, flex: '0 0 auto' }}>
        <GridToolbarContainer sx={{ pt: 2.5, pr: 1.5 }}>
          <Badge badgeContent={selected.length} color='primary'>
            <IconMenu>
              <MenuItem
                onClick={onApprove}
                disabled={!claims?.iDemandAdmin || updateLoading || declineLoading}
                disableRipple
              >
                <ListItemIcon>
                  <ThumbUpRounded fontSize='small' />
                </ListItemIcon>
                <ListItemText>{`Approve ${selected.length ? 'Selected' : 'All'}`}</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={onDecline}
                divider
                disabled={!claims?.iDemandAdmin || updateLoading || declineLoading}
                disableRipple
              >
                <ListItemIcon>
                  <ThumbDownRounded fontSize='small' />
                </ListItemIcon>
                <ListItemText>{`Decline ${selected.length ? 'Selected' : 'All'}`}</ListItemText>
              </MenuItem>
            </IconMenu>
          </Badge>
        </GridToolbarContainer>
      </Box>
    </Box>
  );
};

interface ImportReviewComponentProps {
  importId: string;
  importType: string;
}

export const ImportReviewComponent = ({ importId, importType }: ImportReviewComponentProps) => {
  const { claims } = useAuth();
  const toast = useAsyncToast();
  const { handleApproveImport, handleDeclineImport, loading } = useManageImports(
    importId,
    (msg) => toast.success(msg),
    (msg) => toast.error(msg)
  );

  const props = useMemo(() => {
    const actionsCol: GridActionsColDef = {
      field: 'actions',
      headerName: 'Actions',
      type: 'actions',
      width: 80,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip placement='top' title='approve'>
              <ThumbUpRounded />
            </Tooltip>
          }
          onClick={() => handleApproveImport([params.id.toString()])}
          label='Approve import'
          disabled={!claims?.iDemandAdmin || params.row.importMeta?.status !== 'new'}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip placement='top' title='decline'>
              <ThumbDownRounded />
            </Tooltip>
          }
          onClick={() => handleDeclineImport([params.id.toString()])}
          label='Decline import'
          disabled={!claims?.iDemandAdmin || params.row.importMeta?.status !== 'new'}
        />,
      ],
    };
    switch (importType) {
      case COLLECTIONS.POLICIES:
        return {
          columns: [actionsCol, ...policyStagingRecordCols],
        };
      case COLLECTIONS.TRANSACTIONS:
        return {
          columns: [actionsCol, ...transactionStagingRecordCols],
        };
      case COLLECTIONS.QUOTES:
        return {
          columns: [actionsCol, ...quoteStagingRecordCols],
        };
      default:
        return {};
    }
  }, [importType, claims, handleApproveImport, handleDeclineImport]);

  if (!props.columns) throw new Error('importType not matched');

  return (
    <Box>
      <ServerDataGrid
        collName='DATA_IMPORTS'
        pathSegments={[importId, COLLECTIONS.STAGED_RECORDS]}
        checkboxSelection
        slots={{
          toolbar: ImportToolBar,
        }}
        slotProps={{
          toolbar: {
            handleApproveImport,
            handleDeclineImport,
            approvalLoading: loading.approve,
            declineLoading: loading.decline,
          },
        }}
        initialState={{
          columns: {
            columnVisibilityModel: {
              'importMeta.reviewBy.userId': false,
            },
          },
        }}
        {...props}
      />
    </Box>
  );
};

// fetch import review doc by id, so we know the import type
export const ImportReview = () => {
  const { importId } = useSafeParams(['importId']);
  const { data } = useDocData<ImportSummary>('DATA_IMPORTS', importId);

  return <ImportReviewComponent importId={importId} importType={data.importCollection} />;
};
