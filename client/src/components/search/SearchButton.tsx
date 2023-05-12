import { KeyboardCommandKeyRounded, SearchRounded } from '@mui/icons-material';
import { Box, Button } from '@mui/material';
import React, { useEffect, useState } from 'react';

// import { ControlKeyIcon } from './icons/ControlKeyIcon';
// import { SearchIcon } from './icons/SearchIcon';

export type ButtonTranslations = Partial<{
  buttonText: string;
  buttonAriaLabel: string;
}>;

export type DocSearchButtonProps = React.ComponentProps<'button'> & {
  translations?: ButtonTranslations;
};

const ACTION_KEY_DEFAULT = 'Ctrl' as const;
const ACTION_KEY_APPLE = '⌘' as const;

function isAppleDevice() {
  return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
}

export const SearchButton = React.forwardRef<HTMLButtonElement, DocSearchButtonProps>(
  ({ translations = {}, ...props }, ref) => {
    const { buttonText = 'Search', buttonAriaLabel = 'Search' } = translations;

    const [key, setKey] = useState<typeof ACTION_KEY_APPLE | typeof ACTION_KEY_DEFAULT | null>(
      null
    );

    useEffect(() => {
      if (typeof navigator !== 'undefined') {
        isAppleDevice() ? setKey(ACTION_KEY_APPLE) : setKey(ACTION_KEY_DEFAULT);
      }
    }, []);

    return (
      <Button
        aria-label={buttonAriaLabel}
        startIcon={<SearchRounded fontSize='small' />}
        endIcon={
          key === ACTION_KEY_DEFAULT ? (
            <Box>
              <KeyboardCommandKeyRounded />
              <span>K</span>
            </Box>
          ) : (
            key
          )
        }
        {...props}
        color='primary'
        variant='outlined'
        ref={ref}
        sx={{ maxWidth: 200 }}
        fullWidth={false}
      >
        {buttonText}
      </Button>
      // <button
      //   type='button'
      //   className='DocSearch DocSearch-Button'
      //   aria-label={buttonAriaLabel}
      //   {...props}
      //   ref={ref}
      // >
      //   <span className='DocSearch-Button-Container'>
      //     <SearchRounded fontSize='small' />
      //     {/* <SearchIcon /> */}
      //     <span className='DocSearch-Button-Placeholder'>{buttonText}</span>
      //   </span>

      //   <span className='DocSearch-Button-Keys'>
      //     {key !== null && (
      //       <>
      //         <kbd className='DocSearch-Button-Key'>
      //           {key === ACTION_KEY_DEFAULT ? <KeyboardCommandKeyRounded /> : key}
      //           {/* {key === ACTION_KEY_DEFAULT ? <ControlKeyIcon /> : key} */}
      //         </kbd>
      //         <kbd className='DocSearch-Button-Key'>K</kbd>
      //       </>
      //     )}
      //   </span>
      // </button>
    );
  }
);
