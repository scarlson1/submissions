import type { AutocompleteApi, AutocompleteState } from '@algolia/autocomplete-core';
import { ClearRounded, SearchRounded } from '@mui/icons-material';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { useEffect, type MutableRefObject } from 'react';

import { InternalDocSearchHit } from 'common';

// import { MAX_QUERY_SIZE } from './constants';
// import { LoadingIcon } from './icons/LoadingIcon';
// import { ResetIcon } from './icons/ResetIcon';
// import { SearchIcon } from './icons/SearchIcon';
// import type { InternalDocSearchHit } from './types';

const MAX_QUERY_SIZE = 64;

export type SearchBoxTranslations = Partial<{
  resetButtonTitle: string;
  resetButtonAriaLabel: string;
  cancelButtonText: string;
  cancelButtonAriaLabel: string;
}>;

interface SearchBoxProps
  extends AutocompleteApi<
    InternalDocSearchHit,
    React.FormEvent,
    React.MouseEvent,
    React.KeyboardEvent
  > {
  state: AutocompleteState<InternalDocSearchHit>;
  autoFocus: boolean;
  inputRef: MutableRefObject<HTMLInputElement | null>;
  onClose: () => void;
  // isFromSelection: boolean;
  translations?: SearchBoxTranslations;
}

export function SearchBox({ translations = {}, ...props }: SearchBoxProps) {
  const {
    resetButtonTitle = 'clear',
    resetButtonAriaLabel = 'clear',
    // cancelButtonText = 'cancel',
    // cancelButtonAriaLabel = 'cancel',
  } = translations;
  const { onReset } = props.getFormProps({
    inputElement: props.inputRef.current,
  });

  useEffect(() => {
    if (props.autoFocus && props.inputRef.current) {
      props.inputRef.current.focus();
    }
  }, [props.autoFocus, props.inputRef]);

  // React.useEffect(() => {
  //   if (props.isFromSelection && props.inputRef.current) {
  //     props.inputRef.current.select();
  //   }
  // }, [props.isFromSelection, props.inputRef]);

  return (
    <>
      <form
        className='DocSearch-Form'
        onSubmit={(event) => {
          event.preventDefault();
        }}
        onReset={onReset}
        style={{ display: 'flex', alignItems: 'center', borderRadius: '10px', width: '100%' }}
      >
        <TextField
          className='DocSearch-SearchBar'
          fullWidth
          variant='standard'
          ref={props.inputRef}
          {...props.getInputProps({
            inputElement: props.inputRef.current!,
            autoFocus: props.autoFocus,
            maxLength: MAX_QUERY_SIZE,
          })}
          type='text'
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchRounded fontSize='small' />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton
                  onClick={() => props.setQuery('')}
                  disabled={!props.state.query}
                  aria-label={resetButtonAriaLabel}
                  title={resetButtonTitle}
                >
                  <ClearRounded fontSize='small' />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {/* TODO: loading indicator */}
      </form>
    </>
  );
}

/* <label className='DocSearch-MagnifierLabel' {...props.getLabelProps()}>
  <SearchRounded fontSize='small' />
</label>

<div className='DocSearch-LoadingIndicator'>
  <CircularProgress size={20} />
</div>

<input
  className='DocSearch-Input'
  ref={props.inputRef}
  {...props.getInputProps({
    inputElement: props.inputRef.current!,
    autoFocus: props.autoFocus,
    maxLength: MAX_QUERY_SIZE,
  })}
/>

<button
  type='reset'
  title={resetButtonTitle}
  className='DocSearch-Reset'
  aria-label={resetButtonAriaLabel}
  hidden={!props.state.query}
>
  <ClearRounded fontSize='small' />
</button> */

/* <button
      className='DocSearch-Cancel'
      type='reset'
      aria-label={cancelButtonAriaLabel}
      onClick={props.onClose}
    >
      {cancelButtonText}
    </button> */
