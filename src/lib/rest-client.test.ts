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

import { searchPackages, fetchFiltersProgressively, SearchParams } from './rest-client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Helper to create mock API response
const createMockApiResponse = (
  packages: Array<{ name: string; version: string }>,
  count: number,
  offset: number = 0,
  limit: number = 30
) => ({
  packages: packages.map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    URL: `https://example.com/${pkg.name}`,
    summary: `Summary for ${pkg.name}`,
    keywords: ['Area/Integration', 'Vendor/Test', 'Type/Connector'],
    icon: 'https://example.com/icon.png',
    createdDate: '2024-01-15T00:00:00Z',
    pullCount: 1000,
  })),
  count,
  offset,
  limit,
});

describe('rest-client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('searchPackages', () => {
    it('should fetch packages with correct parameters', async () => {
      const mockResponse = createMockApiResponse([{ name: 'test-connector', version: '1.0.0' }], 1);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const params: SearchParams = {
        offset: 0,
        limit: 30,
        sort: 'pullCount-desc',
      };

      const result = await searchPackages(params);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.packages).toHaveLength(1);
      expect(result.packages[0].name).toBe('test-connector');
      expect(result.packages[0].totalPullCount).toBe(1000);
      expect(result.count).toBe(1);
    });

    it('should include search query in request', async () => {
      const mockResponse = createMockApiResponse([], 0);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const params: SearchParams = {
        query: 'stripe',
        offset: 0,
        limit: 30,
        sort: 'name-asc',
      };

      await searchPackages(params);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('q=stripe');
      expect(calledUrl).toContain('sort=name,ASC');
    });

    it('should include area filter in request', async () => {
      const mockResponse = createMockApiResponse([], 0);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const params: SearchParams = {
        areas: ['Finance'],
        offset: 0,
        limit: 30,
        sort: 'date-desc',
      };

      await searchPackages(params);

      const calledUrl = mockFetch.mock.calls[0][0];
      // Values are now escaped and wrapped in quotes for Solr
      expect(calledUrl).toContain('keyword%3A%22Area%2FFinance%22');
    });

    it('should handle multiple filter combinations', async () => {
      const mockResponse = createMockApiResponse([{ name: 'connector-1', version: '1.0.0' }], 1);

      // Mock multiple fetch calls for combinations
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const params: SearchParams = {
        areas: ['Finance', 'Communication'],
        offset: 0,
        limit: 30,
        sort: 'pullCount-desc',
      };

      const result = await searchPackages(params);

      // Should make 2 API calls (one for each area)
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Results should be deduplicated
      expect(result.packages).toHaveLength(1);
    });

    it('should deduplicate packages from multiple queries', async () => {
      const mockResponse1 = createMockApiResponse(
        [
          { name: 'shared-connector', version: '1.0.0' },
          { name: 'unique-1', version: '1.0.0' },
        ],
        2
      );

      const mockResponse2 = createMockApiResponse(
        [
          { name: 'shared-connector', version: '1.0.0' },
          { name: 'unique-2', version: '1.0.0' },
        ],
        2
      );

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse1),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse2),
        });

      const params: SearchParams = {
        areas: ['Finance', 'Communication'],
        offset: 0,
        limit: 30,
        sort: 'pullCount-desc',
      };

      const result = await searchPackages(params);

      // Should have 3 unique packages (shared-connector appears once)
      expect(result.packages).toHaveLength(3);
      expect(result.count).toBe(3);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      const params: SearchParams = {
        offset: 0,
        limit: 30,
        sort: 'pullCount-desc',
      };

      await expect(searchPackages(params)).rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle network errors with retry', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockApiResponse([], 0)),
        });

      const params: SearchParams = {
        offset: 0,
        limit: 30,
        sort: 'pullCount-desc',
      };

      // Run the search (retries happen with real delays, so use longer timeout)
      const result = await searchPackages(params);

      expect(result.packages).toHaveLength(0);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should fall back to single query when combinations exceed threshold', async () => {
      const mockResponse = createMockApiResponse([], 0);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // Create params that would generate > 50 combinations
      const params: SearchParams = {
        areas: Array.from({ length: 10 }, (_, i) => `Area${i}`),
        vendors: Array.from({ length: 10 }, (_, i) => `Vendor${i}`),
        offset: 0,
        limit: 30,
        sort: 'pullCount-desc',
      };

      await searchPackages(params);

      // Should only make 1 API call (fallback to single query)
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('exceeds MAX_COMBINATIONS')
      );
    });

    it('should apply correct pagination to merged results', async () => {
      // Create responses with 5 unique packages each
      const mockResponse1 = createMockApiResponse(
        Array.from({ length: 5 }, (_, i) => ({ name: `pkg-a-${i}`, version: '1.0.0' })),
        5
      );

      const mockResponse2 = createMockApiResponse(
        Array.from({ length: 5 }, (_, i) => ({ name: `pkg-b-${i}`, version: '1.0.0' })),
        5
      );

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse1),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse2),
        });

      const params: SearchParams = {
        areas: ['A', 'B'],
        offset: 2,
        limit: 3,
        sort: 'pullCount-desc',
      };

      const result = await searchPackages(params);

      // Should return 3 packages starting from offset 2
      expect(result.packages).toHaveLength(3);
      expect(result.offset).toBe(2);
      expect(result.limit).toBe(3);
    });
  });

  describe('fetchFiltersProgressively', () => {
    it('should return cached filters if available', async () => {
      const cachedFilters = {
        filters: {
          areas: ['Finance', 'Communication'],
          vendors: ['Stripe', 'Twilio'],
          types: ['Connector'],
        },
        timestamp: Date.now(), // Fresh cache
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(cachedFilters));

      const result = await fetchFiltersProgressively();

      expect(result).toEqual(cachedFilters.filters);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch filters when cache is expired', async () => {
      const expiredCache = {
        filters: {
          areas: ['Old'],
          vendors: ['Old'],
          types: ['Old'],
        },
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(expiredCache));

      const mockResponse = createMockApiResponse([{ name: 'test', version: '1.0.0' }], 1);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchFiltersProgressively();

      expect(mockFetch).toHaveBeenCalled();
      expect(result.areas).toContain('Integration');
    });

    it('should call onUpdate callback when more packages exist', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      // First batch returns 100 packages with count > 100
      const firstBatchResponse = {
        ...createMockApiResponse(
          Array.from({ length: 100 }, (_, i) => ({ name: `pkg-${i}`, version: '1.0.0' })),
          150 // Total count > 100
        ),
      };

      // Second batch for complete fetch
      const secondBatchResponse = createMockApiResponse(
        Array.from({ length: 50 }, (_, i) => ({ name: `pkg-${100 + i}`, version: '1.0.0' })),
        150,
        100,
        100
      );

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(firstBatchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(firstBatchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(secondBatchResponse),
        });

      const onUpdate = jest.fn();

      await fetchFiltersProgressively('ballerinax', onUpdate);

      // Wait for background fetch to complete (give it more time)
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(onUpdate).toHaveBeenCalled();
    }, 10000);

    it('should cache filters when count <= 100', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const mockResponse = createMockApiResponse(
        [{ name: 'test', version: '1.0.0' }],
        50 // Total count <= 100
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchFiltersProgressively();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ballerina_connector_filters',
        expect.any(String)
      );
    });
  });
});
