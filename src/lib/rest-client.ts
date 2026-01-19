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

import { BallerinaPackage, FilterOptions } from '@/types/connector';
import { extractFilterOptions } from './connector-utils';

const REST_ENDPOINT = 'https://api.central.ballerina.io/2.0/registry/search-packages';

/**
 * Sort options used in the UI
 */
export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'pullCount-desc'
  | 'pullCount-asc'
  | 'date-desc'
  | 'date-asc';

/**
 * Search parameters for the REST API
 */
export interface SearchParams {
  query?: string;
  areas?: string[];
  vendors?: string[];
  types?: string[];
  offset: number;
  limit: number;
  sort: SortOption;
  orgName?: string;
}

/**
 * Response from the REST API search endpoint
 */
export interface SearchResponse {
  packages: BallerinaPackage[];
  count: number;
  offset: number;
  limit: number;
}

/**
 * Internal API response structure (before mapping)
 */
interface RawSearchResponse {
  packages: Array<{
    name: string;
    version: string;
    URL: string;
    summary: string;
    keywords: string[];
    icon: string;
    createdDate: string;
    pullCount?: number;
  }>;
  count: number;
  offset: number;
  limit: number;
}

/**
 * Retry helper for network requests with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1}/${maxRetries} failed:`, error);

      // Don't retry on last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Convert sort option to REST API sort parameter
 * @example "pullCount-desc" → "pullCount,DESC"
 */
function toRestSortParam(sortOption: SortOption): string {
  const [field, direction] = sortOption.split('-');

  const fieldMap: Record<string, string> = {
    name: 'name',
    pullCount: 'pullCount',
    date: 'createdDate',
  };

  const directionMap: Record<string, string> = {
    asc: 'ASC',
    desc: 'DESC',
  };

  return `${fieldMap[field]},${directionMap[direction]}`;
}

/**
 * Build Solr query string from search filters (single values only)
 * Text query comes first, then filters are ANDed
 * @example buildSolrQuery({query: 'graphql', areas: ['Finance']})
 *   → "graphql AND org:ballerinax AND keyword:Area/Finance"
 * @example buildSolrQuery({areas: ['Finance'], vendors: ['Amazon']})
 *   → "org:ballerinax AND keyword:Area/Finance AND keyword:Vendor/Amazon"
 */
function buildSolrQuery(
  params: Pick<SearchParams, 'areas' | 'vendors' | 'types' | 'query' | 'orgName'>
): string {
  const filters: string[] = [];

  // Always include organization (required)
  const org = params.orgName || 'ballerinax';
  filters.push(`org:${org}`);

  // Add area filter (required with AND operator)
  if (params.areas && params.areas.length > 0) {
    params.areas.forEach((area) => {
      filters.push(`keyword:Area/${area}`);
    });
  }

  // Add vendor filter (required with AND operator)
  if (params.vendors && params.vendors.length > 0) {
    params.vendors.forEach((vendor) => {
      filters.push(`keyword:Vendor/${vendor}`);
    });
  }

  // Add type filter (required with AND operator)
  if (params.types && params.types.length > 0) {
    params.types.forEach((type) => {
      filters.push(`keyword:Type/${type}`);
    });
  }

  // Build the query: text search first (if provided), then AND with filters
  if (params.query) {
    return `${params.query} AND ${filters.join(' AND ')}`;
  }

  return filters.join(' AND ');
}

/**
 * Maximum number of filter combinations before falling back to single query
 * to avoid making too many parallel API calls
 */
const MAX_COMBINATIONS = 50;

/**
 * Generate all combinations of filter values for OR queries
 * Since Solr doesn't support parenthetical grouping, we need to make multiple queries
 */
function generateFilterCombinations(params: SearchParams): SearchParams[] {
  const { areas = [], vendors = [], types = [], ...rest } = params;

  // If all filters have 0 or 1 values, no combinations needed
  if (areas.length <= 1 && vendors.length <= 1 && types.length <= 1) {
    return [params];
  }

  // Generate combinations - treat single values as one-element arrays
  const areaList = areas.length > 0 ? areas : [undefined];
  const vendorList = vendors.length > 0 ? vendors : [undefined];
  const typeList = types.length > 0 ? types : [undefined];

  // Check if Cartesian product would exceed threshold
  const comboCount = areaList.length * vendorList.length * typeList.length;
  if (comboCount > MAX_COMBINATIONS) {
    console.warn(
      `Filter combination count (${comboCount}) exceeds MAX_COMBINATIONS (${MAX_COMBINATIONS}). ` +
        `Falling back to single query to avoid excessive API calls.`
    );
    return [params];
  }

  const combinations: SearchParams[] = [];

  for (const area of areaList) {
    for (const vendor of vendorList) {
      for (const type of typeList) {
        combinations.push({
          ...rest,
          areas: area ? [area] : [],
          vendors: vendor ? [vendor] : [],
          types: type ? [type] : [],
        });
      }
    }
  }

  return combinations;
}

/**
 * Execute a single search query
 */
