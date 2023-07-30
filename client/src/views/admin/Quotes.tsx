import { useCallback, useState } from 'react';
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
import { DataObjectRounded, EditRounded, InfoRounded, OpenInNewRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { UploadResult } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { camelCase, snakeCase } from 'lodash';
import { toast } from 'react-hot-toast';

import { ADMIN_ROUTES, createPath } from 'router';
import { Quote, quotesCollection, QUOTE_STATUS, WithId, COLLECTIONS } from 'common';
import { subproducerCommissionCol } from 'modules/gridColumnDefs';
import { useAsyncToast, useShowJson } from 'hooks';
import { useConfirmation } from 'modules/components';
import { quoteConverter } from 'common/firestoreConverters';
import { QuotesGrid, CSVUploadDialog } from 'elements';
import { IconMenu } from 'components/IconButtonMenu';
import { getDuplicates } from 'modules/utils';
import { Usage } from 'context/DialogContext';

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
  const showJson = useShowJson<Quote>(
    COLLECTIONS.QUOTES,
    [],
    (q: WithId<Quote>) => `Quote - ${q.address?.addressLine1 || ''} (ID: ${q.id || ''})`
  );

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

  const handleShowJson = useCallback(
    (params: GridRowParams) => async () => showJson(params.id.toString()),
    [showJson]
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
        disabled={
          !(
            params.row.status !== QUOTE_STATUS.AWAITING_USER ||
            params.row.status !== QUOTE_STATUS.DRAFT
          )
        }
      />,
      <GridActionsCellItem
        icon={
          <Tooltip placement='top' title='view JSON'>
            <DataObjectRounded />
          </Tooltip>
        }
        onClick={handleShowJson(params)}
        label='view JSON'
        // disabled={!Boolean(claims?.iDemandAdmin)}
      />,
    ],
    [editQuote, handleShowJson]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Typography variant='h5' sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
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
        additionalColumns={[subproducerCommissionCol]}
        density='compact'
        processRowUpdate={confirmAndUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
      />
      <Usage />
    </Box>
  );
};

const PORTFOLIO_RATING_REQUIRED_HEADERS = [
  'cov_a_limit',
  'cov_b_limit',
  'cov_c_limit',
  'cov_d_limit',
  'cov_a_rcv',
  'cov_b_rcv',
  'cov_c_rcv',
  'cov_d_rcv',
  'deductible',
  'state',
  'commission_pct',
];

const QUOTE_IMPORT_REQUIRED_HEADERS = [
  'product',
  'limitA',
  'limitB',
  'limitC',
  'limitD',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'postal',
  'latitude',
  'longitude',
  'homeState',
  'annualPremium',
  'subproducerCommission',
  'agentName',
  'agentEmail',
  'agentPhone',
  'agentId',
  'agencyName',
  'agencyAddressLine1',
  'agencyAddressLine2',
  'agencyCity',
  'agencyState',
  'agencyPostal',
  'orgId',
  // 'CBRSDesignation',
  'cbrsDesignation',
  'basement',
  'distToCoastFeet',
  'floodZone',
  'numStories',
  'propertyCode',
  'replacementCost',
  'sqFootage',
  'yearBuilt',
];

function getHeaderStatus(
  headers: string[],
  requiredHeaders: string[],
  formatFn: (str: string) => string = snakeCase
) {
  const formatted = headers.map((h) => formatFn(h));

  let result: Record<string, boolean | null> = {};

  for (let h of requiredHeaders) {
    result[h] = formatted.includes(h);
  }

  return result;
}

type OpenOptions = 'ratePortfolio' | 'importQuotes';

// Required to get around dialog unmounting when icon menu closes
function QuotesActionMenu() {
  const toast = useAsyncToast({ position: 'top-right', duration: 2400 });
  const [open, setOpen] = useState<OpenOptions | null>(null);
  const [dupHeaders, setDupHeaders] = useState<string[]>([]);

  const handleOpen = useCallback((val: OpenOptions) => () => setOpen(val), []);
  const handleClose = useCallback(() => {
    setOpen(null);
    setDupHeaders([]);
  }, []);

  const checkForDuplicates = useCallback((headers: string[], formatFn: (str: string) => string) => {
    let formatted = headers.map((h) => formatFn(h));
    let dups = getDuplicates(formatted);

    setDupHeaders(dups);
  }, []);

  const handleHeaderStatus = useCallback(
    (requiredHeaders: string[], formatFn: (str: string) => string) => (headers: string[]) => {
      checkForDuplicates(headers, formatFn);
      return getHeaderStatus(headers, requiredHeaders, formatFn);
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
    <>
      <IconMenu>
        <MenuItem onClick={handleOpen('ratePortfolio')}>Rate Portfolio</MenuItem>
        <MenuItem onClick={handleOpen('importQuotes')}>Import Quotes</MenuItem>
      </IconMenu>
      <CSVUploadDialog
        open={open === 'ratePortfolio'}
        onClose={handleClose}
        destinationFolder='ratePortfolio'
        getHeaderStatus={handleHeaderStatus(PORTFOLIO_RATING_REQUIRED_HEADERS, snakeCase)}
        onSuccess={onSuccess}
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
        destinationFolder='importQuotes'
        getHeaderStatus={handleHeaderStatus(QUOTE_IMPORT_REQUIRED_HEADERS, camelCase)}
        onSuccess={onSuccess}
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
    </>
  );
}
