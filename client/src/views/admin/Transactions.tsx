import { InfoRounded, OpenInNewRounded } from '@mui/icons-material';
import { Alert, AlertTitle, Box, Button, Collapse, Link, Typography } from '@mui/material';
import { UploadResult } from 'firebase/storage';
import { camelCase } from 'lodash';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

import { StorageFolder, TRANSACTION_IMPORT_REQUIRED_HEADERS } from 'common';
import { DownloadStorageFileButton } from 'components';
import { CSVUploadDialog } from 'elements';
import { TransactionsGrid } from 'elements/grids';
import { getDuplicates } from 'modules/utils';
import { getCsvHeaderStatus } from 'modules/utils/storage';

export const Transactions = () => {
  return (
    <Box>
      <TransactionsGrid />
      <ImportTransactions />
    </Box>
  );
};

function ImportTransactions() {
  const [open, setOpen] = useState(false);
  const [dupHeaders, setDupHeaders] = useState<string[]>([]);

  const onSuccess = useCallback((uploadResult: UploadResult[]) => {
    toast.success("you'll receive an email once records are staged", {
      duration: 3500,
      position: 'top-right',
      icon: <InfoRounded />,
    });
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

  return (
    <>
      <Button onClick={() => setOpen(true)}>Import Transactions</Button>
      <CSVUploadDialog
        open={open}
        onClose={() => setOpen(false)}
        destinationFolder={StorageFolder.enum.importTransactions}
        getCsvHeaderStatus={handleHeaderStatus(TRANSACTION_IMPORT_REQUIRED_HEADERS, camelCase)}
        onSuccess={onSuccess}
        title={
          <Box>
            <Typography>Import Transactions</Typography>
            <DownloadStorageFileButton filePath='public/transactionImportTemplate.csv'>
              Download template
            </DownloadStorageFileButton>
          </Box>
        }
      >
        <Typography variant='body2' color='text.secondary' component='div'>
          Headers will be transformed to{' '}
          <Link href='https://lodash.com/docs/4.17.15#camelCase' target='_blank' rel='noopener'>
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
    </>
  );
}
