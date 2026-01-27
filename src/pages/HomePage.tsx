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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useColorScheme } from '@wso2/oxygen-ui';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Card,
  CardContent,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  ColorSchemeToggle,
} from '@wso2/oxygen-ui';
import {
  Search,
  ChevronDown,
  Download,
  Clock,
  Zap,
  Shield,
  Globe,
} from '@wso2/oxygen-ui-icons-react';
import { BallerinaPackage, FilterOptions } from '@/types/connector';
import { searchPackages, fetchFiltersProgressively, SortOption } from '@/lib/rest-client';
import { parseConnectorMetadata } from '@/lib/connector-utils';
import Pagination from '@/components/Pagination';

// WSO2 brand colors
const WSO2_ORANGE = '#FF7300';

// Valid sort options for validation
const VALID_SORT_OPTIONS: SortOption[] = [
  'name-asc',
  'name-desc',
  'pullCount-desc',
  'pullCount-asc',
  'date-desc',
  'date-asc',
];

// Default values
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 30;
const DEFAULT_SORT: SortOption = 'pullCount-desc';
const MAX_PAGE_SIZE = 100;

/**
 * Validate and parse page number from URL parameter
 */
function parsePageParam(value: string | null): number {
  if (!value) return DEFAULT_PAGE;
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 1) {
    return DEFAULT_PAGE;
  }
  return Math.floor(parsed);
}

/**
 * Validate and parse page size from URL parameter
 */
function parsePageSizeParam(value: string | null): number {
  if (!value) return DEFAULT_PAGE_SIZE;
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.max(1, Math.floor(parsed)), MAX_PAGE_SIZE);
}

/**
 * Validate sort option from URL parameter
 */
function parseSortParam(value: string | null): SortOption {
  if (!value) return DEFAULT_SORT;
  if (VALID_SORT_OPTIONS.includes(value as SortOption)) {
    return value as SortOption;
  }
  return DEFAULT_SORT;
}

/**
 * Format date to relative time
 */
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    const years = Math.floor(diffInDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  } catch {
    return dateString;
  }
}

/**
 * Format pull count to human-readable format
 */
