import { BallerinaPackage } from '@/types/connector';

const REST_ENDPOINT = 'https://api.central.ballerina.io/2.0/registry/packages';

interface RestApiPackage {
  id: string;
  organization: string;
  name: string;
  version: string;
  platform: string;
  summary: string;
  readme: string;
  icon: string;
  URL: string;
  isDeprecated: boolean;
  visibility: string;
  licenses: string[];
  authors: string[];
  pullCount: number;
  createdDate: string;
  balaVersion: string;
  balaURL: string;
  digest: string;
  modules: any[];
}

interface RestApiResponse {
  packages: RestApiPackage[];
  count: number;
  offset: number;
  limit: number;
}

/**
 * Efficiently fetches total pull counts for ALL ballerinax packages
 * Uses a single batch fetch with pagination to build a complete lookup map
 * This avoids making 700+ individual requests
 */
export async function fetchAllPullCounts(
  orgName: string = 'ballerinax'
): Promise<Map<string, number>> {
  const pullCountMap = new Map<string, number>();

  try {
    let offset = 0;
    const limit = 100; // Max allowed by API
    let hasMore = true;
    let totalCount = 0;

    console.log(`[Pull Count Fetch] Starting batch fetch for ${orgName} packages...`);

    while (hasMore) {
      const url = `${REST_ENDPOINT}?offset=${offset}&limit=${limit}&org=${orgName}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`[Pull Count Fetch] API error: ${response.status}`);
        break;
      }

      const data: RestApiResponse = await response.json();
      totalCount = data.count;

      // Aggregate pull counts by package name
      // Since each version has its own pull count, we sum them up
      data.packages.forEach((pkg) => {
        const currentCount = pullCountMap.get(pkg.name) || 0;
        pullCountMap.set(pkg.name, currentCount + pkg.pullCount);
      });

      console.log(`[Pull Count Fetch] Fetched ${offset + data.packages.length}/${totalCount} packages`);

      if (data.packages.length < limit || offset + limit >= totalCount) {
        hasMore = false;
      } else {
        offset += limit;
      }

      // Small delay to avoid rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`[Pull Count Fetch] Complete! Loaded ${pullCountMap.size} unique packages`);
  } catch (error) {
    console.error('[Pull Count Fetch] Error:', error);
  }

  return pullCountMap;
}

/**
 * Updates connectors with aggregated total pull counts
 * This gives the true total downloads across all versions
 */
export async function enrichConnectorsWithTotalPullCounts(
  connectors: BallerinaPackage[]
): Promise<BallerinaPackage[]> {
  const pullCountMap = await fetchAllPullCounts('ballerinax');

  return connectors.map((connector) => ({
    ...connector,
    totalPullCount: pullCountMap.get(connector.name) || connector.pullCount,
  }));
}
