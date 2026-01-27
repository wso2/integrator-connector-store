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
import { Box, Select, MenuItem, Typography, Button, FormControl } from '@wso2/oxygen-ui';
import {
  ChevronLeft as NavigateBeforeIcon,
  ChevronRight as NavigateNextIcon,
} from '@wso2/oxygen-ui-icons-react';

type SortOption = 'name-asc' | 'name-desc' | 'pullCount-desc' | 'pullCount-asc' | 'date-desc' | 'date-asc';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 30, 50, 100],
  sortBy,
  onSortChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: { xs: 'wrap', lg: 'nowrap' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Per page
          </Typography>
          <FormControl size="small">
            <Select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1); // Reset to page 1 when page size changes
              }}
              inputProps={{
                'aria-label': 'Items per page',
              }}
              sx={{ minWidth: 100 }}
            >
              {pageSizeOptions.map((size) => (
                <MenuItem key={size} value={size}>
                  {size} Items
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Showing {totalItems > 0 ? startItem : 0}-{endItem} of {totalItems}
        </Typography>
      </Box>

      {/* Sort selector */}
      {sortBy && onSortChange && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Sort by
          </Typography>
          <FormControl size="small">
            <Select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              inputProps={{
                'aria-label': 'Sort by',
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="pullCount-desc">Most Popular</MenuItem>
              <MenuItem value="date-desc">Recently Updated</MenuItem>
              <MenuItem value="name-asc">Name A-Z</MenuItem>
              <MenuItem value="name-desc">Name Z-A</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Page navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          size="small"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          startIcon={<NavigateBeforeIcon />}
          sx={{ minWidth: 'auto' }}
        >
          Previous
        </Button>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2">...</Typography>
                </Box>
              ) : (
                <Button
                  size="small"
                  variant={currentPage === page ? 'contained' : 'outlined'}
                  onClick={() => onPageChange(page as number)}
                  sx={{
                    minWidth: '40px',
                    px: 1,
                  }}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </Box>

        <Button
          size="small"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          endIcon={<NavigateNextIcon />}
          sx={{ minWidth: 'auto' }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
