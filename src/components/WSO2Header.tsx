import React from 'react';
import { Box } from '@mui/material';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import ThemeToggle from './ThemeToggle';
import { useThemeContext } from './ThemeProvider';

export default function WSO2Header() {
  const { darkMode, toggleTheme } = useThemeContext();

  return (
    <Box
      component="header"
      sx={{
        backgroundColor: '#fff', // Always white, like WSO2 site
        borderBottom: '1px solid #e0e0e0',
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <a href="https://wso2.com/" aria-label="WSO2 Home">
            <LazyLoadImage
              src="/images/wso2-logo.webp"
              alt="WSO2"
              width={100}
              height={39}
              effect="opacity"
              style={{ display: 'block' }}
            />
          </a>
        </Box>

        {/* Right side - Theme Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ThemeToggle darkMode={darkMode} onToggle={toggleTheme} />
        </Box>
      </Box>
    </Box>
  );
}
