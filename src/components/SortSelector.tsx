'use client';

import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { SortOption } from '@/lib/connector-utils';

interface SortSelectorProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export default function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
      <InputLabel>Sort by</InputLabel>
      <Select
        value={value}
        label="Sort by"
        onChange={(e) => onChange(e.target.value as SortOption)}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
          },
        }}
      >
        <MenuItem value="name-asc">
          Name (A-Z) <ArrowUpwardIcon fontSize="small" sx={{ ml: 1 }} />
        </MenuItem>
        <MenuItem value="name-desc">
          Name (Z-A) <ArrowDownwardIcon fontSize="small" sx={{ ml: 1 }} />
        </MenuItem>
        <MenuItem value="pullCount-desc">
          Most Popular <ArrowDownwardIcon fontSize="small" sx={{ ml: 1 }} />
        </MenuItem>
        <MenuItem value="pullCount-asc">
          Least Popular <ArrowUpwardIcon fontSize="small" sx={{ ml: 1 }} />
        </MenuItem>
        <MenuItem value="date-desc">
          Newest First <ArrowDownwardIcon fontSize="small" sx={{ ml: 1 }} />
        </MenuItem>
        <MenuItem value="date-asc">
          Oldest First <ArrowUpwardIcon fontSize="small" sx={{ ml: 1 }} />
        </MenuItem>
      </Select>
    </FormControl>
  );
}
