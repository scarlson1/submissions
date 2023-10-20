import { forwardRef, useEffect, useState } from 'react';
import { SearchRounded } from '@mui/icons-material';
import { Box, Button, IconButton, styled } from '@mui/material';

// import { ControlKeyIcon } from './icons/ControlKeyIcon';
// import { SearchIcon } from './icons/SearchIcon';

const Shortcut = styled('div')(({ theme }) => {
  return {
    fontSize: theme.typography.pxToRem(12),
    fontWeight: 700,
    lineHeight: '20px',
    marginLeft: theme.spacing(1),
    border: `1px solid ${
      theme.palette.mode === 'dark' ? theme.palette.primaryDark[600] : theme.palette.grey[200]
    }`,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primaryDark[800] : '#FFF',
    padding: theme.spacing(0, 0.5),
    borderRadius: 7,
  };
});

export type ButtonTranslations = Partial<{
  buttonText: string;
  buttonAriaLabel: string;
}>;

export type DocSearchButtonProps = React.ComponentProps<'button'> & {
  translations?: ButtonTranslations;
  shortcutKey?: string;
};

const ACTION_KEY_DEFAULT = 'Ctrl+' as const;
const ACTION_KEY_APPLE = '⌘' as const;

function isAppleDevice() {
  return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
}

export const SearchButton = forwardRef<HTMLButtonElement, DocSearchButtonProps>(
  ({ translations = {}, shortcutKey = 'k', ...props }, ref) => {
    const { buttonText = 'Search', buttonAriaLabel = 'Search' } = translations;
    // TODO: deprecated ?? need to use navigator.userAgentData.platform ??
    // const macOS = window.navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const [key, setKey] = useState<typeof ACTION_KEY_APPLE | typeof ACTION_KEY_DEFAULT | null>(
      null
    );

    useEffect(() => {
      if (typeof navigator !== 'undefined') {
        isAppleDevice() ? setKey(ACTION_KEY_APPLE) : setKey(ACTION_KEY_DEFAULT);
      }
    }, []);

    return (
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
      (<>
        <IconButton
          sx={{ mx: { xs: 1, sm: 2, md: 3 }, display: { xs: 'flex', md: 'none' } }}
          onClick={props.onClick}
          color='primary'
          ref={ref}
        >
          <SearchRounded fontSize='small' />
        </IconButton>
        <Button
          aria-label={buttonAriaLabel}
          startIcon={<SearchRounded fontSize='small' />}
          {...props}
          color='primary'
          variant='outlined'
          ref={ref}
          sx={{
            display: { xs: 'none', md: 'flex' },
            maxWidth: 200,
            minWidth: { xs: 34, sm: 150 },
            px: 2,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.primaryDark[800]
                : theme.palette.grey[50],
          }}
          fullWidth={false}
        >
          <Box sx={{ ml: 2, mr: 'auto' }}>{buttonText}</Box>
          {/* <Shortcut>{macOS ? '⌘' : 'Ctrl+'}K</Shortcut> */}
          <Shortcut>
            {key}
            {shortcutKey.toUpperCase()}
          </Shortcut>
        </Button>
      </>)
    );
  }
);