function formatPullCount(count: number | undefined): string {
  if (!count) return '0';
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

/**
 * Get icon letter from connector name
 */
function getIconLetter(name: string): string {
  const parts = name.split('.');
  return parts[parts.length - 1]?.charAt(0).toUpperCase() || 'C';
}

/**
 * Get icon background color based on name
 */
function getIconColor(name: string): string {
  const colors = ['#DC2626', '#2563EB', '#16A34A', '#9333EA', '#EA580C', '#52525B'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { mode } = useColorScheme();
  
  // Handle system mode by detecting actual system preference
  const [effectiveMode, setEffectiveMode] = useState<'light' | 'dark'>(() => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode as 'light' | 'dark';
  });

  // Update effectiveMode when mode changes
  useEffect(() => {
    if (mode === 'system') {
      setEffectiveMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      setEffectiveMode(mode as 'light' | 'dark');
    }
  }, [mode]);

  const [connectors, setConnectors] = useState<BallerinaPackage[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    areas: [],
    vendors: [],
    types: [],
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filter expansion state
  const [expandedArea, setExpandedArea] = useState(true);
  const [expandedType, setExpandedType] = useState(false);
  const [expandedVendor, setExpandedVendor] = useState(false);

  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    searchParams.get('areas')?.split(',').filter(Boolean) || []
  );
  const [selectedVendors, setSelectedVendors] = useState<string[]>(
    searchParams.get('vendors')?.split(',').filter(Boolean) || []
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchParams.get('types')?.split(',').filter(Boolean) || []
  );
  const [currentPage, setCurrentPage] = useState(parsePageParam(searchParams.get('page')));
  const [pageSize, setPageSize] = useState(parsePageSizeParam(searchParams.get('size')));
  const [sortBy, setSortBy] = useState<SortOption>(parseSortParam(searchParams.get('sort')));

  // Refs
  const isInitialMountRef = useRef(true);
  const initialFetchDoneRef = useRef(false);

  // Toggle filter selection
  const toggleAreaFilter = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleVendorFilter = (vendor: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendor) ? prev.filter((v) => v !== vendor) : [...prev, vendor]
    );
  };

  const clearAllFilters = () => {
    setSelectedAreas([]);
    setSelectedTypes([]);
    setSelectedVendors([]);
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedAreas.length > 0 ||
    selectedTypes.length > 0 ||
    selectedVendors.length > 0 ||
    searchQuery.length > 0;

  // Fetch page data from REST API
  const fetchPageData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await searchPackages({
        query: searchQuery,
        areas: selectedAreas,
        vendors: selectedVendors,
        types: selectedTypes,
        offset: (currentPage - 1) * pageSize,
        limit: pageSize,
        sort: sortBy,
      });

      setConnectors(response.packages);
      setTotalCount(response.count);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch page data:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to load connectors. Please refresh the page or try again later.';
      setError(errorMessage);
      setLoading(false);
    }
  }, [searchQuery, selectedAreas, selectedVendors, selectedTypes, currentPage, pageSize, sortBy]);

  // Load filter options once on mount, then load first page
  useEffect(() => {
    const initialize = async () => {
      try {
        setInitialLoading(true);

        await fetchPageData();
        initialFetchDoneRef.current = true;

        const filters = await fetchFiltersProgressively('ballerinax', (updatedFilters) => {
          setFilterOptions(updatedFilters);
        });
        setFilterOptions(filters);

        setInitialLoading(false);
      } catch (error) {
        console.error('Failed to initialize:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load filters.';
        setError(errorMessage);
        setInitialLoading(false);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger server-side fetch when filters/sort/page change
  useEffect(() => {
    if (!initialFetchDoneRef.current || initialLoading) {
      return;
    }
    fetchPageData();
  }, [initialLoading, fetchPageData]);

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams();

    if (currentPage > 1) params.set('page', currentPage.toString());
    if (pageSize !== 30) params.set('size', pageSize.toString());
    if (searchQuery) params.set('search', searchQuery);
    if (selectedAreas.length > 0) params.set('areas', selectedAreas.join(','));
    if (selectedVendors.length > 0) params.set('vendors', selectedVendors.join(','));
    if (selectedTypes.length > 0) params.set('types', selectedTypes.join(','));
    if (sortBy !== 'pullCount-desc') params.set('sort', sortBy);

    setSearchParams(params, { replace: true });
  }, [
    currentPage,
    pageSize,
    searchQuery,
    selectedAreas,
    selectedVendors,
    selectedTypes,
    sortBy,
    setSearchParams,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    setCurrentPage(1);
  }, [selectedAreas, selectedVendors, selectedTypes, searchQuery, pageSize]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Header */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ColorSchemeToggle />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

        {/* Hero Banner */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            background: effectiveMode === 'dark' 
              ? 'linear-gradient(to right, #18181B, #18181B, rgba(255, 115, 0, 0.1))'
              : 'linear-gradient(to right, #F3F4F6, #FFFFFF, #FFF7ED)',
        }}
      >
        <Container maxWidth="xl" sx={{ py: 5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 3,
            }}
          >
            <Box>
              <Typography variant="h1" fontWeight="bold">
                Connector Store
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Discover and integrate with 100+ pre-built connectors for enterprise platforms
              </Typography>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Zap size={20} style={{ color: WSO2_ORANGE }} />
                <Typography variant="body2" color="text.secondary">
                  Fast Integration
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Shield size={20} style={{ color: WSO2_ORANGE }} />
                <Typography variant="body2" color="text.secondary">
                  Enterprise Ready
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Globe size={20} style={{ color: WSO2_ORANGE }} />
                <Typography variant="body2" color="text.secondary">
                  Global Support
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Initial Loading State */}
      {initialLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      )}

      {/* Main Content */}
      {!initialLoading && (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
              {/* Sidebar Filters */}
              <Paper
                sx={{ 
                  width: { xs: '100%', md: 288 }, 
                  flexShrink: 0, 
                  p: 2.5, 
                  height: 'fit-content',
                  bgcolor: effectiveMode === 'dark' ? '#18181B' : '#FFFFFF',
                  border: effectiveMode === 'dark' ? 'none' : '1px solid #E5E7EB',
                  boxShadow: effectiveMode === 'dark' ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                }}
              >
                {/* Search */}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search connectors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: effectiveMode === 'dark' ? '#1A1A1C' : '#F3F4F6',
                      borderRadius: '8px',
                      paddingY: '10px',
                      paddingX: '12px',
                      fontSize: '14px',
                      '& fieldset': {
                        border: effectiveMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                      },
                      '& input': {
                        padding: 0,
                        color: effectiveMode === 'dark' ? '#F4F4F5' : '#18181B',
                        '&::placeholder': {
                          color: effectiveMode === 'dark' ? '#A1A1AA' : '#71717A',
                          opacity: 1,
                        },
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment 
                        position="start" 
                        sx={{ 
                          marginRight: '8px',
                          color: effectiveMode === 'dark' ? '#A1A1AA' : '#71717A',
                        }}
                      >
                        <Search size={16} />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Filter Accordions */}
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Area Filter */}
                  <Accordion
                    expanded={expandedArea}
                    onChange={() => setExpandedArea(!expandedArea)}
                    disableGutters
                    sx={{
                      bgcolor: effectiveMode === 'dark' ? 'rgba(39, 39, 46, 0.5)' : '#F9FAFB',
                      borderRadius: '8px',
                      boxShadow: 'none',
                      border: 'none',
                      '&:before': {
                        display: 'none',
                      },
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ChevronDown size={16} />}
                      sx={{
                        '& .MuiAccordionSummary-expandIconWrapper': {
                          transition: 'transform 0.2s',
                        },
                        '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                          transform: 'rotate(90deg)',
                        },
                      }}
                    >
                      <Typography variant="body2" fontSize={14} fontWeight={500}>
                        Area
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ 
                      pt: 0,
                    }}>
                      <FormGroup>
                        {filterOptions.areas.slice(0, 10).map((area) => (
                          <FormControlLabel
                            key={area}
                            control={
                              <Checkbox
                                size="small"
                                checked={selectedAreas.includes(area)}
                                onChange={() => toggleAreaFilter(area)}
                                sx={{
                                  padding: 0,
                                  color: '#52525B',
                                  '&.Mui-checked': {
                                    color: '#FF7300',
                                  },
                                  '& .MuiSvgIcon-root': {
                                    fontSize: 16,
                                  },
                                }}
                              />
                            }
                            label={<Typography variant="body2" fontSize={14}>{area}</Typography>}
                            sx={{
                              mx: 0,
                              px: 1,
                              py: 0.75,
                              borderRadius: '6px',
                              gap: 1,
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              '&:hover': {
                                bgcolor: effectiveMode === 'dark' ? '#3F3F46' : '#E5E7EB',
                              },
                            }}
                          />
                        ))}
                      </FormGroup>
                    </AccordionDetails>
                  </Accordion>

                  {/* Type Filter */}
                  <Accordion
                    expanded={expandedType}
                    onChange={() => setExpandedType(!expandedType)}
                    disableGutters
                    sx={{
                      bgcolor: effectiveMode === 'dark' ? 'rgba(39, 39, 46, 0.5)' : '#F9FAFB',
                      borderRadius: '8px',
                      boxShadow: 'none',
                      border: 'none',
                      '&:before': {
                        display: 'none',
                      },
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ChevronDown size={16} />}
                      sx={{
                        '& .MuiAccordionSummary-expandIconWrapper': {
                          transition: 'transform 0.2s',
                        },
                        '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                          transform: 'rotate(90deg)',
                        },
                      }}
                    >
                      <Typography variant="body2" fontSize={14} fontWeight={500}>
                        Type
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ 
                      pt: 0,
                    }}>
                      <FormGroup>
                        {filterOptions.types.slice(0, 10).map((type) => (
                          <FormControlLabel
                            key={type}
                            control={
                              <Checkbox
                                size="small"
                                checked={selectedTypes.includes(type)}
                                onChange={() => toggleTypeFilter(type)}
                                sx={{
                                  padding: 0,
                                  color: '#52525B',
                                  '&.Mui-checked': {
                                    color: '#FF7300',
                                  },
                                  '& .MuiSvgIcon-root': {
                                    fontSize: 16,
                                  },
                                }}
                              />
                            }
                            label={<Typography variant="body2" fontSize={14}>{type}</Typography>}
                            sx={{
                              mx: 0,
                              px: 1,
                              py: 0.75,
                              borderRadius: '6px',
                              gap: 1,
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              '&:hover': {
                                bgcolor: effectiveMode === 'dark' ? '#3F3F46' : '#E5E7EB',
                              },
                            }}
                          />
                        ))}
                      </FormGroup>
                    </AccordionDetails>
                  </Accordion>

                  {/* Vendor Filter */}
                  <Accordion
                    expanded={expandedVendor}
                    onChange={() => setExpandedVendor(!expandedVendor)}
                    disableGutters
                    sx={{
                      bgcolor: effectiveMode === 'dark' ? 'rgba(39, 39, 46, 0.5)' : '#F9FAFB',
                      borderRadius: '8px',
                      boxShadow: 'none',
                      border: 'none',
                      '&:before': {
                        display: 'none',
                      },
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ChevronDown size={16} />}
                      sx={{
                        '& .MuiAccordionSummary-expandIconWrapper': {
                          transition: 'transform 0.2s',
                        },
                        '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                          transform: 'rotate(90deg)',
                        },
                      }}
                    >
                      <Typography variant="body2" fontSize={14} fontWeight={500}>
                        Vendor
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ 
                      pt: 0,
                      maxHeight: 192, 
                      overflow: 'auto',
                    }}>
                      <FormGroup>
                        {filterOptions.vendors.slice(0, 15).map((vendor) => (
                          <FormControlLabel
                            key={vendor}
                            control={
                              <Checkbox
                                size="small"
                                checked={selectedVendors.includes(vendor)}
                                onChange={() => toggleVendorFilter(vendor)}
                                sx={{
                                  color: '#52525B',
                                  '&.Mui-checked': {
                                    color: '#FF7300',
                                  },
                                }}
                              />
                            }
                            label={<Typography variant="body2">{vendor}</Typography>}
                            sx={{
                              mx: 0,
                              borderRadius: 1,
                              '&:hover': {
                                bgcolor: effectiveMode === 'dark' ? '#3F3F46' : '#E5E7EB',
                              },
                            }}
                          />
                        ))}
                      </FormGroup>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </Paper>

              {/* Main Content Area */}
              <Box sx={{ flex: 1 }}>
                {/* Error State */}
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                {totalCount === 0 && !loading ? (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    minHeight={300}
                  >
                    <Typography variant="h6" gutterBottom>
                      No connectors found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your search or filters
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* Top Pagination Bar */}
                    <Paper sx={{ 
                      p: 1.5, 
                      mb: 2.5,
                      bgcolor: effectiveMode === 'dark' ? '#18181B' : '#FFFFFF',
                      border: effectiveMode === 'dark' ? 'none' : '1px solid #E5E7EB',
                      boxShadow: effectiveMode === 'dark' ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                    }}>
                      <Pagination
                        currentPage={currentPage}
                        totalItems={totalCount}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                        pageSizeOptions={[30, 50, 100]}
                      />
                    </Paper>

                    {/* Selected Filters */}
                    {hasActiveFilters && (
                      <Paper
                        sx={{
                          p: 1.5,
                          mb: 2.5,
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: 1,
                          bgcolor: 'action.hover',
                        }}
                      >
                        <Typography variant="body2" fontWeight={500} sx={{ mr: 1 }}>
                          Active filters:
                        </Typography>

                        {selectedAreas.map((area) => (
                          <Chip
                            key={`area-${area}`}
                            label={area}
                            size="small"
                            onDelete={() => toggleAreaFilter(area)}
                            sx={{
                              bgcolor: `${WSO2_ORANGE}20`,
                              color: WSO2_ORANGE,
                            }}
                          />
                        ))}

                        {selectedTypes.map((type) => (
                          <Chip
                            key={`type-${type}`}
                            label={type}
                            size="small"
                            onDelete={() => toggleTypeFilter(type)}
                            color="default"
                          />
                        ))}

                        {selectedVendors.map((vendor) => (
                          <Chip
                            key={`vendor-${vendor}`}
                            label={vendor}
                            size="small"
                            onDelete={() => toggleVendorFilter(vendor)}
                            color="primary"
                          />
                        ))}

                        <Button
                          size="small"
                          onClick={clearAllFilters}
                          sx={{ ml: 'auto', textDecoration: 'underline', color: 'text.secondary' }}
                        >
                          Clear all
                        </Button>
                      </Paper>
                    )}

                    {/* Loading Overlay */}
                    {loading && (
                      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                        <CircularProgress />
                      </Box>
                    )}

                    {/* Cards Grid */}
                    {!loading && (
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            lg: 'repeat(3, 1fr)',
                          },
                          gap: 2.5,
                        }}
                      >
                        {connectors.map((connector) => {
                          const metadata = parseConnectorMetadata(connector.keywords || []);
                          const iconLetter = getIconLetter(connector.name);
                          const iconColor = getIconColor(connector.name);

                          return (
                            <Card
                              key={`${connector.name}-${connector.version}`}
                              sx={{
                                bgcolor: effectiveMode === 'dark' ? '#18181B' : '#FFFFFF',
                                border: effectiveMode === 'dark' ? 'none' : '1px solid #E5E7EB',
                                boxShadow: effectiveMode === 'dark' ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  boxShadow: effectiveMode === 'dark' ? '0 0 0 2px rgba(255, 115, 0, 0.6)' : 4,
                                  borderColor: effectiveMode === 'dark' ? 'transparent' : `${WSO2_ORANGE}80`,
                                  outline: effectiveMode === 'dark' ? 'none' : `2px solid ${WSO2_ORANGE}40`,
                                },
                              }}
                            >
                              <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                  <Box
                                    sx={{
                                      width: 48,
                                      height: 48,
                                      borderRadius: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 'bold',
                                      color: 'white',
                                      fontSize: 18,
                                      flexShrink: 0,
                                      bgcolor: iconColor,
                                    }}
                                  >
                                    {iconLetter}
                                  </Box>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                      }}
                                    >
                                      <Typography variant="subtitle2" fontWeight={600}>
                                        {connector.name.split('.').pop() || connector.name}
                                      </Typography>
                                      <Chip
                                        label={connector.version}
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: 11,
                                        }}
                                      />
                                    </Box>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{
                                        mt: 0.75,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {connector.summary}
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* Tags */}
                                <Stack
                                  direction="row"
                                  spacing={0.75}
                                  sx={{ mt: 2, flexWrap: 'wrap', gap: 0.75 }}
                                >
                                  {[metadata.area, metadata.type, metadata.vendor]
                                    .filter(Boolean)
                                    .slice(0, 3)
                                    .map((tag, index) => (
                                      <Chip
                                        key={`${tag}-${index}`}
                                        label={tag}
                                        size="small"
                                        sx={{
                                          height: 22,
                                          fontSize: 11,
                                          bgcolor: `${WSO2_ORANGE}20`,
                                          color: WSO2_ORANGE,
                                        }}
                                      />
                                    ))}
                                </Stack>

                                <Divider sx={{ my: 2 }} />

                                {/* Footer */}
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                    >
                                      <Download size={14} />{' '}
                                      {formatPullCount(connector.totalPullCount)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                    >
                                      <Clock size={14} />{' '}
                                      {formatRelativeTime(connector.createdDate)}
                                    </Typography>
                                  </Box>
                                  <Button
                                    size="small"
                                    href={connector.URL}
                                    target="_blank"
                                    sx={{
                                      fontSize: 12,
                                      bgcolor: `${WSO2_ORANGE}20`,
                                      color: WSO2_ORANGE,
                                      '&:hover': {
                                        bgcolor: `${WSO2_ORANGE}30`,
                                      },
                                    }}
                                  >
                                    View
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </Box>
                    )}

                    {/* Bottom Pagination Bar */}
                    <Paper sx={{ 
                      p: 1.5, 
                      mt: 3,
                      bgcolor: effectiveMode === 'dark' ? '#18181B' : '#FFFFFF',
                      border: effectiveMode === 'dark' ? 'none' : '1px solid #E5E7EB',
                      boxShadow: effectiveMode === 'dark' ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                    }}>
                      <Pagination
                        currentPage={currentPage}
                        totalItems={totalCount}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                        pageSizeOptions={[30, 50, 100]}
                      />
                    </Paper>
                  </>
                )}
              </Box>
            </Box>
          </Container>
        )}
      </Box>
  );
}
