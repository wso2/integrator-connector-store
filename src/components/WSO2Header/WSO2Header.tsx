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

import React from 'react';
import { Box, ColorSchemeToggle, AppBar, Container, Toolbar } from '@wso2/oxygen-ui';
import { Link } from 'react-router-dom';

interface WSO2HeaderProps {
  effectiveMode: 'light' | 'dark';
}

export default function WSO2Header({ effectiveMode }: WSO2HeaderProps) {
  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ height: 64 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* WSO2 Logo */}
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
                <Box
                  component="img"
                  src={effectiveMode === 'dark' ? '/images/Logo_WSO2-integrator-white.png' : '/images/Logo_WSO2-integrator-black.png'}
                  alt="WSO2 Integrator"
                  sx={{ 
                    height: 32,
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </Box>
            </Link>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ColorSchemeToggle />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
