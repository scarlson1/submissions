// export const Temp = () => null;

// import { Hit } from '@algolia/client-search';
import {
  AutocompleteProps,
  Unstable_Grid2 as Grid,
  Autocomplete as MuiAutocomplete,
  TextField,
  TextFieldProps,
  Typography,
} from '@mui/material';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useField } from 'formik';
import { BaseHit } from './SearchResults';
import { useTypesense, type UseTypesenseOptions } from 'hooks/useAlgolia';
import { useDebounce } from 'hooks/utils';
import type {
  DocumentSchema,
  SearchParams,
} from 'typesense';

// TODO: generalize component (autocomplete form)

type WithBaseHit<T> = BaseHit & T;

// TODO: extends AutocompleteProps
interface TypesenseAutocompleteProps<T extends DocumentSchema> extends Omit<
  AutocompleteProps<T, false, false, false>,
  | 'options'
  | 'value'
  | 'onChange'
  | 'onInputChange'
  | 'renderInput'
  | 'onOpen'
  | 'onClose'
> {
  //   onSelectItem: (val: WithBaseHit<T>) => void;
  onSelectItem: (val: T) => void;
  searchOptions?: Omit<UseTypesenseOptions<T>, 'query'>;
  name: string;
  label?: string;
  resetFields?: () => void;
  textFieldProps?: Omit<TextFieldProps, 'value' | 'onChange'>;
}

export const TypesenseAutocomplete = <T extends DocumentSchema>({
  searchOptions,
  onSelectItem,
  name,
  label,
  resetFields,
  textFieldProps,
  ...props
}: TypesenseAutocompleteProps<WithBaseHit<T>>) => {
  const [value, setValue] = useState<WithBaseHit<T> | null>(null);
  // const [query, setQuery] = useState('');
  const [field, meta, helpers] = useField(name);
  const debouncedQuery = useDebounce<string>(field.value, 100);

  const active = useRef(false);

  const {
    preset,
    indexName = '',
    limit = 5,
    staleTime = 1000 * 60,
    gcTime = 1000 * 60 * 15,
    enabled,
    ...rest
  } = searchOptions || {};

  const searchParams = ({ ...rest, preset } as SearchParams<
    WithBaseHit<T>,
    string
  >);

  const { hits, isFetching } = useTypesense<WithBaseHit<T>>({
    indexName,
    query: debouncedQuery,
    limit,
    staleTime,
    gcTime,
    enabled: Boolean(indexName) && (enabled ?? (!!debouncedQuery && active.current)),
    ...searchParams,
  });

  const options = useMemo<readonly WithBaseHit<T>[]>(() => {
    return (hits || []).map((hit) => hit.document as WithBaseHit<T>);
  }, [hits]);

  const optionsWithVal = useMemo(() => {
    return value ? [value, ...options] : options;
  }, [options, value]);

  const handleSelect = useCallback(
    (newValue: WithBaseHit<T> | null) => {
      console.log('newValue:', newValue);
      setValue(newValue);
      // set formik values in onSelectItem fn
      onSelectItem && newValue && onSelectItem(newValue);
    },
    [onSelectItem],
  );

  return (
    <MuiAutocomplete
      // sx={{ width: 300 }}
      // getOptionLabel={(option) => (typeof option === 'string' ? option : option.searchTitle)}
      getOptionLabel={(option) => option?.searchTitle ?? ''}
      filterOptions={(x) => x}
      options={optionsWithVal}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      noOptionsText='No options'
      loading={isFetching}
      onChange={(event: any, newValue: WithBaseHit<T> | null, reason) => {
        event.stopPropagation();

        if (reason === 'clear' && resetFields) resetFields();
        if (reason === 'clear' || reason === 'selectOption')
          handleSelect(newValue);
      }}
      inputValue={field.value}
      onInputChange={(event, newInputValue) => {
        helpers.setValue(newInputValue);
      }}
      onOpen={() => {
        active.current = true;
      }}
      onClose={(event, reason) => {
        // console.log(`onClose (${reason})`);
        active.current = false;
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label ?? 'Search'}
          autoComplete='off'
          fullWidth
          error={Boolean(meta) && meta.touched && Boolean(meta.error)}
          onBlur={() => helpers.setTouched(true)}
          {...textFieldProps}
          helperText={(meta && meta.touched && meta.error) ?? meta.error}
        />
      )}
      renderOption={(props, option) => {
        // console.log('props/option: ', props, option);
        // TODO: word match highlight (option._highlightResult)
        return (
          <li {...props} key={option.id ?? option.searchTitle}>
            <Grid
              container
              spacing={2}
              alignItems='center'
              disableEqualOverflow
            >
              <Grid sx={{ wordWrap: 'break-word' }}>
                <Typography
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {option.searchTitle}
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {option.searchSubtitle}
                </Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
      {...props}
    />
  );
};
