import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Unstable_Grid2 as Grid, Stack, Typography } from '@mui/material';
import { CheckCircleRounded } from '@mui/icons-material';
import { UploadResult } from 'firebase/storage';
import { ParseResult, parse } from 'papaparse';

import {
  UploadFilesDialogComponent,
  UploadFilesDialogComponentProps,
} from 'elements/UploadFilesDialog';
import { useAsyncToast, useCreateStorageFiles } from 'hooks';
import { filter, includes, snakeCase } from 'lodash';

// TODO: use web worker ??
// https://www.newline.co/fullstack-react/articles/introduction-to-web-workers-with-react/
// https://medium.com/@ashifa454/offloading-render-using-web-workers-e0f2f463ad0

// const REQUIRED_HEADERS = [
//   'cov_a_limit',
//   'cov_b_limit',
//   'cov_c_limit',
//   'cov_d_limit',
//   'cov_a_rcv',
//   'cov_b_rcv',
//   'cov_c_rcv',
//   'cov_d_rcv',
//   'deductible',
//   'state',
//   'commission_pct',
// ];

// function getHeaderStatus(headers: string[], formatFn: (str: string) => string = snakeCase) {
//   const formatted = headers.map((h) => formatFn(h));

//   let result: Record<string, boolean | null> = {};

//   for (let h of REQUIRED_HEADERS) {
//     result[h] = formatted.includes(h);
//   }

//   return result;
// }

// interface PortfolioRatingDialogProps
//   extends Omit<
//     UploadFilesDialogComponentProps,
//     'acceptedTypes' | 'files' | 'onNewFiles' | 'onRemove' | 'onSubmit' | 'onCancel' | 'handleSubmit'
//   > {
//   onClose: () => void;
// }

interface CSVUploadDialogProps
  extends Omit<
    UploadFilesDialogComponentProps,
    'acceptedTypes' | 'files' | 'onNewFiles' | 'onRemove' | 'onSubmit' | 'onCancel' | 'handleSubmit'
  > {
  onClose: () => void;
  destinationFolder: string;
  getHeaderStatus: (headers: string[]) => Record<string, boolean | null>;
  children?: ReactNode;
  onSuccess?: (uploadResult: UploadResult[]) => void;
}

