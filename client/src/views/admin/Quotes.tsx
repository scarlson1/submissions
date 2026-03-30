import {
  EditRounded,
  InfoRounded,
  OpenInNewRounded,
  VisibilityRounded,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Collapse,
  Link,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { UploadResult } from 'firebase/storage';
import { camelCase } from 'lodash';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import {
  CLAIMS,
  PORTFOLIO_RATING_REQUIRED_HEADERS,
  Quote,
  QUOTE_IMPORT_REQUIRED_HEADERS,
  QUOTE_STATUS,
  StorageFolder,
  TStorageFolder,
} from 'common';
import { DownloadStorageFileButton } from 'components';
import { IconMenu } from 'components/IconButtonMenu';
import { CSVUploadDialog } from 'elements';
import { QuotesGrid } from 'elements/grids';
import {
  useAsyncToast,
  useConfirmAndUpdate,
  useGridShowJson,
  useWidth,
} from 'hooks';
import {
  submissionIdCol,
  subproducerCommissionCol,
} from 'modules/muiGrid/gridColumnDefs';
import { getDuplicates } from 'modules/utils';
import { getCsvHeaderStatus } from 'modules/utils/storage';
import { ADMIN_ROUTES, createPath, ROUTES } from 'router';

const getChangeMsg = (newRow: Quote, oldRow: Quote) => {
  return newRow.status !== oldRow.status
    ? [`"status" from ${oldRow.status} to ${newRow.status}`]
    : null;
};
const getUpdateValues = (newRow: Quote) => {
  return { status: newRow.status };
};

export const Quotes = () => {
  const navigate = useNavigate();
  const confirmAndUpdate = useConfirmAndUpdate<Quote>(
    'quotes',
    getUpdateValues,
    getChangeMsg,
  );
  const renderShowJson = useGridShowJson(
    'quotes',
    { showInMenu: true },
    { requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } },
  );
  const { isMobile } = useWidth();

  const editQuote = useCallback(
    (params: GridRowParams) => () => {
      let status = params.row.status;
      if (
        !(
          status === QUOTE_STATUS.AWAITING_USER || status === QUOTE_STATUS.DRAFT
        )
      )
        return toast.error(
          `status must be ${QUOTE_STATUS.AWAITING_USER} or ${QUOTE_STATUS.DRAFT} to edit`,
        );

      navigate(
        createPath({
          path: ADMIN_ROUTES.QUOTE_EDIT,
          params: {
            productId: params.row.product,
            quoteId: params.id.toString(),
          },
        }),
      );
    },
    [navigate],
  );

  const handleProcessRowUpdateError = useCallback((err: Error) => {
    toast.error('update failed');
    console.log('ERROR: ', err);
  }, []);

  const showDetails = useCallback(
    (params: GridRowParams) => () =>
      navigate(
        createPath({
          path: ROUTES.QUOTE_VIEW,
          params: { quoteId: params.id.toString() },
        }),
      ),
    [navigate],
  );

  const renderActions = useCallback(
    (params: GridRowParams) => [
      <GridActionsCellItem
        icon={
          <Tooltip placement='top' title='Edit'>
            <EditRounded />
          </Tooltip>
        }
        onClick={editQuote(params)}
        label='Edit'
        disabled={params.row.status !== QUOTE_STATUS.AWAITING_USER}
        showInMenu={isMobile}
      />,
      <GridActionsCellItem
        icon={
          <Tooltip placement='top' title='view quote'>
            <VisibilityRounded />
          </Tooltip>
        }
        onClick={showDetails(params)}
        label='Details'
        showInMenu={isMobile}
      />,
      ...renderShowJson(params),
    ],
    [editQuote, showDetails, renderShowJson, isMobile],
  );

  return (
    <QuotesGrid
      renderActions={renderActions}
      additionalColumns={[submissionIdCol, subproducerCommissionCol]}
      density='compact'
      processRowUpdate={confirmAndUpdate}
      onProcessRowUpdateError={handleProcessRowUpdateError}
    />
  );
};

