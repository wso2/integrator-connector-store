import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { BallerinaPackage, FilterOptions } from '@/types/connector';
import { searchPackages, fetchFiltersProgressively, SortOption } from '@/lib/rest-client';
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
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ areas: [], vendors: [], types: [] });
  const [loading, setLoading] = useState(false); // For filter/pagination changes
  const [initialLoading, setInitialLoading] = useState(true); // For first page load
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
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );
  const [pageSize, setPageSize] = useState(
    parseInt(searchParams.get('size') || '30', 10)
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'pullCount-desc'
  );

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

        // Phase 1: Load first page immediately (fast)
        await fetchPageData();

        // Phase 2: Get filter options (cached or progressive)
        const filters = await fetchFiltersProgressively('ballerinax', (updatedFilters) => {
          // Background update when complete filters are fetched
          setFilterOptions(updatedFilters);
        });
        setFilterOptions(filters);

        setInitialLoading(false);
      } catch (error) {
        console.error('Failed to initialize:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load filters.';
        setError(errorMessage);
        setInitialLoading(false);
      }
    };

    initialize();
  }, []);

  // Trigger server-side fetch when filters/sort/page change
  useEffect(() => {
    if (!initialLoading) {
      fetchPageData();
    }
  }, [initialLoading, fetchPageData]);

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams();

    // Only add non-default params to keep URL clean
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (pageSize !== 30) params.set('size', pageSize.toString());
    if (searchQuery) params.set('search', searchQuery);
    if (selectedAreas.length > 0) params.set('areas', selectedAreas.join(','));
    if (selectedVendors.length > 0) params.set('vendors', selectedVendors.join(','));
    if (selectedTypes.length > 0) params.set('types', selectedTypes.join(','));
    if (sortBy !== 'pullCount-desc') params.set('sort', sortBy);

    setSearchParams(params, { replace: true });
  }, [currentPage, pageSize, searchQuery, selectedAreas, selectedVendors, selectedTypes, sortBy, setSearchParams]);

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

        {/* Initial Loading State */}
        {initialLoading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        )}

        {/* Main Content */}
        {!initialLoading && (
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Filter Sidebar - Always visible */}
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
                <Box sx={{ position: 'relative' }}>
                  {/* Loading Overlay */}
                  {loading && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(0, 0, 0, 0.7)'
                            : 'rgba(255, 255, 255, 0.7)',
                        zIndex: 10,
                        minHeight: 300,
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  )}

                  {/* Pagination - Top */}
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalCount}
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
                      opacity: loading ? 0.5 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {connectors.map((connector) => (
                      <ConnectorCard
                        connector={connector}
                        key={`${connector.name}-${connector.version}`}
                      />
                    ))}
                  </Box>

                  {/* Pagination - Bottom */}
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalCount}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Container>
    </>
  );
}
