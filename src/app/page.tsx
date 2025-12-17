'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { BallerinaPackage, FilterOptions } from '@/types/connector';
import { fetchConnectors } from '@/lib/graphql-client';
import { extractFilterOptions, filterConnectors, sortConnectors, SortOption } from '@/lib/connector-utils';
import { enrichConnectorsWithTotalPullCounts } from '@/lib/rest-client';
import ConnectorCard from '@/components/ConnectorCard';
import FilterSidebar from '@/components/FilterSidebar';
import SearchBar from '@/components/SearchBar';
import SortSelector from '@/components/SortSelector';
import Pagination from '@/components/Pagination';
import WSO2Header from '@/components/WSO2Header';

export default function HomePage() {
  const [connectors, setConnectors] = useState<BallerinaPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('pullCount-desc');

  // Fetch initial batch of connectors
  useEffect(() => {
    const loadInitialConnectors = async () => {
      try {
        setLoading(true);
        // Fetch first batch (100 connectors)
        const initialBatch = await fetchConnectors('ballerinax', 100, 0);
        setConnectors(initialBatch);
        setLoading(false);

        // Fetch remaining connectors in background
        fetchRemainingConnectors(100);
      } catch (err) {
        setError('Failed to load connectors. Please try again later.');
        setLoading(false);
      }
    };

    loadInitialConnectors();
  }, []);

  // Fetch remaining connectors in background
  const fetchRemainingConnectors = async (offset: number) => {
    try {
      let currentOffset = offset;
      let hasMore = true;

      while (hasMore) {
        const batch = await fetchConnectors('ballerinax', 100, currentOffset);
        if (batch.length > 0) {
          setConnectors((prev) => [...prev, ...batch]);
          currentOffset += 100;
          if (batch.length < 100) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      // After all connectors are loaded, enrich with total pull counts from REST API
      // This aggregates pull counts across all versions for accurate totals
      setConnectors((prev) => {
        enrichConnectorsWithTotalPullCounts(prev).then(setConnectors);
        return prev;
      });
    } catch (err) {
      console.error('Error fetching remaining connectors:', err);
    }
  };

  // Extract filter options from connectors
  const filterOptions: FilterOptions = useMemo(() => {
    return extractFilterOptions(connectors);
  }, [connectors]);

  // Filter and sort connectors
  const filteredConnectors = useMemo(() => {
    const filtered = filterConnectors(connectors, {
      selectedAreas,
      selectedVendors,
      selectedTypes,
      searchQuery,
    });
    return sortConnectors(filtered, sortBy);
  }, [connectors, selectedAreas, selectedVendors, selectedTypes, searchQuery, sortBy]);

  // Paginate filtered connectors
  const paginatedConnectors = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredConnectors.slice(startIndex, endIndex);
  }, [filteredConnectors, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAreas, selectedVendors, selectedTypes, searchQuery, pageSize]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Filter handlers
  const handleAreaChange = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleVendorChange = (vendor: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendor) ? prev.filter((v) => v !== vendor) : [...prev, vendor]
    );
  };

  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleClearAll = () => {
    setSelectedAreas([]);
    setSelectedVendors([]);
    setSelectedTypes([]);
    setSearchQuery('');
  };

  return (
    <>
      {/* WSO2 Header */}
      <WSO2Header />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Hero Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Ballerina Connectors
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800 }}>
            Discover and integrate with 100+ pre-built connectors for popular services and
            platforms. Accelerate your integration development with Ballerina.
          </Typography>
        </Box>

        {/* Search and Sort Controls */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
          }}
        >
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <SortSelector value={sortBy} onChange={setSortBy} />
        </Box>

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Filter Sidebar */}
            <Box sx={{ width: { xs: '100%', md: '300px' }, flexShrink: 0 }}>
              <FilterSidebar
                filterOptions={filterOptions}
                selectedAreas={selectedAreas}
                selectedVendors={selectedVendors}
                selectedTypes={selectedTypes}
                onAreaChange={handleAreaChange}
                onVendorChange={handleVendorChange}
                onTypeChange={handleTypeChange}
                onClearAll={handleClearAll}
              />
            </Box>

            {/* Connector Grid */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredConnectors.length} of {connectors.length} connectors
                </Typography>
              </Box>

              {filteredConnectors.length === 0 ? (
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
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        lg: 'repeat(3, 1fr)',
                      },
                      gap: 3,
                    }}
                  >
                    {paginatedConnectors.map((connector) => (
                      <ConnectorCard connector={connector} key={`${connector.name}-${connector.version}`} />
                    ))}
                  </Box>

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredConnectors.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                </>
              )}
            </Box>
          </Box>
        )}
      </Container>
    </>
  );
}
