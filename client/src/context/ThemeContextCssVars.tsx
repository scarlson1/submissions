import CssBaseline from '@mui/material/CssBaseline';
import {
  Experimental_CssVarsProvider as CssVarsProvider,
  experimental_extendTheme as extendTheme,
  PaletteColorOptions,
} from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
import * as React from 'react';

import { getDesignTokens, getThemedComponents } from './themeCssVars';

// import { getDesignTokens, getThemedComponents } from 'docs/src/modules/brandingTheme';

declare module '@mui/material/styles' {
  interface PaletteOptions {
    primaryDark?: PaletteColorOptions;
  }
}

const { palette: lightPalette, typography, ...designTokens } = getDesignTokens('light');
const { palette: darkPalette } = getDesignTokens('dark');

const theme = extendTheme({
  cssVarPrefix: 'idemand',
  colorSchemes: {
    light: {
      palette: lightPalette,
    },
    dark: {
      palette: darkPalette,
    },
  },
  ...designTokens,
  typography: deepmerge(typography, {
    h1: {
      ':where([data-mui-color-scheme="dark"]) &': {
        color: 'var(--idemand-palette-common-white)',
      },
    },
    h2: {
      ':where([data-mui-color-scheme="dark"]) &': {
        color: 'var(--idemand-palette-grey-100)',
      },
    },
    h5: {
      ':where([data-mui-color-scheme="dark"]) &': {
        color: 'var(--idemand-palette-primary-300)',
      },
    },
    // Temp fix --> Typography not using css vars unless color is explicitly set
    body1: {
      color: 'var(--idemand-palette-text-primary)',
    },
    body2: {
      color: 'var(--idemand-palette-text-secondary)',
    },
    caption: {
      color: 'var(--idemand-palette-text-secondary)',
    },
    // overline: {
    //     color: 'var(--idemand-palette-text-secondary)',
    // },
  }),
  ...getThemedComponents(),
});

export default function ThemeContextCssVars(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <CssVarsProvider theme={theme} defaultMode='system' disableTransitionOnChange>
      {/* <NextNProgressBar /> */}
      <CssBaseline />
      {children}
    </CssVarsProvider>
  );
}
