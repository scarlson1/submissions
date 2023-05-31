import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  responsiveFontSizes,
} from '@mui/material/styles';
import { PaletteMode as PaletteModeType, useMediaQuery } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

import { getDesignTokens, getThemedComponents } from 'modules/theme';
import { deepmerge } from '@mui/utils';
import { useLocalStorage } from 'hooks';

// https://github.com/mui/material-ui/blob/master/docs/src/modules/brandingTheme.ts
// https://github.com/mui/material-ui/blob/master/docs/src/modules/components/ThemeContext.js

interface ColorModeContextValue {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
}

export const ColorModeContext = React.createContext<ColorModeContextValue | undefined>(undefined);
// export const ColorModeContext = React.createContext({
//   mode: 'light',
//   toggleColorMode: () => {},
// });

export function ThemeProvider(props: any) {
  const { children } = props;
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [storageMode, setStorageMode] = useLocalStorage<'light' | 'dark' | undefined>(
    'iDemand-theme-mode'
  );
  const [mode, setMode] = useState<'light' | 'dark'>(
    storageMode ?? (prefersDarkMode ? 'dark' : 'light')
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (storageMode) return;

      setStorageMode(mode);
    }
  }, [prefersDarkMode, mode, storageMode, setStorageMode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setStorageMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
        setMode((prevMode: PaletteModeType) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [setStorageMode]
  );

  const theme = useMemo(() => {
    const brandingDesignTokens = getDesignTokens(mode);
    const mergedPalette = deepmerge(brandingDesignTokens.palette, {});
    let updatedTheme = createTheme({
      palette: {
        ...mergedPalette,
        mode: mode,
      },
      spacing: 4,
      shape: {
        borderRadius: 10,
      },
    });
    updatedTheme = deepmerge(updatedTheme, getThemedComponents(updatedTheme));
    updatedTheme = responsiveFontSizes(updatedTheme);

    return updatedTheme;
  }, [mode]);

  return (
    <MuiThemeProvider theme={theme}>
      <ColorModeContext.Provider value={{ toggleColorMode: colorMode.toggleColorMode, mode }}>
        <CssBaseline enableColorScheme />
        {children}
      </ColorModeContext.Provider>
    </MuiThemeProvider>
  );
}

export function useChangeTheme() {
  const colorMode = React.useContext(ColorModeContext);

  if (colorMode === undefined) {
    throw new Error('useChangeTheme must be used within ThemeProvider');
  }

  // return React.useCallback(() => colorMode.toggleColorMode(), [colorMode]);

  return colorMode;
}
