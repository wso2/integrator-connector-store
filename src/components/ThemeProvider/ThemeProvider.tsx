/*
 Copyright (c) 2026 WSO2 LLC. (http://www.wso2.com) All Rights Reserved.

 WSO2 LLC. licenses this file to you under the Apache License,
 Version 2.0 (the "License"); you may not use this file except
 in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/

import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { OxygenUIThemeProvider, CssBaseline } from '@wso2/oxygen-ui';
import { lightTheme, darkTheme } from '@/styles/theme';

interface ThemeContextType {
  darkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleTheme: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize with false to avoid hydration mismatch, will update on client
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Detect system theme preference on mount
  useEffect(() => {
    setMounted(true);

    let mediaQuery: MediaQueryList | null = null;
    let handleChange: ((e: MediaQueryListEvent) => void) | null = null;

    try {
      // Check if user has a saved preference in localStorage
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setDarkMode(savedTheme === 'dark');
      } else {
        // Use system preference if no saved preference
        try {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setDarkMode(prefersDark);
        } catch {
          // matchMedia not available, default to light mode
          setDarkMode(false);
        }
      }
    } catch {
      // localStorage not available, try system preference or default to light mode
      try {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
      } catch {
        setDarkMode(false);
      }
    }

    // Listen for system theme changes
    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      handleChange = (e: MediaQueryListEvent) => {
        // Only update if user hasn't manually set a preference
        try {
          if (!localStorage.getItem('theme')) {
            setDarkMode(e.matches);
          }
        } catch {
          // localStorage not available, follow system preference
          setDarkMode(e.matches);
        }
      };
      mediaQuery.addEventListener('change', handleChange);
    } catch {
      // matchMedia not available, skip listener setup
    }

    return () => {
      if (mediaQuery && handleChange) {
        try {
          mediaQuery.removeEventListener('change', handleChange);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      // Save user preference
      try {
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
      } catch {
        // localStorage not available, state update still works
      }
      return newMode;
    });
  };

  // Prevent flash of wrong theme by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <OxygenUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </OxygenUIThemeProvider>
    </ThemeContext.Provider>
  );
}
