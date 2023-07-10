import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Unstable_Grid2 as Grid, Link, Stack, Typography } from '@mui/material';
import { ParseResult, parse } from 'papaparse';

import UploadFilesDialog from 'elements/UploadFilesDialog';
import { useAsyncToast, useCreateStorageFiles } from 'hooks';
import { CheckCircleRounded, OpenInNewRounded } from '@mui/icons-material';
import { snakeCase } from 'lodash';

// TODO: use web worker ??
// https://www.newline.co/fullstack-react/articles/introduction-to-web-workers-with-react/
// https://medium.com/@ashifa454/offloading-render-using-web-workers-e0f2f463ad0

type ReqHeaders =
  | 'cov_a_rcv'
  | 'cov_b_rcv'
  | 'cov_c_rcv'
  | 'cov_d_rcv'
  | 'cov_a_limit'
  | 'cov_b_limit'
  | 'cov_c_limit'
  | 'cov_d_limit'
  | 'deductible'
  | 'state'
  | 'commission_pct';

const REQUIRED_HEADERS: ReqHeaders[] = [
  'cov_a_rcv',
  'cov_b_rcv',
  'cov_c_rcv',
  'cov_d_rcv',
  'cov_a_limit',
  'cov_b_limit',
  'cov_c_limit',
  'cov_d_limit',
  'deductible',
  'state',
  'commission_pct',
];

function getHeaderStatus(headers: string[], formatFn: (str: string) => string = snakeCase) {
  const formatted = headers.map((h) => formatFn(h));
  console.log('formatted headers: ', formatted);

  let result: Record<string, boolean | null> = {};

  for (let h of REQUIRED_HEADERS) {
    result[h] = formatted.includes(h);
  }

  return result;
}

export const PortfolioRating = () => {
  const toast = useAsyncToast({ position: 'top-right' });
  const [headerStatus, setHeaderStatus] = useState<Record<string, boolean | null>>(
    getHeaderStatus([])
  );
  const [headers, setHeaders] = useState<string[]>([]);

  const isValid = useMemo(() => Object.values(headerStatus).every((v) => v), [headerStatus]);
  console.log('isValid: ', isValid);

  const {
    files: uploadFiles,
    loading: uploadLoading,
    handleNewFiles,
    handleRemoveFile,
    handleSubmit,
    handleCancel,
  } = useCreateStorageFiles(
    `ratePortfolio`,
    { status: 'pending' },
    async (uploadResult) => {
      console.log('upload successful', uploadResult);
      toast.info("You'll receive an email upon completion");
    },
    (err, msg) => {
      console.log('upload failed: ', msg, err);
      // toast.error(msg);
    }
  );

  // SOURCE: https://refine.dev/blog/how-to-import-csv/
  // const fileReader = new FileReader();

  // const csvFileToArray = (str: string) => {
  //   const csvHeader = str.slice(0, str.indexOf('\n')).split(',');
  //   console.log('CSV HEADERS: ', csvHeader);
  //   // const csvRows = str.slice(str.indexOf('\n') + 1).split('\n');

  //   // const array = csvRows.map((i) => {
  //   //   const values = i.split(',');
  //   //   const obj = csvHeader.reduce((object, header, index) => {
  //   //     object[header] = values[index];
  //   //     return object;
  //   //   }, {});
  //   //   return obj;
  //   // });

  //   // setArray(array);
  // };

  // const handleParse2 = (file: File) => {
  //   if (file) {
  //     fileReader.onload = function (event) {
  //       const text = event?.target?.result as string;
  //       if (text) csvFileToArray(text);
  //     };

  //     fileReader.readAsText(file);
  //   }
  // };

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

        const parsedData = csv?.data;
        const errors = csv?.errors;

        // const headers = parsedData && parsedData.length ? Object.keys(parsedData[0]) : []; // OR: get headers from csv.meta.fields ??
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
  }, [headers]);

  useEffect(() => {
    if (!uploadFiles || !uploadFiles.length) setHeaderStatus({ ...getHeaderStatus([]) });
  }, [uploadFiles]);

  return (
    <Box>
      <UploadFilesDialog
        acceptedTypes='text/csv,.csv'
        title='Rate Portfolio'
        bodyText={
          <Box>
            <Box sx={{ pb: 4 }}>
              <Typography>Upload a CSV file with the following headers (minimum):</Typography>
              <Typography variant='body2' color='text.secondary' component='div'>
                Headers will be transformed to{' '}
                <Link
                  href='https://lodash.com/docs/4.17.15#snakeCase'
                  target='_blank'
                  rel='noopener'
                >
                  snake case <OpenInNewRounded sx={{ fontSize: 16 }} />
                </Link>
                {`. (ex: "CovA limit" → "cov_a_limit")`}
              </Typography>
            </Box>

            <RequiredHeaders headerStatus={headerStatus} />
          </Box>
        }
        openButtonText='Upload'
        filesDragDropProps={{ maxFileSizeInBytes: 4194304 }} // 4MB
        loading={uploadLoading}
        files={uploadFiles}
        // onNewFiles={handleNewFiles}
        onNewFiles={validateHeadersOnNewFiles}
        onRemove={handleRemoveFile}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
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
          {/* <Box sx={{ display: 'flex', }}> */}
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