async function executeSingleSearch(params: SearchParams): Promise<SearchResponse> {
  return withRetry(async () => {
    const solrQuery = buildSolrQuery(params);
    const sortParam = toRestSortParam(params.sort);

    // Build URL manually to avoid encoding the comma in sort parameter
    const queryParams = new URLSearchParams();
    queryParams.set('q', solrQuery);
    queryParams.set('offset', params.offset.toString());
    queryParams.set('limit', params.limit.toString());
    queryParams.set('readme', 'false');

    // Add sort without encoding the comma
    const urlString = `${REST_ENDPOINT}?${queryParams.toString()}&sort=${sortParam}`;

    const response = await fetch(urlString);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RawSearchResponse = await response.json();

    // Map pullCount to totalPullCount to match existing interface
    const packages: BallerinaPackage[] = data.packages.map((pkg) => ({
      ...pkg,
      totalPullCount: pkg.pullCount,
    }));

    return {
      packages,
      count: data.count,
      offset: data.offset,
      limit: data.limit,
    };
  });
}

/**
 * Search packages with server-side filtering, sorting, and pagination
 * Handles OR logic by making multiple API calls when needed
 */
export async function searchPackages(params: SearchParams): Promise<SearchResponse> {
  const combinations = generateFilterCombinations(params);

  // If only one combination, execute directly
  if (combinations.length === 1) {
    return executeSingleSearch(combinations[0]);
  }

  // Multiple combinations - execute in parallel and merge results
  // Use offset=0 for each query to get full slices, then paginate merged results once
  const results = await Promise.all(
    combinations.map((combo) =>
      executeSingleSearch({
        ...combo,
        offset: 0,
        limit: params.offset + params.limit, // Fetch enough to cover requested page
      })
    )
  );

  // Merge packages and deduplicate by name-version
  const packageMap = new Map<string, BallerinaPackage>();
  results.forEach((result) => {
    result.packages.forEach((pkg) => {
      const key = `${pkg.name}-${pkg.version}`;
      if (!packageMap.has(key)) {
        packageMap.set(key, pkg);
      }
    });
  });

  const mergedPackages = Array.from(packageMap.values());

  // Total count is the deduplicated set size
  const totalCount = mergedPackages.length;

  // Apply pagination once to the merged results
  const startIndex = params.offset;
  const endIndex = startIndex + params.limit;
  const paginatedPackages = mergedPackages.slice(startIndex, endIndex);

  return {
    packages: paginatedPackages,
    count: totalCount,
    offset: params.offset,
    limit: params.limit,
  };
}

const FILTER_CACHE_KEY = 'ballerina_connector_filters';
const FILTER_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedFilters {
  filters: FilterOptions;
  timestamp: number;
}

/**
 * Get cached filter options from localStorage
 */
function getCachedFilters(): FilterOptions | null {
  try {
    const cached = localStorage.getItem(FILTER_CACHE_KEY);
    if (!cached) return null;

    const { filters, timestamp }: CachedFilters = JSON.parse(cached);
    const age = Date.now() - timestamp;

    // Return cached filters if less than 24 hours old
    if (age < FILTER_CACHE_TTL) {
      return filters;
    }

    // Cache expired, clear it
    localStorage.removeItem(FILTER_CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Failed to get cached filters:', error);
    return null;
  }
}

/**
 * Cache filter options in localStorage
 */
function cacheFilters(filters: FilterOptions): void {
  try {
    const cached: CachedFilters = {
      filters,
      timestamp: Date.now(),
    };
    localStorage.setItem(FILTER_CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.error('Failed to cache filters:', error);
  }
}

/**
 * Fetch all packages to build complete filter options
 * This is done in the background to avoid blocking initial page load
 */
export async function fetchAllPackagesForFilters(
  orgName: string = 'ballerinax'
): Promise<FilterOptions> {
  // Try to get cached filters first
  const cached = getCachedFilters();
  if (cached) {
    return cached;
  }

  const batchSize = 100;
  let allPackages: BallerinaPackage[] = [];
  let offset = 0;
  let hasMore = true;

  // Fetch all packages in batches
  while (hasMore) {
    try {
      const response = await searchPackages({
        offset,
        limit: batchSize,
        sort: 'date-desc',
        orgName,
      });

      allPackages = [...allPackages, ...response.packages];
      offset += batchSize;

      // Check if we've fetched everything
      hasMore = offset < response.count;
    } catch (error) {
      console.error(`Failed to fetch batch at offset ${offset}:`, error);
      break;
    }
  }

  // Extract filter options
  const filters = extractFilterOptions(allPackages);

  // Cache for future use
  cacheFilters(filters);

  return filters;
}

/**
 * Fetch filter options progressively (fast initial load)
 * Returns partial filters immediately, then enriches in background
 */
export async function fetchFiltersProgressively(
  orgName: string = 'ballerinax',
  onUpdate?: (filters: FilterOptions) => void
): Promise<FilterOptions> {
  // Try cached filters first
  const cached = getCachedFilters();
  if (cached) {
    return cached;
  }

  // Fetch first batch quickly to get initial filters
  const firstBatch = await searchPackages({
    offset: 0,
    limit: 100,
    sort: 'date-desc',
    orgName,
  });

  const initialFilters = extractFilterOptions(firstBatch.packages);

  // Start background fetch for complete filters
  if (firstBatch.count > 100 && onUpdate) {
    fetchAllPackagesForFilters(orgName).then((completeFilters) => {
      onUpdate(completeFilters);
    });
  } else {
    // Cache if we got everything
    cacheFilters(initialFilters);
  }

  return initialFilters;
}
