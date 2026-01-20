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

// Mock localStorage with a simpler structure
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Helper to create mock API response
const createMockApiResponse = (
  packages: Array<{ name: string; version: string; keywords?: string[] }>,
  count: number,
  offset: number = 0,
  limit: number = 30
) => ({
  packages: packages.map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    URL: `https://example.com/${pkg.name}`,
    summary: `Summary for ${pkg.name}`,
    keywords: pkg.keywords || ['Area/Integration', 'Vendor/Test', 'Type/Connector'],
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
    // Clear all mocks before each test
    mockFetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();

    // Suppress console warnings and errors during tests
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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse([], 0)),
      });
      await searchPackages({ query: 'stripe', offset: 0, limit: 30, sort: 'name-asc' });
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('q=stripe');
      expect(calledUrl).toContain('sort=name,ASC');
    });

    it('should handle multiple filter combinations by making parallel requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(createMockApiResponse([{ name: 'connector-1', version: '1.0.0' }], 1)),
      });
      await searchPackages({
        areas: ['Finance', 'Communication'],
        offset: 0,
        limit: 30,
        sort: 'pullCount-desc',
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle API errors with retry', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse([], 0)),
      });
      await searchPackages({ offset: 0, limit: 30, sort: 'pullCount-desc' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }, 10000);
  });

  describe('fetchFiltersProgressively', () => {
    const FILTER_CACHE_KEY = 'ballerina_connector_filters';

    it('should return cached filters if available and not expired', async () => {
      const freshCache = {
        filters: { areas: ['CachedArea'], vendors: ['CachedVendor'], types: ['CachedType'] },
        timestamp: Date.now(),
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(freshCache));

      const result = await fetchFiltersProgressively();

      expect(result).toEqual(freshCache.filters);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(FILTER_CACHE_KEY);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch new filters if cache is expired', async () => {
      const expiredCache = {
        filters: { areas: [], vendors: [], types: [] },
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredCache));
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse([{ name: 'new', version: '1.0' }], 1)),
      });

      const result = await fetchFiltersProgressively();

      expect(mockFetch).toHaveBeenCalled();
      expect(result.areas).toContain('Integration');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(FILTER_CACHE_KEY);
    });

    it('should fetch and cache filters when cache is empty', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse([], 50)), // count <= 100
      });

      await fetchFiltersProgressively();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(FILTER_CACHE_KEY, expect.any(String));
    });

    it('should trigger onUpdate for background fetch when count > 100', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const initialResponse = createMockApiResponse([], 150); // count > 100
      const batch1 = createMockApiResponse(
        Array.from({ length: 100 }, (_, i) => ({ name: `pkg-${i}`, version: '1.0.0' })),
        150
      );
      const batch2 = createMockApiResponse(
        Array.from({ length: 50 }, (_, i) => ({ name: `pkg-${100 + i}`, version: '1.0.0' })),
        150
      );

      // 1. Initial fetch (progressive)
      // 2. First batch of full fetch
      // 3. Second batch of full fetch
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(initialResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(batch1) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(batch2) });

      const onUpdate = jest.fn();
      await fetchFiltersProgressively('ballerinax', onUpdate);

      // Give the background async task time to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onUpdate).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(FILTER_CACHE_KEY, expect.any(String));
    }, 10000);
  });
});
