'use client';

import { useState, useEffect, useMemo } from 'react';
import { Container, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { BallerinaPackage, FilterOptions } from '@/types/connector';
import { fetchConnectors, enrichPackagesWithPullCounts } from '@/lib/graphql-client';
import {
  extractFilterOptions,
  filterConnectors,
  sortConnectors,
  SortOption,
} from '@/lib/connector-utils';
import ConnectorCard from '@/components/ConnectorCard';
import FilterSidebar from '@/components/FilterSidebar';
import SearchBar from '@/components/SearchBar';
import SortSelector from '@/components/SortSelector';
import Pagination from '@/components/Pagination';
import WSO2Header from '@/components/WSO2Header';
import Image from 'next/image';

export default function HomePage() {
  const [connectors, setConnectors] = useState<BallerinaPackage[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ areas: [], vendors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('pullCount-desc');

  // Progressive loading: show first batch immediately, enrich progressively
  useEffect(() => {
    const loadConnectors = async () => {
      try {
        setLoading(true);

        const batchSize = 100;
        const estimatedTotal = 800;
        const totalBatches = Math.ceil(estimatedTotal / batchSize);

        // Fetch first batch and show page immediately
        const firstBatch = await fetchConnectors('ballerinax', batchSize, 0);

        // Build initial filter options from first batch
        const initialFilterOpts = extractFilterOptions(firstBatch);
        setFilterOptions(initialFilterOpts);
        setConnectors(firstBatch);

        // Hide loading spinner immediately - show cards without pull counts
        setLoading(false);

        // Load remaining batches in parallel with first batch enrichment
        const remainingBatchPromises = [];
        for (let i = 1; i < totalBatches; i++) {
          const offset = i * batchSize;
          remainingBatchPromises.push(
            (async () => {
              const batch = await fetchConnectors('ballerinax', batchSize, offset);
              return batch;
            })()
          );
        }

        // Fetch all batches in parallel
        const remainingBatches = await Promise.all(remainingBatchPromises);
        const allConnectors = [firstBatch, ...remainingBatches].flat().filter((c) => c.name);

        // Deduplicate
        const uniqueConnectors = Array.from(
          new Map(allConnectors.map((c) => [`${c.name}-${c.version}`, c])).values()
        );

        // Update filter options with complete data
        const completeFilterOpts = extractFilterOptions(uniqueConnectors);
        setFilterOptions(completeFilterOpts);
        setConnectors(uniqueConnectors);

        // Progressive enrichment: enrich first batch first (likely contains popular connectors)
        const firstBatchToEnrich = uniqueConnectors.slice(0, batchSize);
        const remainingToEnrich = uniqueConnectors.slice(batchSize);

        // Enrich first batch first (100 items - visible cards are likely here)
        const enrichedFirstBatch = await enrichPackagesWithPullCounts(firstBatchToEnrich);

        // Update state with partially enriched data (first batch has pull counts, rest don't)
        // Create a map for quick lookup
        const enrichedMap = new Map(enrichedFirstBatch.map(c => [c.name, c]));
        const partiallyEnriched = uniqueConnectors.map(c =>
          enrichedMap.get(c.name) || c
        );
        setConnectors(partiallyEnriched);

        // Enrich remaining batches in background
        if (remainingToEnrich.length > 0) {
          const enrichedRemaining = await enrichPackagesWithPullCounts(remainingToEnrich);

          // Update state with fully enriched data
          const enrichedRemainingMap = new Map(enrichedRemaining.map(c => [c.name, c]));
          const fullyEnriched = uniqueConnectors.map(c =>
            enrichedMap.get(c.name) || enrichedRemainingMap.get(c.name) || c
          );
          setConnectors(fullyEnriched);
        }
      } catch (error) {
        setError('Failed to load connectors. Please try again later.');
        setLoading(false);
      }
    };

    loadConnectors();
  }, []);

  // Filter and sort connectors
  const filteredConnectors = useMemo(() => {
    const filtered = filterConnectors(connectors, {
      selectedAreas,
      selectedVendors,
      searchQuery,
    });
    return sortConnectors(filtered, sortBy);
  }, [connectors, selectedAreas, selectedVendors, searchQuery, sortBy]);

  // Paginate filtered connectors
  const paginatedConnectors = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredConnectors.slice(startIndex, endIndex);
  }, [filteredConnectors, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAreas, selectedVendors, searchQuery, pageSize]);

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

  const handleClearAll = () => {
    setSelectedAreas([]);
    setSelectedVendors([]);
    setSearchQuery('');
  };

  return (
    <>
      {/* WSO2 Header */}
      <WSO2Header />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* WSO2 Integrator Brand Section */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* WSO2 Integrator Logo with Icon + Text */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Image
              src="/images/wso2-integrator-correct.svg"
              alt=""
              width={40}
              height={40}
              style={{ display: 'block' }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                letterSpacing: '0.008rem',
              }}
            >
              WSO
              <Box component="span" sx={{ fontSize: '0.7em', verticalAlign: 'sub' }}>
                2
              </Box>{' '}
              Integrator
            </Typography>
          </Box>

          {/* Separator and Connector Store */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: '1px',
                height: '32px',
                backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#444' : '#ddd'),
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                letterSpacing: '0.008rem',
              }}
            >
              Connector Store
            </Typography>
          </Box>
        </Box>

        {/* Description */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800 }}>
            Discover and integrate with 100+ pre-built connectors for popular services and
            platforms. Accelerate your integration development with WSO2 Integrator.
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
          }}
        >
          <Box sx={{ flex: 1 }}>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <SortSelector value={sortBy} onChange={setSortBy} />
          </Box>
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
                onAreaChange={handleAreaChange}
                onVendorChange={handleVendorChange}
                onClearAll={handleClearAll}
              />
            </Box>

            {/* Connector Grid */}
            <Box sx={{ flex: 1 }}>
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
                  {/* Pagination - Top */}
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredConnectors.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        lg: 'repeat(3, 1fr)',
                      },
                      gap: 3,
                      mt: 4,
                    }}
                  >
                    {paginatedConnectors.map((connector) => (
                      <ConnectorCard
                        connector={connector}
                        key={`${connector.name}-${connector.version}`}
                      />
                    ))}
                  </Box>

                  {/* Pagination - Bottom */}
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
