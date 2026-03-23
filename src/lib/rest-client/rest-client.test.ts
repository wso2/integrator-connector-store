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

const FILTER_CACHE_KEY = 'ballerina_connector_filters';

// Use a simple in-memory store to back localStorage mock
const storageStore: Record<string, string> = {};
const storageMock = {
  getItem: jest.fn((key: string) => storageStore[key] ?? null),
  setItem: jest.fn((key: string, value: string) => {
    storageStore[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete storageStore[key];
  }),
  clear: jest.fn(() => {
    Object.keys(storageStore).forEach((key) => delete storageStore[key]);
  }),
};
Object.defineProperty(window, 'localStorage', {
  value: storageMock,
  writable: true,
  configurable: true,
});
Object.defineProperty(global, 'localStorage', {
  value: storageMock,
  writable: true,
  configurable: true,
});

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
    // Reset fetch mock and provide safe default
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMockApiResponse([], 0)),
    });

    // Reset storage - clear store and restore implementations
    Object.keys(storageStore).forEach((key) => delete storageStore[key]);
    storageMock.getItem.mockImplementation((key: string) => storageStore[key] ?? null);
    storageMock.setItem.mockImplementation((key: string, value: string) => {
      storageStore[key] = value;
    });
    storageMock.removeItem.mockImplementation((key: string) => {
      delete storageStore[key];
    });
    storageMock.clear.mockImplementation(() => {
      Object.keys(storageStore).forEach((key) => delete storageStore[key]);
    });

    // Suppress console output during tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
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
      // With a search query, searchPackages fetches all results for client-side filtering.
      // First call: count check (limit=1), second call: full batch fetch.
      const countResponse = createMockApiResponse([], 1);
      const batchResponse = createMockApiResponse([{ name: 'stripe', version: '1.0.0' }], 1);
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(countResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(batchResponse) });

      await searchPackages({ query: 'stripe', offset: 0, limit: 30, sort: 'pullCount-desc' });
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('stripe');
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

    it('should exclude Type/Other packages from results', async () => {
      const mockResponse = createMockApiResponse(
        [
          { name: 'visible-connector', version: '1.0.0', keywords: ['Type/Connector'] },
          { name: 'internal-module', version: '1.0.0', keywords: [] }, // defaults to Type/Other
        ],
        2
      );
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await searchPackages({ offset: 0, limit: 30, sort: 'pullCount-desc' });

      expect(result.packages).toHaveLength(1);
      expect(result.packages[0].name).toBe('visible-connector');
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
    it('should return cached filters if available and not expired', async () => {
      const freshCache = {
        filters: { areas: ['CachedArea'], vendors: ['CachedVendor'], types: ['CachedType'] },
        timestamp: Date.now(),
      };
      storageMock.setItem(FILTER_CACHE_KEY, JSON.stringify(freshCache));
      storageMock.setItem.mockClear();

      const result = await fetchFiltersProgressively();

      expect(result).toEqual(freshCache.filters);
      expect(storageMock.getItem).toHaveBeenCalledWith(FILTER_CACHE_KEY);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch new filters if cache is expired', async () => {
      const expiredCache = {
        filters: { areas: [], vendors: [], types: [] },
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };
      storageMock.setItem(FILTER_CACHE_KEY, JSON.stringify(expiredCache));
      storageMock.removeItem.mockClear();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse([{ name: 'new', version: '1.0' }], 1)),
      });

      const result = await fetchFiltersProgressively();

      expect(mockFetch).toHaveBeenCalled();
      expect(result.areas).toContain('Integration');
      expect(storageMock.removeItem).toHaveBeenCalledWith(FILTER_CACHE_KEY);
    });

    it('should fetch and cache filters when cache is empty', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse([], 50)), // count <= 100
      });

      await fetchFiltersProgressively();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(storageMock.setItem).toHaveBeenCalledWith(FILTER_CACHE_KEY, expect.any(String));
    });

    it('should trigger onUpdate for background fetch when count > 100', async () => {
      const initialResponse = createMockApiResponse([], 150); // count > 100
      const batch1 = createMockApiResponse(
        Array.from({ length: 100 }, (_, i) => ({ name: `pkg-${i}`, version: '1.0.0' })),
        150
      );
      const batch2 = createMockApiResponse(
        Array.from({ length: 50 }, (_, i) => ({ name: `pkg-${100 + i}`, version: '1.0.0' })),
        150
      );

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(initialResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(batch1) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(batch2) });

      const onUpdate = jest.fn();
      await fetchFiltersProgressively('ballerinax', onUpdate);

      // Give the background async task time to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onUpdate).toHaveBeenCalled();
      expect(storageMock.setItem).toHaveBeenCalledWith(FILTER_CACHE_KEY, expect.any(String));
    }, 10000);
  });
});
