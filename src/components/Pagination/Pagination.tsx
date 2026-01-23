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
import { Box, Select, MenuItem, Typography, Button, FormControl, InputLabel } from '@wso2/oxygen-ui';
import {
  ChevronLeft as NavigateBeforeIcon,
  ChevronRight as NavigateNextIcon,
} from '@wso2/oxygen-ui-icons-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 30, 50, 100],
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
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        mt: 4,
        pt: 3,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      {/* Items per page selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Per page</InputLabel>
          <Select
            value={pageSize}
            label="Per page"
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <MenuItem key={size} value={size}>
                {size} items
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          Showing {startItem}-{endItem} of {totalItems}
        </Typography>
      </Box>

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
