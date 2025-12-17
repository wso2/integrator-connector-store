'use client';

import React from 'react';
import { Box } from '@mui/material';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';
import { useThemeContext } from './ThemeProvider';

export default function WSO2Header() {
  const { darkMode, toggleTheme } = useThemeContext();

  return (
    <Box
      component="header"
      sx={{
        backgroundColor: darkMode ? '#000' : '#fff',
        borderBottom: darkMode ? 'none' : '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
      }}
    >
      <Box
        sx={{
          maxWidth: '1280px',
          margin: '0 auto',
          px: { xs: 2, sm: 3 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left side - WSO2 Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <a href="https://wso2.com/" aria-label="WSO2 Home">
            <Image
              src="/images/wso2-logo.webp"
              alt="WSO2"
              width={100}
              height={39}
              style={{ display: 'block' }}
              priority
            />
          </a>

          {/* Connector Store Title - Only on larger screens */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: '1px',
                height: '32px',
                backgroundColor: darkMode ? '#333' : '#ddd',
              }}
            />
            <Box
              sx={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: darkMode ? '#fff' : '#000',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                letterSpacing: '0.008rem',
              }}
            >
              WSO2 Integrator Connector Store
            </Box>
          </Box>
        </Box>

        {/* Right side - Theme Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ThemeToggle darkMode={darkMode} onToggle={toggleTheme} />
        </Box>
      </Box>
    </Box>
  );
}
