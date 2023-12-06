import { ArrowDropDownRounded } from '@mui/icons-material';
import { Theme, ThemeOptions, alpha, createTheme } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
import type {} from '@mui/x-date-pickers/themeAugmentation';

// TODO: switch to using CSS vars
// https://github.com/mui/material-ui/blob/master/docs/src/modules/brandingTheme.ts
// Fonts to consider:
// Public Sans
// Avenir, Segoe UI, Roboto, Helvetica Neue, Noto Sans
// Nunito Sans

// Secondary grey text options
// #616161,

// kent c dodds
// light bg: #F3F6F8 (slightly darker shade: #E9EDF1)
// light feature color: #C3CCD4 (slightly darker grey)
// dark bg: #1A212A
// dark paper: #212B36
// dark feature color; #8D9DAB (grey)

// mui drawer nav selected: bgcolor: #1f262e, color: #66b2ff
// https://github.com/mui/material-ui/blob/master/docs/src/modules/components/AppNavDrawerItem.js
// lines 98 & 164: '&.app-drawer-active'
// content: "";
// display: block;
// position: absolute;
// z-index: 1;
// left: 9.5px;
// height: 100%;
// width: 1px;
// opacity: 1;
// background: rgba(31, 38, 46, 0.6); // rgb(229, 234, 242);

declare module '@mui/material/styles/createPalette' {
  interface ColorRange {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  }

  interface PaletteColor extends ColorRange {}

  interface Palette {
    primaryDark: PaletteColor;
  }

  interface TypeText {
    tertiary: string;
  }
}

declare module '@mui/material/styles/createTypography' {
  interface TypographyOptions {
    fontWeightSemiBold?: number;
    fontWeightExtraBold?: number;
    fontFamilyCode?: string;
  }

  interface Typography {
    fontWeightSemiBold: number;
    fontWeightExtraBold: number;
    fontFamilyCode: string;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    greyOutlined: true;
    greyText: true;
  }
}

const defaultTheme = createTheme();

export const blue = {
  50: '#F0F7FF',
  100: '#C2E0FF',
  200: '#99CCF3',
  300: '#66B2FF',
  400: '#3399FF',
  main: '#007FFF',
  500: '#007FFF',
  600: '#0072E5',
  700: '#0059B2',
  800: '#004C99',
  900: '#003A75',
};
// export const blueDark = {
//   50: '#E2EDF8',
//   100: '#CEE0F3',
//   200: '#91B9E3',
//   300: '#5090D3',
//   main: '#5090D3',
//   400: '#265D97',
//   500: '#1E4976',
//   600: '#173A5E',
//   700: '#132F4C',
//   800: '#001E3C',
//   900: '#0A1929',
// };
export const blueDark = {
  50: '#EAEDF1',
  100: '#DAE0E7',
  200: '#ACBAC8',
  300: '#7B91A7',
  main: '#7B91A7',
  400: '#4B5E71',
  500: '#3B4A59',
  600: '#2F3A46',
  700: '#1F262E',
  800: '#141A1F',
  900: '#101418', // #171D24 // #111418
};
const grey = {
  50: '#F3F6F9',
  100: '#E7EBF0',
  200: '#E0E3E7',
  300: '#CDD2D7',
  400: '#B2BAC2',
  500: '#A0AAB4',
  600: '#6F7E8C',
  700: '#3E5060',
  800: '#2D3843',
  900: '#1A2027',
};

const systemFont = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
];

export const getMetaThemeColor = (mode: 'light' | 'dark') => {
  const themeColor = {
    light: grey[50],
    dark: blueDark[800],
  };
  return themeColor[mode];
};

