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

// @wso2/oxygen-ui ships an ESM-only bundle that Jest (CJS) can't parse.
// Proxy to @mui/material which oxygen-ui wraps and which has a CJS build.
const mui = require('@mui/material');
const muiStyles = require('@mui/material/styles');

module.exports = {
  ...mui,
  ...muiStyles,
  extendTheme: muiStyles.extendTheme || (() => ({})),
  OxygenUIThemeProvider: mui.ThemeProvider,
  useColorScheme: muiStyles.useColorScheme || (() => ({ mode: 'light', setMode: () => {} })),
};
