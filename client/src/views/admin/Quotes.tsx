import { useCallback, useState } from 'react';
import {
  Box,
  Button,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { GridActionsCellItem, GridRowModel, GridRowParams } from '@mui/x-data-grid';
import { DataObjectRounded, EditRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { toast } from 'react-hot-toast';

import { ADMIN_ROUTES, createPath } from 'router';
import { Quote, quotesCollection, QUOTE_STATUS, WithId, COLLECTIONS } from 'common';
import { subproducerCommissionCol } from 'modules/gridColumnDefs';
import { useAsyncToast, useShowJson } from 'hooks';
import { useConfirmation } from 'modules/components';
import { quoteConverter } from 'common/firestoreConverters';
import { QuotesGrid, PortfolioRatingDialog } from 'elements';
import { IconMenu } from 'components/IconButtonMenu';

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
    </Box>
  );
};

// Required to get around dialog unmounting when icon menu closes
function QuotesActionMenu() {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <IconMenu>
        <MenuItem onClick={handleOpen}>Rate Portfolio</MenuItem>
      </IconMenu>
      <PortfolioRatingDialog open={open} onClose={handleClose} />
    </>
  );
}
