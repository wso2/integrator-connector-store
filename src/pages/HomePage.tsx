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
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@wso2/oxygen-ui';
import { BallerinaPackage, FilterOptions } from '@/types/connector';
import { searchPackages, fetchFiltersProgressively, SortOption } from '@/lib/rest-client';
import Pagination from '@/components/Pagination';
import ConnectorCard from '@/components/ConnectorCard';
import WSO2Header from '@/components/WSO2Header';
import Hero from '@/components/Hero';
import FilterSidebar from '@/components/FilterSidebar';
import Footer from '@/components/Footer';

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

  // Ref to track if initial fetch is done
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

      console.log('Fetching with filters:', {
        query: searchQuery,
        areas: selectedAreas,
        vendors: selectedVendors,
        types: selectedTypes,
        offset: (currentPage - 1) * pageSize,
        limit: pageSize,
        sort: sortBy,
      });

      const response = await searchPackages({
        query: searchQuery,
        areas: selectedAreas,
        vendors: selectedVendors,
        types: selectedTypes,
        offset: (currentPage - 1) * pageSize,
        limit: pageSize,
        sort: sortBy,
      });

      console.log('API Response:', response);

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

        // Phase 1: Load first page immediately (fast)
        await fetchPageData();
        initialFetchDoneRef.current = true;

        // Phase 2: Get filter options (cached or progressive)
        const filters = await fetchFiltersProgressively('ballerinax', (updatedFilters) => {
          // Background update when complete filters are fetched
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
    if (!initialLoading && initialFetchDoneRef.current) {
      fetchPageData();
    }
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
    setCurrentPage(1);
  }, [selectedAreas, selectedVendors, selectedTypes, searchQuery, pageSize]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  return (
    <>
      {/* Header */}
      <WSO2Header effectiveMode={effectiveMode} />

      {/* Hero Banner */}
      <Hero effectiveMode={effectiveMode} />

      <Box sx={{ minHeight: '100vh' }}>

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
              <FilterSidebar
                filterOptions={filterOptions}
                selectedAreas={selectedAreas}
                selectedVendors={selectedVendors}
                selectedTypes={selectedTypes}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAreaChange={toggleAreaFilter}
                onVendorChange={toggleVendorFilter}
                onTypeChange={toggleTypeFilter}
                onClearAll={clearAllFilters}
                effectiveMode={effectiveMode}
              />

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
                        pageSizeOptions={[10, 30, 50, 100]}
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
                        {connectors.map((connector) => (
                          <ConnectorCard
                            key={`${connector.name}-${connector.version}`}
                            connector={connector}
                            effectiveMode={effectiveMode}
                          />
                        ))}
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
                        pageSizeOptions={[10, 30, 50, 100]}
                      />
                    </Paper>
                  </>
                )}
              </Box>
            </Box>
          </Container>
        )}
      </Box>
      
      {/* Footer */}
      <Footer effectiveMode={effectiveMode} />
    </>
  );
}
