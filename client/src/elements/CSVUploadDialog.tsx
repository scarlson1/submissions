import { ReactNode, useCallback, useMemo, useState } from 'react';
import { Box, Unstable_Grid2 as Grid, Stack, Typography } from '@mui/material';
import { CheckCircleRounded } from '@mui/icons-material';
import { UploadResult } from 'firebase/storage';

import {
  UploadFilesDialogComponent,
  UploadFilesDialogComponentProps,
} from 'elements/UploadFilesDialog';
import { useCreateStorageFiles, useParseCSV } from 'hooks';

// TODO: use web worker ??
// https://www.newline.co/fullstack-react/articles/introduction-to-web-workers-with-react/
// https://medium.com/@ashifa454/offloading-render-using-web-workers-e0f2f463ad0

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
  const [headerStatus, setHeaderStatus] = useState<Record<string, boolean | null>>(
    {} // getHeaderStatus([])
  );
  const { handleParse } = useParseCSV((state) => setHeaderStatus(getHeaderStatus(state.headers)));

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

  // const handleParse = useCallback((file: File) => {
  //   return new Promise((resolve, reject) => {
  //     if (!file) reject(new Error('missing file'));
  //     // Initialize a reader which allows user to read any file or blob.
  //     const reader = new FileReader();

  //     // Event listener on reader when the file loads, we parse it and set the data.
  //     reader.onload = async ({ target }) => {
  //       if (!target?.result) {
  //         console.log('TARGET IS NULL');
  //         reject(new Error('Error reading file'));
  //       } // @ts-ignore
  //       const csv = parse<any>(target.result, {
  //         header: true,
  //         preview: 1,
  //       }) as unknown as ParseResult<any>;

  //       const errors = csv?.errors;
  //       const headers = [...(csv?.meta?.fields || [])];

  //       resolve({ headers, errors, parseResult: csv });
  //     };
  //     // TODO: handle error
  //     // reader.onerror((e) => {
  //     //   reject('error reading file')
  //     // })
  //     reader.readAsText(file);
  //   });
  // }, []);

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

          // setHeaders(headers);
          setHeaderStatus(getHeaderStatus(headers));
        } catch (err) {
          console.log('ERROR: ', err);
        }
      }

      handleNewFiles(files);
    },
    [handleNewFiles, handleParse, getHeaderStatus]
  );

  // causes infinite loop b/c sets duplicate headers value --> triggers rerender
  // and useEffect calls getHeaderStatus with empty array when not intended
  // useEffect(() => {
  //   setHeaderStatus(getHeaderStatus(headers));
  // }, [headers, getHeaderStatus]);

  // useEffect(() => {
  //   if (!uploadFiles || !uploadFiles.length) setHeaderStatus({ ...getHeaderStatus([]) });
  // }, [uploadFiles, getHeaderStatus]);

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
    setHeaderStatus({ ...getHeaderStatus([]) });
  }, [uploadHandleCancel, onClose, getHeaderStatus]);

  const handleRemove = useCallback(
    (file: File) => {
      handleRemoveFile(file);
      setHeaderStatus({ ...getHeaderStatus([]) });
    },
    [handleRemoveFile, getHeaderStatus]
  );

  return (
    <Box>
      <UploadFilesDialogComponent
        acceptedTypes='text/csv,.csv'
        // title='Rate Portfolio'
        filesDragDropProps={{ maxFileSizeInBytes: 4194304 }} // 4MB
        loading={uploadLoading}
        files={uploadFiles}
        // onNewFiles={handleNewFiles}
        onNewFiles={validateHeadersOnNewFiles}
        onRemove={handleRemove}
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

export function RequiredHeaders(props: RequiredHeadersProps) {
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
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}
            >
              {h}
            </Typography>
          </Stack>
        </Grid>
      ))}
    </Grid>
  );
}
