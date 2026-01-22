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
import { FormControl, InputLabel, Select, MenuItem } from '@wso2/oxygen-ui';
import {
  ArrowUp as ArrowUpwardIcon,
  ArrowDown as ArrowDownwardIcon,
} from '@wso2/oxygen-ui-icons-react';
import { SortOption } from '@/lib/connector-utils';

interface SortSelectorProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export default function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <FormControl size="medium" sx={{ minWidth: { xs: '100%', sm: 240 } }}>
      <InputLabel>Sort by</InputLabel>
      <Select
        value={value}
        label="Sort by"
        onChange={(e) => onChange(e.target.value as SortOption)}
        sx={{
          backgroundColor: 'background.paper',
        }}
      >
        <MenuItem value="name-asc">
          Name (A-Z) <ArrowUpwardIcon size={16} style={{ marginLeft: '8px' }} />
        </MenuItem>
        <MenuItem value="name-desc">
          Name (Z-A) <ArrowDownwardIcon size={16} style={{ marginLeft: '8px' }} />
        </MenuItem>
        <MenuItem value="pullCount-desc">
          Most Popular <ArrowDownwardIcon size={16} style={{ marginLeft: '8px' }} />
        </MenuItem>
        <MenuItem value="pullCount-asc">
          Least Popular <ArrowUpwardIcon size={16} style={{ marginLeft: '8px' }} />
        </MenuItem>
        <MenuItem value="date-desc">
          Newest First <ArrowDownwardIcon size={16} style={{ marginLeft: '8px' }} />
        </MenuItem>
        <MenuItem value="date-asc">
          Oldest First <ArrowUpwardIcon size={16} style={{ marginLeft: '8px' }} />
        </MenuItem>
      </Select>
    </FormControl>
  );
}