export const getDesignTokens = (mode: 'light' | 'dark') =>
  ({
    palette: {
      primary: {
        ...blue,
        ...(mode === 'dark' && {
          main: blue[400],
        }),
      },
      secondary: {
        main: '#FF007F',
      },
      divider: mode === 'dark' ? alpha(blue[100], 0.08) : grey[100],
      primaryDark: blueDark,
      mode,
      ...(mode === 'dark' && {
        background: {
          default: blueDark[800], // default: blueDark[900],
          paper: blueDark[900],
        },
      }),
      ...(mode === 'light' && {
        background: {
          default: '#FAFAFB',
          paper: '#FFF',
        },
      }),
      common: {
        black: '#1D1D1D',
      },
      ...(mode === 'light' && {
        text: {
          primary: grey[900],
          secondary: grey[700],
          tertiary: grey[600],
        },
      }),
      ...(mode === 'dark' && {
        text: {
          primary: '#fff',
          secondary: grey[400],
          tertiary: grey[400],
        },
      }),
      grey: {
        ...grey,
        ...(mode === 'light' && {
          main: grey[100],
          contrastText: grey[600],
        }),
        ...(mode === 'dark' && {
          main: grey[700],
          contrastText: grey[600],
        }),
      },
      error: {
        50: '#FFF0F1',
        100: '#FFDBDE',
        200: '#FFBDC2',
        300: '#FF99A2',
        400: '#FF7A86',
        500: '#FF505F',
        main: '#EB0014',
        600: '#EB0014',
        700: '#C70011',
        800: '#94000D',
        900: '#570007',
      },
      success: {
        50: '#E9FBF0',
        100: '#C6F6D9',
        200: '#9AEFBC',
        300: '#6AE79C',
        400: '#3EE07F',
        500: '#21CC66',
        600: '#1DB45A',
        ...(mode === 'dark' && {
          main: '#1DB45A',
        }),
        ...(mode === 'light' && {
          main: '#1AA251',
        }),
        700: '#1AA251',
        800: '#178D46',
        900: '#0F5C2E',
      },
      warning: {
        50: '#FFF9EB',
        100: '#FFF3C1',
        200: '#FFECA1',
        300: '#FFDC48',
        400: '#F4C000',
        500: '#DEA500',
        main: '#DEA500',
        600: '#D18E00',
        700: '#AB6800',
        800: '#8C5800',
        900: '#5A3600',
      },
      gradients: {
        lightGrayRadio:
          'radial-gradient(50% 50% at 50% 50%, #F0F7FF 0%, rgba(240, 247, 255, 0.05) 100%)',
        stylizedRadio:
          mode === 'dark'
            ? 'linear-gradient(rgba(0 0 0 / 0.1), rgba(0 0 0 / 0.1)), linear-gradient(254.86deg, rgba(0, 58, 117, 0.18) 0%, rgba(11, 13, 14, 0.3) 49.98%, rgba(0, 76, 153, 0.21) 100.95%)'
            : 'linear-gradient(rgba(255 255 255 / 0.3), rgba(255 255 255 / 0.3)), linear-gradient(254.86deg, rgba(194, 224, 255, 0.12) 0%, rgba(194, 224, 255, 0.12) 0%, rgba(255, 255, 255, 0.3) 49.98%, rgba(240, 247, 255, 0.3) 100.95%)',
        linearSubtle:
          mode === 'light'
            ? `linear-gradient(to top right, ${alpha(blue[50], 0.3)} 40%, ${alpha(
                grey[50],
                0.2
              )} 100%)`
            : `linear-gradient(to top right, ${alpha(blue[900], 0.1)} 40%, ${alpha(
                blueDark[800],
                0.2
              )} 100%)`,
      },
    },
    shape: {
      borderRadius: 8,
    },
    spacing: 4,
    typography: {
      fontFamily: ['"IBM Plex Sans"', ...systemFont].join(','),
      fontFamilyCode: ['Consolas', 'Menlo', 'Monaco', '"Droid Sans Mono"', 'monospace'].join(','),
      fontFamilyTagline: ['"PlusJakartaSans-ExtraBold"', ...systemFont].join(','),
      fontFamilySystem: systemFont.join(','),
      fontWeightSemiBold: 600,
      fontWeightExtraBold: 800,
      h1: {
        fontFamily: ['"General Sans"', ...systemFont].join(','),
        fontSize: 'clamp(2.5rem, 1.125rem + 3.5vw, 3.5em)',
        fontWeight: 600,
        lineHeight: 78 / 70,
        letterSpacing: -0.2,
        ...(mode === 'light' && {
          color: blueDark[900],
        }),
      },
      h2: {
        fontFamily: ['"General Sans"', ...systemFont].join(','),
        fontSize: 'clamp(1.5rem, 0.9643rem + 1.4286vw, 2.25rem)',
        fontWeight: 600,
        lineHeight: 44 / 36,
        letterSpacing: -0.2,
        color: mode === 'dark' ? grey[100] : blueDark[700],
      },
      h3: {
        fontFamily: ['"General Sans"', ...systemFont].join(','),
        fontSize: defaultTheme.typography.pxToRem(36),
        lineHeight: 44 / 36,
        letterSpacing: 0.2,
      },
      h4: {
        fontFamily: ['"General Sans"', ...systemFont].join(','),
        fontSize: defaultTheme.typography.pxToRem(30),
        lineHeight: 42 / 28,
        letterSpacing: 0.2,
      },
      h5: {
        fontSize: defaultTheme.typography.pxToRem(24),
        lineHeight: 36 / 24,
        letterSpacing: 0.1,
        color: mode === 'dark' ? blue[300] : blue.main,
      },
      h6: {
        fontSize: defaultTheme.typography.pxToRem(20),
        lineHeight: 30 / 20,
      },
      button: {
        textTransform: 'initial',
        fontWeight: 700,
        letterSpacing: 0,
      },
      subtitle1: {
        fontSize: defaultTheme.typography.pxToRem(18),
        lineHeight: 24 / 18,
        letterSpacing: 0,
        fontWeight: 500,
      },
      body1: {
        fontSize: defaultTheme.typography.pxToRem(16),
        lineHeight: 24 / 16,
        letterSpacing: 0,
      },
      body2: {
        fontSize: defaultTheme.typography.pxToRem(14),
        lineHeight: 21 / 14,
        letterSpacing: 0,
        color: mode === 'dark' ? grey[400] : grey[700],
      },
      caption: {
        display: 'inline-block',
        fontSize: defaultTheme.typography.pxToRem(12),
        lineHeight: 18 / 12,
        letterSpacing: 0,
        fontWeight: 700,
      },
      overline: {
        fontSize: defaultTheme.typography.pxToRem(12),
        lineHeight: 24 / 12,
        color: mode === 'dark' ? grey[400] : grey[700],
      },
    },
  } as ThemeOptions);

