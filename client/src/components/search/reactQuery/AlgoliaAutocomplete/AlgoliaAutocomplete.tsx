import { Hit } from '@algolia/client-search';
import {
  AutocompleteProps,
  Unstable_Grid2 as Grid,
  Autocomplete as MuiAutocomplete,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';

import { UseAlgoliaOptions, useAlgolia } from 'hooks/useAlgolia';
import { useDebounce } from 'hooks/utils';
import { BaseHit } from '..';

// TODO: generalize component

type WithBaseHit<T> = BaseHit & T;

// TODO: extends AutocompleteProps
interface AlgoliaAutocompleteProps<T>
  extends Omit<
    AutocompleteProps<T, false, false, false>,
    'options' | 'value' | 'onChange' | 'onInputChange' | 'renderInput' | 'onOpen' | 'onClose'
  > {
  onSelectItem: (val: WithBaseHit<T>) => void;
  searchOptions?: Omit<UseAlgoliaOptions, 'query' | 'indexName'>;
}

export const AlgoliaAutocomplete = <T,>({
  searchOptions,
  onSelectItem,
  ...props
}: AlgoliaAutocompleteProps<WithBaseHit<T>>) => {
  const [value, setValue] = useState<WithBaseHit<T> | null>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce<string>(query, 100);

  const active = useRef(false);

  const { hits, isFetching } = useAlgolia<WithBaseHit<T>>({
    indexName: import.meta.env.VITE_ALGOLIA_INDEX_NAME as string,
    query: debouncedQuery,
    hitsPerPage: 5,
    staleTime: 1000 * 60, // 60s
    gcTime: 1000 * 60 * 15, // 15m
    enabled: !!debouncedQuery && active.current,
    ...searchOptions,
  });

  useEffect(() => {
    console.log('autocomplete value: ', value);
  }, [value]);

  const options = useMemo<readonly Hit<WithBaseHit<T>>[]>(() => {
    console.log('OPTIONS: ', hits);
    return (hits || []) as Hit<WithBaseHit<T>>[];
  }, [hits]);

  const optionsWithVal = useMemo(() => {
    return value ? [value, ...options] : options;
    // let o: (Hit<WithBaseHit<T>> | WithBaseHit<T>)[] = [...options];
    // if (value) o.push(value);
    // return o;
  }, [options, value]);

  return (
    <MuiAutocomplete
      sx={{ width: 300 }}
      // getOptionLabel={(option) => (typeof option === 'string' ? option : option.searchTitle)}
      getOptionLabel={(option) => option?.searchTitle ?? null}
      filterOptions={(x) => x}
      // options={options}
      options={optionsWithVal}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      noOptionsText='No options'
      loading={isFetching}
      onChange={(event: any, newValue: WithBaseHit<T> | null) => {
        console.log('newValue:', newValue);
        // setOptions(newValue ? [newValue, ...options] : options); // TODO: handle selection
        setValue(newValue);
        onSelectItem && newValue && onSelectItem(newValue);
      }}
      onInputChange={(event, newInputValue) => {
        setQuery(newInputValue);
      }}
      onOpen={() => {
        active.current = true;
      }}
      onClose={(event, reason) => {
        console.log(`onClose (${reason})`);
        active.current = false;
      }}
      renderInput={(params) => <TextField {...params} label='Search' fullWidth />}
      renderOption={(props, option) => {
        return (
          <li {...props} key={option.objectID}>
            <Grid container spacing={2} alignItems='center' disableEqualOverflow>
              {/* <Grid item sx={{ display: 'flex', width: 44 }}>
                <LocationOnIcon sx={{ color: 'text.secondary' }} />
              </Grid> */}
              {/* width: 'calc(100% - 44px)', */}
              <Grid sx={{ wordWrap: 'break-word' }}>
                <Typography
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {option.searchTitle}
                </Typography>
                {/* {parts.map((part, index) => (
                  <Box
                    key={index}
                    component="span"
                    sx={{ fontWeight: part.highlight ? 'bold' : 'regular' }}
                  >
                    {part.text}
                  </Box>
                ))} */}
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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
