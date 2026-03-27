import ReactJson from '@microlink/react-json-view';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

import { DialogOptions } from 'context';
import { isJSON } from 'modules/utils/helpers';
import { useDialog } from './useDialog';
import { useCopyToClipboard } from './utils/useCopyToClipboard';

export const useJsonTheme = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      base00: theme.vars.palette.background.default, // Default Background
      base01: theme.vars.palette.grey[500], //  Lighter Background (Used for status bars, line number and folding marks)
      base02: theme.vars.palette.divider, // Selection Background
      base03:
        theme.palette.mode === 'light'
          ? theme.vars.palette.grey[300]
          : theme.vars.palette.grey[700], // Comments, Invisible, Line Highlighting
      base04:
        theme.palette.mode === 'light'
          ? theme.vars.palette.grey[400]
          : theme.vars.palette.grey[700], // (Used for item count)
      base05:
        theme.palette.mode === 'light'
          ? theme.vars.palette.primaryDark[500]
          : theme.vars.palette.primaryDark[400], // Default Foreground, Caret, Delimiters, Operators
      base06: theme.vars.palette.grey[200], // Light Foreground (Not often used)
      base07: theme.vars.palette.text.secondary, // Text color
      base08: theme.vars.palette.success.main, // Variables, XML Tags, Markup Link Text, Markup Lists, Diff Deleted
      base09: theme.vars.palette.primary.main, // Integers, Boolean, Constants, XML Attributes, Markup Link Url
      base0A:
        theme.palette.mode === 'dark'
          ? theme.vars.palette.primary[300]
          : theme.vars.palette.primary[600], // Classes, Markup Bold, Search Text Background
      base0B: theme.vars.palette.warning.main, //  Strings, Inherited Class, Markup Code, Diff Inserted
      base0C: theme.palette.grey[500], //  Array row count | Regular Expressions, Markup Quotes
      base0D: theme.vars.palette.primaryDark[500], // expand icon open
      base0E: theme.vars.palette.primary.light, // Keywords, Storage, Selector, Markup Italic, Diff Changed, booleans, carrot /expand icon closed
      base0F: theme.vars.palette.error.light, // Deprecated, Opening/Closing Embedded Language Tags, e.g. <?php ?>
    }),
    [theme.palette]
  );
};

export const useJsonDialog = (props?: Partial<Omit<DialogOptions, 'onSubmit' | 'content'>>) => {
  const dialog = useDialog();
  const [, copy] = useCopyToClipboard();
  const jsonTheme = useJsonTheme();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const showJson = useCallback(
    async (data: any, title: string) => {
      if (isJSON(data)) return toast.error('Provided data is not valid JSON');

      await dialog.prompt({
        variant: 'info',
        title,
        catchOnCancel: false,
        ...props,
        content: (
          <Box
            sx={{
              typography: 'body2',
            }}
          >
            <ReactJson
              src={data}
              style={{ backgroundColor: 'inherit' }}
              theme={jsonTheme}
              // theme={theme.palette.mode === 'dark' ? 'tomorrow' : 'rjv-default'}
              iconStyle='circle'
              enableClipboard={(data) => copy(data.src, true)}
              collapseStringsAfterLength={30}
            />
          </Box>
        ),
        slotProps: {
          ...(props?.slotProps || {}),
          dialog: {
            fullScreen,
            ...(props?.slotProps?.dialog || {}),
          },
        },
      });
    },
    [dialog, jsonTheme, fullScreen, copy, props]
  );

  return showJson;
};

// TODO: custom theme:
//    - https://github.com/chriskempson/base16/blob/main/styling.md
//    - https://github.com/mac-s-g/react-json-view/blob/7c154b9a7d83ea89dce2c171ebdf4d163ff49233/dev-server/src/index.js#L135
