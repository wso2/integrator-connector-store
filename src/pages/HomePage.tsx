import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [connectors, setConnectors] = useState<BallerinaPackage[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ areas: [], vendors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    searchParams.get('areas')?.split(',').filter(Boolean) || []
  );
  const [selectedVendors, setSelectedVendors] = useState<string[]>(
    searchParams.get('vendors')?.split(',').filter(Boolean) || []
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );
  const [pageSize, setPageSize] = useState(
    parseInt(searchParams.get('size') || '30', 10)
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'date-desc'
  );

  // Raw connector data (loaded once, never changes)
  const [rawConnectors, setRawConnectors] = useState<BallerinaPackage[]>([]);

  // Track enrichment state with refs to avoid re-render loops
  const enrichedItemsRef = useRef<Set<string>>(new Set());
  const isEnrichingRef = useRef(false);
  const lastSortRef = useRef<SortOption | null>(null);

  // Load data once on mount
  useEffect(() => {
    const loadConnectors = async () => {
      try {
        setLoading(true);
        setError(null);

        const batchSize = 100;
        const estimatedTotal = 800;
        const totalBatches = Math.ceil(estimatedTotal / batchSize);

        // STEP 1: Load FIRST batch quickly (2s)
        const firstBatch = await fetchConnectors('ballerinax', batchSize, 0);

        // Build initial filter options
        const initialFilterOpts = extractFilterOptions(firstBatch);
        setFilterOptions(initialFilterOpts);

        // Store raw data and show page immediately
        setRawConnectors(firstBatch);
        const preSorted = sortConnectors(firstBatch, sortBy);
        setConnectors(preSorted);
        setLoading(false); // Show page at ~2s! ✅

        // STEP 2: Load remaining batches in parallel (background, non-blocking)
        const remainingBatchPromises = Array.from({ length: totalBatches - 1 }, (_, i) =>
          fetchConnectors('ballerinax', batchSize, (i + 1) * batchSize)
        );

        const remainingResults = await Promise.allSettled(remainingBatchPromises);

        // Collect successful batches
        const successfulRemaining = remainingResults
          .filter((result): result is PromiseFulfilledResult<BallerinaPackage[]> =>
            result.status === 'fulfilled'
          )
          .map((result) => result.value);

        const failedCount = remainingResults.filter((r) => r.status === 'rejected').length;
        if (failedCount > 0) {
          console.warn(`${failedCount} batches failed to load`);
        }

        // Combine all batches
        const allConnectors = [firstBatch, ...successfulRemaining].flat().filter((c) => c.name);

        // Deduplicate by name-version
        const uniqueConnectors = Array.from(
          new Map(allConnectors.map((c) => [`${c.name}-${c.version}`, c])).values()
        );

        // Update filter options and raw data
        const completeFilterOpts = extractFilterOptions(uniqueConnectors);
        setFilterOptions(completeFilterOpts);
        setRawConnectors(uniqueConnectors);

        // Update sorted view
        const allSorted = sortConnectors(uniqueConnectors, sortBy);
        setConnectors(allSorted);

        // STEP 3: Enrich visible items
        const visibleItems = allSorted.slice(0, pageSize);
        const toEnrich = visibleItems.filter(item => !enrichedItemsRef.current.has(item.name));

        if (toEnrich.length > 0) {
          const enriched = await enrichPackagesWithPullCounts(toEnrich);

          // Mark as enriched
          enriched.forEach(item => enrichedItemsRef.current.add(item.name));

          // Merge enriched data
          const enrichedMap = new Map(enriched.map((c) => [c.name, c]));
          const updated = uniqueConnectors.map((c) => enrichedMap.get(c.name) || c);
          setRawConnectors(updated);
          setConnectors(sortConnectors(updated, sortBy));
        }

        // STEP 4: Background enrichment for remaining items
        setTimeout(async () => {
          const remaining = uniqueConnectors.filter(item => !enrichedItemsRef.current.has(item.name));
          if (remaining.length > 0) {
            try {
              const enrichedRemaining = await enrichPackagesWithPullCounts(remaining);

              const enrichedMap = new Map(enrichedRemaining.map((c) => [c.name, c]));
              const fullyEnriched = uniqueConnectors.map((c) => enrichedMap.get(c.name) || c);

              // Mark all as enriched
              fullyEnriched.forEach(item => enrichedItemsRef.current.add(item.name));

              setRawConnectors(fullyEnriched);
              setConnectors(sortConnectors(fullyEnriched, sortBy));
            } catch (error) {
              console.error('Background enrichment failed:', error);
            }
          }
        }, 100);
      } catch (error) {
        console.error('Failed to load connectors:', error);
        const errorMessage = error instanceof Error
          ? error.message
          : 'Failed to load connectors. Please refresh the page or try again later.';
        setError(errorMessage);
        setLoading(false);
      }
    };

    loadConnectors();
  }, []); // Only run once!

  // Handle sort changes - just re-sort existing data
  useEffect(() => {
    if (rawConnectors.length === 0) return; // Wait for data to load

    // Only run if sort actually changed (not when rawConnectors updates from enrichment)
    if (lastSortRef.current === sortBy) return;
    lastSortRef.current = sortBy;

    // For non-popularity sorts, just re-sort immediately
    if (!sortBy.startsWith('pullCount')) {
      setConnectors(sortConnectors(rawConnectors, sortBy));
      return;
    }

    // For popularity sorts, check if we need enrichment
    const first100 = rawConnectors.slice(0, 100);
    const needsEnrichment = first100.filter(item => !enrichedItemsRef.current.has(item.name));

    if (needsEnrichment.length === 0) {
      // Already enriched, just sort
      setConnectors(sortConnectors(rawConnectors, sortBy));
    } else if (!isEnrichingRef.current) {
      // Need enrichment and not currently enriching
      isEnrichingRef.current = true;

      (async () => {
        try {
          const enriched = await enrichPackagesWithPullCounts(needsEnrichment);

          // Update enriched set
          enriched.forEach(item => enrichedItemsRef.current.add(item.name));

          // Merge and update
          const enrichedMap = new Map(enriched.map((c) => [c.name, c]));
          const updated = rawConnectors.map((c) => enrichedMap.get(c.name) || c);
          setRawConnectors(updated);
          setConnectors(sortConnectors(updated, sortBy));
        } catch (error) {
          console.error('Enrichment failed:', error);
          setConnectors(sortConnectors(rawConnectors, sortBy));
        } finally {
          isEnrichingRef.current = false;
        }
      })();
    }
  }, [sortBy, rawConnectors]); // Depend on both, but guard with lastSortRef

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

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams();

    // Only add non-default params to keep URL clean
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (pageSize !== 30) params.set('size', pageSize.toString());
    if (searchQuery) params.set('search', searchQuery);
    if (selectedAreas.length > 0) params.set('areas', selectedAreas.join(','));
    if (selectedVendors.length > 0) params.set('vendors', selectedVendors.join(','));
    if (sortBy !== 'date-desc') params.set('sort', sortBy);

    setSearchParams(params, { replace: true });
  }, [currentPage, pageSize, searchQuery, selectedAreas, selectedVendors, sortBy, setSearchParams]);

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
            <LazyLoadImage
              src="/images/wso2-integrator-correct.svg"
              alt=""
              width={40}
              height={40}
              effect="opacity"
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
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ flex: 1, maxWidth: { xs: '100%', sm: '500px' } }}>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </Box>
          <Box sx={{ flexShrink: 0 }}>
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
