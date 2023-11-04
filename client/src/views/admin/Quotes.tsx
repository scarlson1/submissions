import { EditRounded, InfoRounded, OpenInNewRounded, VisibilityRounded } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  Link,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { GridActionsCellItem, GridRowModel, GridRowParams } from '@mui/x-data-grid';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UploadResult } from 'firebase/storage';
import { camelCase, snakeCase } from 'lodash';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from 'reactfire';

import {
  CLAIMS,
  COLLECTIONS,
  PORTFOLIO_RATING_REQUIRED_HEADERS,
  QUOTE_IMPORT_REQUIRED_HEADERS,
  QUOTE_STATUS,
  Quote,
  StorageFolder,
  TStorageFolder,
  WithId,
  quotesCollection,
} from 'common';
import { quoteConverter } from 'common/firestoreConverters';
import { IconMenu } from 'components/IconButtonMenu';
import { useConfirmation } from 'context';
import { CSVUploadDialog } from 'elements';
import { QuotesGrid } from 'elements/grids';
import { useAsyncToast, useGridShowJson, useWidth } from 'hooks';
import { submissionIdCol, subproducerCommissionCol } from 'modules/muiGrid/gridColumnDefs';
import { getDuplicates } from 'modules/utils';
import { getCsvHeaderStatus } from 'modules/utils/storage';
import { ADMIN_ROUTES, ROUTES, createPath } from 'router';

const useUpdateQuoteStatus = () => {
  const firestore = useFirestore();

  const update = useCallback(
    async (id: string, updateValues: Partial<Quote>) => {
      const ref = doc(quotesCollection(firestore), id).withConverter(quoteConverter);
      await updateDoc(ref, { status: updateValues.status });

      const snap = await getDoc(ref);
      console.log('updated data: ', snap.data());

      return { ...snap.data(), id: snap.id };
    },
    [firestore]
  );

  return update;
};

// TODO: move hook to it's own file
export const useConfirmAndUpdate = (updateFn: (id: string, vals: Partial<any>) => Promise<any>) => {
  const modal = useConfirmation();
  const toast = useAsyncToast();
  const theme = useTheme();
  let fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const confirm = useCallback(
    async (newRow: GridRowModel<WithId<Quote>>, oldRow: GridRowModel<WithId<Quote>>) => {
      let changeMsg =
        newRow.status !== oldRow.status
          ? `"status" from ${oldRow.status} to ${newRow.status}`
          : null;

      try {
        await modal({
          variant: 'danger',
          catchOnCancel: true,
          title: 'Are you sure?',
          description: (
            <>
              <Typography variant='body2' color='text.secondary'>
                You are about to make the following changes:
              </Typography>
              <Typography>{changeMsg}</Typography>
            </>
          ),
          confirmButtonText: 'Confirm',
          dialogContentProps: { dividers: true },
          dialogProps: { fullScreen },
        });

        toast.loading('saving...');
        const res = await updateFn(newRow.id, {
          status: newRow.status,
        });

        toast.success(`Saved!`);
        return res;
      } catch (err) {
        toast.error('update failed');
        return oldRow;
      }
    },
    [modal, toast, updateFn, fullScreen]
  );

  return confirm;
};

export const Quotes = () => {
  const navigate = useNavigate();
  const updateQuote = useUpdateQuoteStatus();
  const confirmAndUpdate = useConfirmAndUpdate(updateQuote);
  const renderShowJson = useGridShowJson(
    COLLECTIONS.QUOTES,
    { showInMenu: true },
    { requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }
  );
  const { isMobile } = useWidth();

  const editQuote = useCallback(
    (params: GridRowParams) => () => {
      let status = params.row.status;
      if (!(status === QUOTE_STATUS.AWAITING_USER || status === QUOTE_STATUS.DRAFT))
        return toast.error(
          `status must be ${QUOTE_STATUS.AWAITING_USER} or ${QUOTE_STATUS.DRAFT} to edit`
        );

      navigate(
        createPath({
          path: ADMIN_ROUTES.QUOTE_EDIT,
          params: { productId: params.row.product, quoteId: params.id.toString() },
        })
      );
    },
    [navigate]
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
        })
      ),
    [navigate]
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
    [editQuote, showDetails, renderShowJson, isMobile]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Typography variant='h5' sx={{ ml: { xs: 2, sm: 3, md: 4 } }}>
          Quotes
        </Typography>
        <Stack direction='row' spacing={2}>
          <Button
            onClick={() =>
              navigate(
                createPath({ path: ADMIN_ROUTES.QUOTE_NEW_BLANK, params: { productId: 'flood' } })
              )
            }
            sx={{ maxHeight: 36 }}
          >
            New Quote
          </Button>
          <QuotesActionMenu />
        </Stack>
      </Box>
      <QuotesGrid
        renderActions={renderActions}
        additionalColumns={[submissionIdCol, subproducerCommissionCol]}
        density='compact'
        processRowUpdate={confirmAndUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
      />
    </Box>
  );
};

// Required to get around dialog unmounting when icon menu closes
function QuotesActionMenu() {
  const toast = useAsyncToast({ position: 'top-right', duration: 2400 });
  const [open, setOpen] = useState<TStorageFolder | null>(null);
  const [dupHeaders, setDupHeaders] = useState<string[]>([]);

  const handleOpen = useCallback((val: TStorageFolder) => () => setOpen(val), []);
  const handleClose = useCallback(() => {
    setOpen(null);
    setDupHeaders([]);
  }, []);

  const checkForDuplicates = useCallback((headers: string[], formatFn: (str: string) => string) => {
    let formatted = headers.map((h) => formatFn(h));
    setDupHeaders(getDuplicates(formatted));
  }, []);

  const handleHeaderStatus = useCallback(
    (requiredHeaders: string[], formatFn: (str: string) => string) => (headers: string[]) => {
      checkForDuplicates(headers, formatFn);
      return getCsvHeaderStatus(headers, requiredHeaders, formatFn);
    },
    [checkForDuplicates]
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
    [toast]
  );

  return (
    <Box>
      <IconMenu>
        <MenuItem onClick={handleOpen('ratePortfolio')}>Rate Portfolio</MenuItem>
        <MenuItem onClick={handleOpen('importQuotes')}>Import Quotes</MenuItem>
      </IconMenu>
      <CSVUploadDialog
        open={open === 'ratePortfolio'}
        onClose={handleClose}
        destinationFolder={StorageFolder.enum.ratePortfolio}
        getCsvHeaderStatus={handleHeaderStatus(PORTFOLIO_RATING_REQUIRED_HEADERS, snakeCase)}
        onSuccess={onSuccess}
        title='Rate Portfolio'
      >
        <Typography variant='body2' color='text.secondary' component='div'>
          Headers will be transformed to{' '}
          <Link href='https://lodash.com/docs/4.17.15#snakeCase' target='_blank' rel='noopener'>
            snake case <OpenInNewRounded sx={{ fontSize: 16 }} />
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
        getCsvHeaderStatus={handleHeaderStatus(QUOTE_IMPORT_REQUIRED_HEADERS, camelCase)}
        onSuccess={onSuccess}
        title='Import Quotes'
      >
        <Typography variant='body2' color='text.secondary' component='div'>
          Headers will be transformed to{' '}
          <Link href='https://lodash.com/docs/4.17.15#camelCase' target='_blank' rel='noopener'>
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