export function getThemedComponents(theme: Theme): {
  components: Theme['components'];
} {
  return {
    components: {
      MuiButtonBase: {
        defaultProps: {
          disableTouchRipple: true,
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          sizeLarge: {
            padding: '0.875rem 1rem',
            ...theme.typography.body1,
            lineHeight: 21 / 16,
            fontWeight: 700,
          },
          outlinedSecondary: {
            color:
              theme.palette.mode === 'dark'
                ? theme.palette.primaryDark[100]
                : theme.palette.text.secondary,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? theme.palette.primaryDark[700]
                : alpha(theme.palette.primaryDark[50], 0.3),
            borderColor:
              theme.palette.mode === 'dark'
                ? theme.palette.primaryDark[600]
                : theme.palette.primaryDark[100],
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0px 2px 2px #0B0D0E, inset 0px 4px 4px rgba(20, 25, 31, 0.3)'
                : `0px 2px 2px ${alpha(
                    theme.palette.primaryDark[100],
                    0.2
                  )}, inset 0px 4px 4px ${alpha(theme.palette.primaryDark[100], 0.2)}`,
            '&:hover': {
              background:
                theme.palette.mode === 'dark'
                  ? theme.palette.primaryDark[600]
                  : theme.palette.primaryDark[50],
              borderColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.primaryDark[600]
                  : theme.palette.primaryDark[100],
            },
          },
          outlinedPrimary: {
            color:
              theme.palette.mode === 'dark'
                ? theme.palette.primary[200]
                : theme.palette.primary[500],
            backgroundColor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.primary[900], 0.4)
                : alpha(theme.palette.primary[50], 0.3),
            borderColor:
              theme.palette.mode === 'dark'
                ? theme.palette.primary[900]
                : theme.palette.primary[100],
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0px 2px 2px #0B0D0E, inset 0px 4px 4px rgba(20, 25, 31, 0.3)'
                : `0px 2px 2px ${alpha(theme.palette.primary[100], 0.2)}, inset 0px 4px 4px ${alpha(
                    theme.palette.primary[100],
                    0.1
                  )}`,
            '&:hover': {
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.primary[900]
                  : theme.palette.primary[50],
              borderColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.primary[700]
                  : theme.palette.primary[300],
            },
          },
          sizeMedium: {
            '& .MuiButton-startIcon': {
              marginLeft: 0,
            },
          },
          sizeSmall: {
            padding: theme.spacing(2, 2), // theme.spacing(1, 2),
            // marginLeft: theme.spacing(-1),
          },
          containedPrimary: {
            backgroundColor: theme.palette.primary[500],
            color: '#fff',
          },
          // containedPrimary: {
          //   background:
          //     theme.palette.mode === 'dark'
          //       ? `linear-gradient(180deg, ${theme.palette.primary[500]} 0%, ${theme.palette.primary[400]} 100%)`
          //       : `linear-gradient(180deg, ${theme.palette.primary[500]} 0%, ${theme.palette.primary[600]} 100%)`,
          //   border: '1px solid',
          //   borderColor: theme.palette.primary[400],
          //   boxShadow:
          //     theme.palette.mode === 'dark'
          //       ? `0px 2px 4px ${alpha(theme.palette.common.black, 0.8)}, inset 0px 4px 8px ${alpha(
          //           theme.palette.primary[200],
          //           0.4
          //         )}`
          //       : `0px 2px 4px ${alpha(theme.palette.primary[700], 0.2)}, inset 0px 4px 8px ${alpha(
          //           theme.palette.primary[200],
          //           0.4
          //         )}`,
          //   textShadow: `0px 1px 1px ${alpha(theme.palette.grey[900], 0.3)}`,
          //   '&:hover': {
          //     background: `linear-gradient(180deg, ${theme.palette.primary[500]} 0%, ${theme.palette.primary[400]} 100%)`,
          //     boxShadow:
          //       '0px 0px 8px rgba(0, 127, 255, 0.2), inset 0px 4px 8px rgba(102, 178, 255, 0.4)',
          //   },
          // },
        },
        variants: [
          {
            // @ts-ignore internal repo module augmentation issue
            props: { variant: 'code' },
            style: {
              color:
                theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[800],
              border: '1px solid',
              borderColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.primaryDark[400]
                  : theme.palette.grey[300],
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.primaryDark[700]
                  : theme.palette.grey[50],
              fontFamily: theme.typography.fontFamilyCode,
              fontWeight: 400,
              fontSize: defaultTheme.typography.pxToRem(13), // 14px
              lineHeight: 21 / 14,
              letterSpacing: 0,
              WebkitFontSmoothing: 'subpixel-antialiased',
              '&:hover, &.Mui-focusVisible': {
                borderColor: theme.palette.primary.main,
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.primaryDark[600]
                    : theme.palette.primary[50],
                '& .MuiButton-endIcon': {
                  color:
                    theme.palette.mode === 'dark'
                      ? theme.palette.primary[300]
                      : theme.palette.primary.main,
                },
              },
              '& .MuiButton-startIcon': {
                color:
                  theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[700], // theme.palette.grey[400],
              },
              '& .MuiButton-endIcon': {
                display: 'inline-block',
                position: 'absolute',
                right: 0,
                marginRight: 10,
                color:
                  theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[700],
              },
            },
          },
          {
            // @ts-ignore internal repo module augmentation issue
            props: { variant: 'link' },
            style: {
              fontSize: theme.typography.pxToRem(14),
              fontWeight: 700,
              color:
                theme.palette.mode === 'dark'
                  ? theme.palette.primary[300]
                  : theme.palette.primary[600],
              mb: 1,
              '& svg': {
                ml: -0.5,
              },
            },
          },
          {
            props: { variant: 'greyText' },
            style: {
              color:
                theme.palette.mode === 'dark' ? theme.palette.grey[300] : theme.palette.grey[600],
              border: 0,
              '&:hover, &.Mui-focusVisible': {
                color:
                  theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[700],
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.grey[100], 0.08)
                    : alpha(theme.palette.grey[200], 0.3),
              },
            },
          },
        ],
      },
      MuiIconButton: {
        variants: [
          {
            props: { color: 'primary' },
            style: {
              height: 34,
              width: 34,
              border: `1px solid ${
                theme.palette.mode === 'dark'
                  ? theme.palette.primaryDark[700]
                  : theme.palette.grey[200]
              }`,
              borderRadius: theme.shape.borderRadius,
              color:
                theme.palette.mode === 'dark'
                  ? theme.palette.primary[300]
                  : theme.palette.primary[500],
              '&:hover': {
                borderColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.primaryDark[600]
                    : theme.palette.grey[300],
                background:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primaryDark[700], 0.4)
                    : theme.palette.grey[50],
              },
            },
          },
        ],
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            minWidth: 160,
            color: theme.palette.text.secondary,
            backgroundImage: 'none',
            backgroundColor:
              theme.palette.mode === 'dark'
                ? theme.palette.primaryDark[900]
                : theme.palette.background.paper,
            border: `1px solid ${
              theme.palette.mode === 'dark'
                ? theme.palette.primaryDark[700]
                : theme.palette.grey[200]
            }`,
            '& li:first-of-type': {
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
            },
            '& li:last-of-type': {
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
            },
            '& .MuiList-Root': {
              borderRadius: 'inherit',
            },
            '& .MuiMenuItem-root': {
              fontSize: theme.typography.pxToRem(14),
              fontWeight: 500,
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primaryDark[600], 0.75)
                    : theme.palette.grey[50],
              },
              '&:focus': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primaryDark[600], 0.5)
                    : alpha(theme.palette.grey[50], 0.6),
              },
              '&.Mui-selected': {
                fontWeight: 500,
                color:
                  theme.palette.mode === 'dark'
                    ? theme.palette.primary[300]
                    : theme.palette.primary[600],
                // backgroundColor:
                //   theme.palette.mode === 'dark'
                //     ? theme.palette.primaryDark[700]
                //     : alpha(theme.palette.primary[100], 0.6),
              },
            },
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            boxShadow: `0px 4px 20px ${
              theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(170, 180, 190, 0.3)'
            }`,
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            [theme.breakpoints.up('md')]: {
              paddingLeft: theme.spacing(4),
              paddingRight: theme.spacing(4),
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.primary[100], 0.08)
                : theme.palette.grey[100],
          },
        },
      },
      MuiLink: {
        defaultProps: {
          underline: 'none',
        },
        styleOverrides: {
          root: {
            color:
              theme.palette.mode === 'dark'
                ? theme.palette.primary[300]
                : theme.palette.primary[600],
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            '&:hover': {
              color:
                theme.palette.mode === 'dark'
                  ? theme.palette.primary[200]
                  : theme.palette.primary[700],
            },
            '&.MuiTypography-body1 > svg': {
              marginTop: 2,
            },
            '& svg:last-child': {
              marginLeft: 2,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          // sizeSmall: {
          //   marginLeft: theme.spacing(1),
          // },
          root: ({ ownerState: { color, variant, size } }) => ({
            fontWeight: 500,
            ...(size === 'small' && {
              '& .MuiSvgIcon-root': {
                marginLeft: theme.spacing(1),
              },
            }),
            ...(variant === 'outlined' &&
              color === 'default' && {
                color:
                  theme.palette.mode === 'dark' ? theme.palette.grey[300] : theme.palette.grey[900],
                backgroundColor: 'transparent',
                borderColor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.grey[100], 0.1)
                    : theme.palette.grey[200],
                '&:hover': {
                  color:
                    theme.palette.mode === 'dark'
                      ? theme.palette.grey[300]
                      : theme.palette.grey[900],
                },
              }),
            ...(variant === 'outlined' &&
              color === 'primary' && {
                '&:hover': {
                  color: theme.palette.primary[500],
                },
              }),
            ...(variant === 'filled' &&
              color === 'default' && {
                border: '1px solid transparent',
                color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary[700],
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primaryDark[500], 0.8)
                    : alpha(theme.palette.primary[100], 0.5),
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? theme.palette.primaryDark[600]
                      : theme.palette.primary[100],
                },
              }),
            // @ts-ignore internal repo module augmentation issue
            ...(variant === 'light' && {
              ...(color === 'default' && {
                color:
                  theme.palette.mode === 'dark'
                    ? theme.palette.primary[200]
                    : theme.palette.primary[700],
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primaryDark[700], 0.5)
                    : alpha(theme.palette.primary[100], 0.3),
              }),
              ...(color === 'warning' && {
                color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.warning[900],
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.warning[900]
                    : theme.palette.warning[100],
              }),
              ...(color === 'success' && {
                color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.success[900],
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.success[900]
                    : theme.palette.success[100],
              }),
            }),
          }),
          deleteIcon: {
            color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary[700],
            '&:hover': {
              color:
                theme.palette.mode === 'dark'
                  ? theme.palette.grey[100]
                  : theme.palette.primary[900],
            },
          },
        },
      },
      MuiList: {
        styleOverrides: {
          root: {
            padding: 0,
          },
        },
      },
      MuiListItemButton: {
        // styleOverrides: {
        //   root: sx({
        //     borderRadius: 1,
        //   }),
        // },
        styleOverrides: {
          root: {
            padding: '8px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: theme.typography.pxToRem(14),
            color:
              theme.palette.mode === 'dark' ? theme.palette.grey[300] : theme.palette.grey[700],
            '&:hover': {
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primaryDark[400], 0.4)
                  : alpha(theme.palette.grey[100], 0.4),
            },
            '&.Mui-selected': {
              color: theme.palette.primary.main, // theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary[500],
              borderRadius: 10,
              border: '1px solid',
              borderColor:
                theme.palette.mode === 'dark'
                  ? `${theme.palette.primary[700]} !important`
                  : `${theme.palette.primary[500]} !important`,
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.primaryDark[600]
                  : theme.palette.primary[50],
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: 40,
          },
        },
      },
      MuiSelect: {
        defaultProps: {
          IconComponent: ArrowDropDownRounded,
        },
        styleOverrides: {
          iconFilled: {
            top: 'calc(50% - .25em)',
          },
        },
      },
      MuiTab: {
        defaultProps: {
          disableTouchRipple: true,
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.primaryDark[900], 0.65)
                : 'rgba(255,255,255,0.65)',
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            [theme.breakpoints.down('md')]: {
              height: '60px',
              minHeight: '60px',
            },
            [theme.breakpoints.down('sm')]: {
              height: '52px',
              minHeight: '52px',
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          variant: 'outlined',
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor:
              theme.palette.mode === 'dark' ? theme.palette.primaryDark[900] : '#fff',
            '&[href]': {
              textDecorationLine: 'none',
            },
          },
          outlined: {
            display: 'block',
            borderColor:
              theme.palette.mode === 'dark'
                ? theme.palette.primaryDark[500]
                : theme.palette.grey[200],
            ...(theme.palette.mode === 'dark' && {
              backgroundColor: theme.palette.primaryDark[700],
            }),
            'a&, button&': {
              '&:hover': {
                boxShadow: `0px 4px 20px ${
                  theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(170, 180, 190, 0.3)'
                }`,
              },
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: theme.spacing(2, 4),
            borderColor: theme.palette.divider,
          },
          head: {
            color: theme.palette.text.primary,
            fontWeight: 700,
          },
          body: {
            color: theme.palette.text.secondary,
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor:
              theme.palette.mode === 'dark' ? theme.palette.primaryDark[900] : '#fff',
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            color:
              theme.palette.mode === 'dark' ? theme.palette.grey[300] : theme.palette.grey[700],
            borderColor:
              theme.palette.mode === 'dark'
                ? theme.palette.primaryDark[500]
                : theme.palette.grey[200],
            '&.Mui-selected': {
              color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary[500],
              borderColor:
                theme.palette.mode === 'dark'
                  ? `${theme.palette.primary[700]} !important`
                  : `${theme.palette.primary[500]} !important`,
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.primaryDark[700]
                  : theme.palette.primary[50],
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.primaryDark[600]
                    : theme.palette.primary[100],
              },
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            padding: '5px 9px',
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 32,
            height: 20,
            padding: 0,
            '& .MuiSwitch-switchBase': {
              '&.Mui-checked': {
                transform: 'translateX(11px)',
                color: '#fff',
              },
            },
          },
          switchBase: {
            height: 20,
            width: 20,
            padding: 0,
            color: '#fff',
            '&.Mui-checked + .MuiSwitch-track': {
              opacity: 1,
            },
          },
          track: {
            opacity: 1,
            borderRadius: 32,
            backgroundColor:
              theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[400],
          },
          thumb: {
            flexShrink: 0,
            width: '14px',
            height: '14px',
          },
        },
      },
      MuiPaginationItem: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            color:
              theme.palette.mode === 'dark' ? theme.palette.grey[300] : theme.palette.grey[700],
            borderColor:
              theme.palette.mode === 'dark'
                ? theme.palette.primaryDark[500]
                : theme.palette.grey[200],
            '&.Mui-selected': {
              color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary[500],
              borderColor:
                theme.palette.mode === 'dark'
                  ? `${theme.palette.primary[700]} !important`
                  : `${theme.palette.primary[500]} !important`,
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.primaryDark[700]
                  : theme.palette.primary[50],
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.primaryDark[600]
                    : theme.palette.primary[100],
              },
            },
          },
        },
      },
      MuiDataGrid: {
        defaultProps: {
          variant: 'outlined',
        },
        styleOverrides: {
          root: {
            '.MuiDataGrid-cell:hover, .MuiDataGrid-cellContent:hover': {
              cursor: 'pointer',
            },
            backgroundColor: theme.palette.background.paper,
            borderColor:
              theme.palette.mode === 'dark'
                ? theme.palette.primaryDark[500]
                : theme.palette.grey[200],
            '.MuiDataGrid-columnSeparator': {
              color:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary[100], 0.08)
                  : theme.palette.grey[100],
            },
            '.MuiDataGrid-columnHeaders, .MuiDataGrid-cell, .MuiDataGrid-footerContainer': {
              borderColor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary[100], 0.08)
                  : theme.palette.grey[100],
            },
          },
          outlined: {
            display: 'block',
            borderColor:
              theme.palette.mode === 'dark'
                ? theme.palette.primaryDark[500]
                : theme.palette.grey[200],
            ...(theme.palette.mode === 'dark' && {
              backgroundColor: theme.palette.primaryDark[700],
            }),
            'a&, button&': {
              '&:hover': {
                boxShadow: `0px 4px 20px ${
                  theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(170, 180, 190, 0.3)'
                }`,
              },
            },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            padding: theme.spacing(0, 4),
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            padding: theme.spacing(3, 4),
          },
        },
      },
      MuiCssBaseline: {
        defaultProps: {
          enableColorScheme: true,
        },
      },
    },
  };
}

const darkTheme = createTheme(getDesignTokens('dark'));
export const brandingDarkTheme = deepmerge(darkTheme, getThemedComponents(darkTheme));