export const CSVUploadDialog = ({
  open,
  onClose,
  destinationFolder,
  getHeaderStatus,
  children,
  onSuccess,
  ...props
}: CSVUploadDialogProps) => {
  const toast = useAsyncToast({ position: 'top-right', duration: 2400 });
  const [headerStatus, setHeaderStatus] = useState<Record<string, boolean | null>>(
    getHeaderStatus([])
  );
  const [headers, setHeaders] = useState<string[]>([]);

  const isValid = useMemo(() => Object.values(headerStatus).every((v) => v), [headerStatus]);

  const {
    files: uploadFiles,
    loading: uploadLoading,
    handleNewFiles,
    handleRemoveFile,
    handleSubmit,
    handleCancel: uploadHandleCancel,
  } = useCreateStorageFiles(
    destinationFolder,
    { status: 'pending' },
    async (uploadResult) => {
      if (onSuccess) onSuccess(uploadResult);
    },
    (err, msg) => console.log('upload failed: ', msg, err)
  );

  // TODO: slice blob before reader so reader doesn't read entire file - only enough for headers + 1 row
  // SOURCE: https://www.geeksforgeeks.org/how-to-read-csv-files-in-react-js/
  const handleParse = useCallback((file: File) => {
    return new Promise((resolve, reject) => {
      if (!file) reject(new Error('missing file'));
      // Initialize a reader which allows user to read any file or blob.
      const reader = new FileReader();

      // Event listener on reader when the file loads, we parse it and set the data.
      reader.onload = async ({ target }) => {
        if (!target?.result) {
          console.log('TARGET IS NULL');
          reject(new Error('Error reading file'));
        } // @ts-ignore
        const csv = parse<any>(target.result, {
          header: true,
          preview: 1,
        }) as unknown as ParseResult<any>;

        const errors = csv?.errors;
        const headers = [...(csv?.meta?.fields || [])];

        resolve({ headers, errors, parseResult: csv });
      };
      // TODO: handle error
      // reader.onerror((e) => {
      //   reject('error reading file')
      // })
      reader.readAsText(file);
    });
  }, []);

  // react-papaparse: https://github.com/Bunlong/react-papaparse/blob/master/src/useCSVReader.tsx

  // https://stackoverflow.com/a/56567324
  const validateHeadersOnNewFiles = useCallback(
    async (files: File[]) => {
      for (let file of files) {
        try {
          const { headers, errors, parseResult } = (await handleParse(file)) as any;

          console.log('HEADERS: ', headers);
          console.log('ERRORS: ', errors);
          console.log('PARSE RESULT: ', parseResult);
          setHeaders(headers);
        } catch (err) {
          console.log('ERROR: ', err);
        }
      }
      // if (files[0]) handleParse2(files[0]);
      handleNewFiles(files);
    },
    [handleNewFiles, handleParse]
  );

  useEffect(() => {
    setHeaderStatus(getHeaderStatus(headers));
  }, [headers, getHeaderStatus]);

  useEffect(() => {
    // TODO: verify all headers unique
    // https://stackoverflow.com/a/31681942
    // _.filter(arr, (val, i, iteratee) => _.includes(iteratee, val, i + 1))
    let snake = headers.map((h) => snakeCase(h));
    let dupHeaders = filter(snake, (val, i, iteratee) => includes(iteratee, val, i + 1));

    console.log('headers: ', headers.length);
    console.log('dup: ', dupHeaders.length);

    if (dupHeaders.length)
      toast.warn(`Duplicate headers detected (${dupHeaders.join(', ')})`, { id: 'dup-headers' });
  }, [toast, headers]);

  useEffect(() => {
    if (!uploadFiles || !uploadFiles.length) setHeaderStatus({ ...getHeaderStatus([]) });
  }, [uploadFiles, getHeaderStatus]);

  const onSubmit = useCallback(async () => {
    try {
      await handleSubmit();
      onClose();
    } catch (err) {
      console.log('ERROR: ', err);
    }
  }, [handleSubmit, onClose]);

  const handleCancel = useCallback(() => {
    uploadHandleCancel();
    onClose();
  }, [uploadHandleCancel, onClose]);

  return (
    <Box>
      <UploadFilesDialogComponent
        acceptedTypes='text/csv,.csv'
        title='Rate Portfolio'
        filesDragDropProps={{ maxFileSizeInBytes: 4194304 }} // 4MB
        loading={uploadLoading}
        files={uploadFiles}
        // onNewFiles={handleNewFiles}
        onNewFiles={validateHeadersOnNewFiles}
        onRemove={handleRemoveFile}
        // onSubmit={onSubmit}
        handleSubmit={onSubmit}
        onCancel={handleCancel}
        isValid={isValid}
        open={open}
        {...props}
      >
        <Box>
          <Box sx={{ pb: 4 }}>
            <Typography>Upload a CSV file with the following headers (minimum):</Typography>
            {children}
          </Box>

          <RequiredHeaders headerStatus={headerStatus} />
        </Box>
      </UploadFilesDialogComponent>
    </Box>
  );
};

interface RequiredHeadersProps {
  headerStatus: Record<string, boolean | null>;
}

function RequiredHeaders(props: RequiredHeadersProps) {
  const keys = Object.keys(props.headerStatus);

  return (
    <Grid container spacing={3}>
      {keys.map((h) => (
        <Grid xs={6} sm={4} key={h}>
          <Stack direction='row' spacing={2}>
            <CheckCircleRounded
              fontSize='small'
              color={props.headerStatus[h] ? 'success' : 'disabled'}
            />
            <Typography variant='body2' color='text.secondary'>
              {h}
            </Typography>
          </Stack>
        </Grid>
      ))}
    </Grid>
  );
}
