import { Box, GlobalStyles, Typography, alpha } from '@mui/material';
import { ReactNode, useCallback } from 'react';
import { Diff, Hunk, parseDiff } from 'react-diff-view';
import 'react-diff-view/style/index.css';
// @ts-ignore
import { diffJson, formatLines } from 'unidiff';

import { useDialog, useWidth } from 'hooks';

interface UseCompareJsonOptions {
  leftTitle?: string;
  rightTitle?: string;
}

export const useCompareJson = (
  onError?: (msg: string, err: any) => void,
  options?: UseCompareJsonOptions
) => {
  const dialog = useDialog();
  const { isMobile } = useWidth();

  const compare = useCallback(
    async (
      before: Record<string, any>,
      after: Record<string, any>,
      title: string = 'Compare',
      content?: ReactNode
    ) => {
      try {
        const diffTest = diffJson(before, after);
        const diffText = formatLines(diffTest, { context: 200 });
        const [diff] = parseDiff(diffText, { nearbySequences: 'zip' });

        await dialog?.prompt({
          catchOnCancel: false,
          variant: 'info',
          title,
          content: (
            <Box>
              <GlobalStyles
                styles={(theme) => ({
                  html: {
                    ':root': {
                      '.diff': {
                        fontSize: 12,
                      },
                      '--diff-background-color':
                        theme.palette.mode === 'dark'
                          ? theme.palette.primaryDark[800]
                          : theme.palette.grey[50],
                      '--diff-text-color': theme.palette.text.tertiary, // .secondary,
                      '--diff-font-family': 'Roboto, Courier, monospace',
                      '--diff-selection-background-color': '#b3d7ff',
                      '--diff-selection-text-color': theme.palette.text.primary,
                      '--diff-gutter-insert-background-color': alpha(
                        theme.palette.success[400],
                        0.5
                      ),
                      '--diff-gutter-insert-text-color': theme.palette.text.tertiary,
                      '--diff-gutter-delete-background-color': alpha(theme.palette.error[400], 0.5),
                      '--diff-gutter-delete-text-color': theme.palette.text.tertiary,
                      '--diff-gutter-selected-background-color': '#fffce0',
                      '--diff-gutter-selected-text-color': theme.palette.text.tertiary,
                      '--diff-code-insert-background-color': alpha(
                        theme.palette.success[400],
                        0.25
                      ),
                      '--diff-code-insert-text-color': theme.palette.text.primary,
                      '--diff-code-delete-background-color': alpha(theme.palette.error[400], 0.25),
                      '--diff-code-delete-text-color': theme.palette.text.primary,
                      '--diff-code-insert-edit-background-color': alpha(
                        theme.palette.success[400],
                        0.25
                      ),
                      '--diff-code-insert-edit-text-color': theme.palette.text.secondary,
                      '--diff-code-delete-edit-background-color': alpha(
                        theme.palette.error[400],
                        0.25
                      ),
                      '--diff-code-delete-edit-text-color': theme.palette.text.secondary,
                      '--diff-code-selected-background-color': '#fffce0',
                      '--diff-code-selected-text-color': theme.palette.text.primary,
                      '--diff-omit-gutter-line-color': '#cb2a1d',
                    },
                  },
                  body: {
                    '.diff-gutter-normal': {
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? theme.palette.primaryDark[900]
                          : theme.palette.grey[100],
                    },
                    '.diff-gutter-col': {
                      borderSpacing: '8px',
                    },
                  },
                })}
              />
              {content ?? null}
              {!isMobile && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-evenly',
                    position: 'sticky',
                    top: -16,
                    py: 2,
                    backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Typography variant='subtitle1' gutterBottom sx={{ flex: '1 0 auto', px: 8 }}>
                    {options?.leftTitle || 'Old'}
                  </Typography>
                  <Typography variant='subtitle1' gutterBottom sx={{ flex: '1 0 auto', px: 8 }}>
                    {options?.rightTitle || 'New'}
                  </Typography>
                </Box>
              )}
              <Diff
                viewType={isMobile ? 'unified' : 'split'}
                diffType='modify'
                hunks={diff.hunks || []}
              >
                {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
              </Diff>
            </Box>
          ),
          slotProps: { dialog: { maxWidth: 'md' } },
        });
      } catch (err: any) {
        console.log('Error display diff: ', err);
        if (onError) onError('Error displaying comparison', err);
      }
    },
    [dialog, isMobile, onError, options]
  );

  return compare;
};
