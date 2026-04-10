import {
  DataObjectRounded,
  ThumbDownRounded,
  ThumbUpRounded,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Badge,
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  GridActionsCellItem,
  GridActionsColDef,
  gridRowSelectionStateSelector,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarFilterButton,
  useGridApiContext,
} from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';

import { Collection } from '@idemand/common';
import { ImportSummary } from 'common';
import { IconMenu, ServerDataGrid } from 'components';
import { useAuth } from 'context';
import {
  useAsyncToast,
  useClaims,
  useDocData,
  useManageImports,
  useSafeParams,
  useShowJson,
  useWidth,
} from 'hooks';
import {
  policyStagingRecordCols,
  quoteStagingRecordCols,
  transactionStagingRecordCols,
} from 'modules/muiGrid/gridColumnDefs';

// TODO: admin grid actions (approve selected, etc.)
// TODO: action button top right of grid (custom toolbar) to approve/decline all

const ImportToolBar = ({
  handleDeclineImport,
  handleApproveImport,
  updateLoading,
  declineLoading,
}: any) => {
  // const { claims } = useAuth();
  const { claims } = useClaims();
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
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
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
                disabled={
                  !claims?.iDemandAdmin || updateLoading || declineLoading
                }
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
                disabled={
                  !claims?.iDemandAdmin || updateLoading || declineLoading
                }
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

export const ImportReviewComponent = ({
  importId,
  importType,
}: ImportReviewComponentProps) => {
  const { isMobile } = useWidth();
  const { claims } = useAuth();
  const toast = useAsyncToast({ id: 'import-toast', position: 'top-right' });
  const { handleApproveImport, handleDeclineImport, loading } =
    useManageImports(
      importId,
      (msg) => toast.success(msg),
      (msg) => toast.error(msg),
    );

  const showJson = useShowJson('dataImports', [
    importId,
    Collection.Enum.stagedDocs,
  ]);

  const handleShowJson = useCallback(
    (id: string) => () => showJson(id),
    [showJson],
  );

  const props = useMemo(() => {
    const actionsCol: GridActionsColDef = {
      field: 'actions',
      headerName: 'Actions',
      type: 'actions',
      width: isMobile ? 80 : 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip placement='top' title='approve'>
              <ThumbUpRounded />
            </Tooltip>
          }
          onClick={() => {
            toast.loading('importing records...');
            handleApproveImport([params.id.toString()]);
          }}
          label='Approve import'
          disabled={
            !claims?.iDemandAdmin || params.row.importMeta?.status !== 'new'
          }
          showInMenu={isMobile}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip placement='top' title='decline'>
              <ThumbDownRounded />
            </Tooltip>
          }
          onClick={() => {
            toast.loading('updating status...');
            handleDeclineImport([params.id.toString()]);
          }}
          label='Decline import'
          disabled={
            !claims?.iDemandAdmin || params.row.importMeta?.status !== 'new'
          }
          showInMenu={isMobile}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip placement='top' title='view JSON'>
              <DataObjectRounded />
            </Tooltip>
          }
          onClick={handleShowJson(params.id.toString())}
          label='Details'
          // disabled={!Boolean(claims?.iDemandAdmin)}
          showInMenu={isMobile}
        />,
      ],
    };
    switch (importType) {
      case Collection.Enum.policies:
        return {
          columns: [actionsCol, ...policyStagingRecordCols],
        };
      case Collection.Enum.transactions:
        return {
          columns: [actionsCol, ...transactionStagingRecordCols],
        };
      case Collection.Enum.quotes:
        return {
          columns: [actionsCol, ...quoteStagingRecordCols],
        };
      default:
        return {};
    }
  }, [
    importType,
    claims,
    isMobile,
    handleApproveImport,
    handleDeclineImport,
    handleShowJson,
    toast,
  ]);

  if (!props.columns) throw new Error('importType not matched');

  return (
    <Box>
      <ServerDataGrid
        colName='dataImports'
        pathSegments={[importId, Collection.Enum.stagedDocs]}
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
  const { data } = useDocData<ImportSummary>('dataImports', importId);

  return (
    <ImportReviewComponent
      importId={importId}
      importType={data.targetCollection}
    />
  );
};
