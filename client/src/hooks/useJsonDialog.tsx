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
      base00: theme.palette.background.default, // "white", Default Background
      base01: theme.palette.grey[500], // "#ddd", Lighter Background (Used for status bars, line number and folding marks)
      base02: theme.palette.divider, // Selection Background
      base03: theme.palette.mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[700], // "#444", Comments, Invisible, Line Highlighting
      base04: theme.palette.mode === 'light' ? theme.palette.grey[400] : theme.palette.grey[700], // "purple", (Used for item count)

      base05:
        theme.palette.mode === 'light'
          ? theme.palette.primaryDark[500]
          : theme.palette.primaryDark[400], // Default Foreground, Caret, Delimiters, Operators
      base06: theme.palette.grey[200], // Light Foreground (Not often used)
      base07: theme.palette.text.secondary, // Text color
      base08: theme.palette.success.main, // Variables, XML Tags, Markup Link Text, Markup Lists, Diff Deleted
      base09: theme.palette.primary.main, // "rgba(70, 70, 230, 1)", Integers, Boolean, Constants, XML Attributes, Markup Link Url
      base0A:
        theme.palette.mode === 'dark' ? theme.palette.primary[300] : theme.palette.primary[600], // "rgba(70, 70, 230, 1)", Classes, Markup Bold, Search Text Background
      base0B: theme.palette.secondary.main, // "rgba(70, 70, 230, 1)", Strings, Inherited Class, Markup Code, Diff Inserted
      base0C: theme.palette.mode === 'light' ? theme.palette.grey[500] : theme.palette.grey[500], // "rgba(70, 70, 230, 1)", Array row count | Regular Expressions, Markup Quotes
      base0D: theme.palette.primaryDark[500], // "rgba(70, 70, 230, 1)", expand icon open
      base0E: theme.palette.primary.light, //  theme.palette.warning.dark, // "rgba(70, 70, 230, 1)", Keywords, Storage, Selector, Markup Italic, Diff Changed, booleans, carrot /expand icon closed
      base0F: theme.palette.error.light, // "rgba(70, 70, 230, 1)" Deprecated, Opening/Closing Embedded Language Tags, e.g. <?php ?>
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
