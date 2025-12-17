'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

// WSO2 Design Tokens - Exact colors from wso2.com/integrator
const wso2Colors = {
  primary: '#ff7300',      // WSO2 Orange (primary brand color)
  primaryHover: '#ff7300',
  black: '#000000',        // Pure black for text and backgrounds
  white: '#ffffff',        // Pure white
  background: {
    light: '#f7f8fb',      // Light gray background (from body)
    dark: '#000000',       // Black background for dark mode
    paper: '#ffffff',      // White for cards
  },
  text: {
    primary: '#000000',    // Black text (headings)
    secondary: '#494848',  // Gray text (paragraphs)
    light: '#ffffff',      // White text
    dark: '#cccccc',       // Light gray for dark mode secondary text
  },
  border: {
    light: '#c6c6c6',      // Border color from site
    medium: '#ccc',
  },
};

const fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const commonTheme: ThemeOptions = {
  typography: {
    fontFamily,
    h1: {
      fontSize: '2.8rem',
      fontWeight: 700,
      lineHeight: '3.6rem',
      letterSpacing: '0.008rem',
      wordSpacing: '3px',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: '2.75rem',
      letterSpacing: '0.008rem',
      wordSpacing: '3px',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 400,
      lineHeight: '2.3rem',
      letterSpacing: '0.008rem',
      wordSpacing: '3px',
    },
    h4: {
      fontSize: '1.2rem',
      fontWeight: 400,
      lineHeight: '1.8rem',
      letterSpacing: '0.008rem',
      wordSpacing: '3px',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: '1.6rem',
      letterSpacing: '0.008rem',
      wordSpacing: '3px',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '5px',
          padding: '5px 18px 7px',
          fontSize: '14px',
          fontFamily,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...commonTheme,
  palette: {
    mode: 'light',
    primary: {
      main: wso2Colors.primary,
    },
    background: {
      default: wso2Colors.background.light,
      paper: wso2Colors.white,
    },
    text: {
      primary: wso2Colors.text.primary,
      secondary: wso2Colors.text.secondary,
    },
  },
});

export const darkTheme = createTheme({
  ...commonTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: wso2Colors.primary,
    },
    background: {
      default: wso2Colors.background.dark,  // Pure black like WSO2 site
      paper: '#1a1a1a',                     // Slightly lighter for cards
    },
    text: {
      primary: wso2Colors.text.light,       // White text
      secondary: wso2Colors.text.dark,      // Light gray text
    },
    divider: wso2Colors.border.medium,
  },
});
