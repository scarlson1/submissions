import { useCallback } from 'react';
import { Box } from '@mui/material';
import { ParseResult, parse } from 'papaparse';

import UploadFilesDialog from 'elements/UploadFilesDialog';
import { useCreateStorageFiles } from 'hooks';

// TODO: use web worker ??
// https://www.newline.co/fullstack-react/articles/introduction-to-web-workers-with-react/
// https://medium.com/@ashifa454/offloading-render-using-web-workers-e0f2f463ad0

export const PortfolioRating = () => {
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

      // if (uploadResult.length > 0 && uploadResult[0].metadata.fullPath) {
      //   let downloadUrl = await getDownloadURL(uploadResult[0].ref);
      //   console.log('downloadUrl: ', downloadUrl);
      //   await updateProfile({ photoURL: downloadUrl }); // uploadResult[0].metadata.fullPath
      // }
    },
    (err, msg) => console.log('upload failed: ', msg, err)
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

        const headers = parsedData && parsedData.length ? Object.keys(parsedData[0]) : [];

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
          const { headers, errors } = (await handleParse(file)) as any;

          console.log('HEADERS: ', headers);
          console.log('ERRORS: ', errors);
        } catch (err) {
          console.log('ERROR: ', err);
        }
      }
      // if (files[0]) handleParse2(files[0]);
      handleNewFiles(files);
    },
    [handleNewFiles, handleParse]
  );

  return (
    <Box>
      <UploadFilesDialog
        acceptedTypes='text/csv,.csv'
        title='Rate Portfolio'
        bodyText='Upload a CSV file with the following headers (minimum): '
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
