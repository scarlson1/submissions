import { ParseError, ParseResult, parse } from 'papaparse';
import { useCallback, useMemo, useState } from 'react';

interface ParseCSVState<T = any> {
  parseResult: ParseResult<T> | null;
  headers: string[];
  errors: ParseError[];
}

export function useParseCSV<T = any>(
  onSuccess?: (state: ParseCSVState<T>) => void,
  onError?: (msg: string, err: any) => void
) {
  const [state, setState] = useState<ParseCSVState<T>>({
    parseResult: null,
    headers: [],
    errors: [],
  });

  // TODO: slice blob before reader so reader doesn't read entire file - only enough for headers + 1 row
  // SOURCE: https://www.geeksforgeeks.org/how-to-read-csv-files-in-react-js/
  const handleParse = useCallback(
    (file: File) => {
      return new Promise<ParseCSVState<T>>((resolve, reject) => {
        if (!file) reject(new Error('missing file'));
        // // Initialize a reader which allows user to read any file or blob.
        const reader = new FileReader();

        // Event listener on reader when the file loads, we parse it and set the data.
        reader.onload = async ({ target }) => {
          console.log('parsing file...');
          if (!target?.result) {
            onError && onError('error reading file', new Error('error reading file'));
            reject(new Error('Error reading file'));
            return;
          }
          const csv = parse<T>(target.result as string, {
            header: true,
            preview: 1,
          });

          const errors = csv?.errors;
          const headers = [...(csv?.meta?.fields || [])];

          const newState = { headers, errors, parseResult: csv };

          console.log('RESULT: ', csv);

          setState(newState);
          onSuccess && onSuccess(newState);
          resolve({ headers, errors, parseResult: csv });
        };

        reader.addEventListener('error', (err: any) => {
          console.log('Error: ', err);
          reject(`Error occurred reading file: ${file.name}`);
        });

        reader.readAsText(file);
      });
    },
    [onSuccess, onError]
  );

  return useMemo(() => ({ ...state, handleParse }), [handleParse, state]);
}