// Required to get around dialog unmounting when icon menu closes
export function AdminQuotesActionMenu() {
  const navigate = useNavigate();
  const toast = useAsyncToast({ position: 'top-right', duration: 2400 });
  const [open, setOpen] = useState<TStorageFolder | null>(null);
  const [dupHeaders, setDupHeaders] = useState<string[]>([]);

  const handleOpen = useCallback(
    (val: TStorageFolder) => () => setOpen(val),
    [],
  );
  const handleClose = useCallback(() => {
    setOpen(null);
    setDupHeaders([]);
  }, []);

  const checkForDuplicates = useCallback(
    (headers: string[], formatFn: (str: string) => string) => {
      let formatted = headers.map((h) => formatFn(h));
      setDupHeaders(getDuplicates(formatted));
    },
    [],
  );

  const handleHeaderStatus = useCallback(
    (requiredHeaders: string[], formatFn: (str: string) => string) =>
      (headers: string[]) => {
        checkForDuplicates(headers, formatFn);
        return getCsvHeaderStatus(headers, requiredHeaders, formatFn);
      },
    [checkForDuplicates],
  );

  const onSuccess = useCallback(
    (uploadResult: UploadResult[]) => {
      console.log('upload result: ', uploadResult);
      toast.success("you'll receive an email once complete", {
        duration: 2000,
        position: 'top-right',
        icon: <InfoRounded />,
      });
    },
    [toast],
  );

  return (
    <Box>
      <IconMenu>
        <MenuItem
          onClick={() =>
            navigate(
              createPath({
                path: ADMIN_ROUTES.QUOTE_NEW_BLANK,
                params: { productId: 'flood' },
              }),
            )
          }
        >
          New Quote
        </MenuItem>
        <MenuItem onClick={handleOpen('ratePortfolio')}>
          Rate Portfolio
        </MenuItem>
        <MenuItem onClick={handleOpen('importQuotes')}>Import Quotes</MenuItem>
      </IconMenu>
      <CSVUploadDialog
        open={open === 'ratePortfolio'}
        onClose={handleClose}
        destinationFolder={StorageFolder.enum.ratePortfolio}
        getCsvHeaderStatus={handleHeaderStatus(
          PORTFOLIO_RATING_REQUIRED_HEADERS,
          camelCase,
        )}
        onSuccess={onSuccess}
        // title='Rate Portfolio'
        title={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='h6'>Rate Portfolio</Typography>
            <DownloadStorageFileButton filePath='public/ratePortfolioTemplate.csv'>
              Download template
            </DownloadStorageFileButton>
          </Box>
        }
      >
        <Typography variant='body2' color='text.secondary' component='div'>
          Headers will be transformed to{' '}
          <Link
            href='https://lodash.com/docs/4.17.15#camelCase'
            target='_blank'
            rel='noopener'
          >
            camel case <OpenInNewRounded sx={{ fontSize: 16 }} />
          </Link>
          {`. (ex: "CovA limit" → "cov_a_limit")`}
        </Typography>
        <Collapse in={dupHeaders.length > 0}>
          <Alert severity='warning'>
            <AlertTitle>Duplicate headers detected</AlertTitle>
            {dupHeaders.join(', ')}
          </Alert>
        </Collapse>
      </CSVUploadDialog>
      <CSVUploadDialog
        open={open === 'importQuotes'}
        onClose={handleClose}
        destinationFolder={StorageFolder.enum.importQuotes}
        getCsvHeaderStatus={handleHeaderStatus(
          QUOTE_IMPORT_REQUIRED_HEADERS,
          camelCase,
        )}
        onSuccess={onSuccess}
        // title='Import Quotes'
        title={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='h6'>Import Quotes</Typography>
            <DownloadStorageFileButton filePath='public/quoteImportTemplate.csv'>
              Download template
            </DownloadStorageFileButton>
          </Box>
        }
      >
        <Typography variant='body2' color='text.secondary' component='div'>
          Headers will be transformed to{' '}
          <Link
            href='https://lodash.com/docs/4.17.15#camelCase'
            target='_blank'
            rel='noopener'
          >
            camel case <OpenInNewRounded sx={{ fontSize: 16 }} />
          </Link>
          {`. (ex: "cov_a limit" → "covALimit")`}
        </Typography>
        <Collapse in={dupHeaders.length > 0}>
          <Alert severity='warning'>
            <AlertTitle>Duplicate headers detected</AlertTitle>
            {dupHeaders.join(', ')}
          </Alert>
        </Collapse>
      </CSVUploadDialog>
    </Box>
  );
}
