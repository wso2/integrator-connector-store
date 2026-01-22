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
import { Box, ColorSchemeToggle } from '@wso2/oxygen-ui';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

export default function WSO2Header() {
  return (
    <Box
      component="header"
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
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

        {/* Right side - Color Scheme Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ColorSchemeToggle />
        </Box>
      </Box>
    </Box>
  );
}
