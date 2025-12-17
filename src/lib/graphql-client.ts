import { GraphQLClient } from 'graphql-request';
import { BallerinaPackage } from '@/types/connector';

const GRAPHQL_ENDPOINT = 'https://api.central.ballerina.io/2.0/graphql';

const client = new GraphQLClient(GRAPHQL_ENDPOINT);

const GET_BALLERINAX_CONNECTORS = `
  query GetBallerinaxConnectors(
    $orgName: String!
    $limit: Int!
    $offset: Int!
  ) {
    packages(
      orgName: $orgName
      limit: $limit
      offset: $offset
    ) {
      packages {
        name
        version
        URL
        summary
        keywords
        icon
        createdDate
        totalPullCount
        pullCount
      }
    }
  }
`;

interface GraphQLResponse {
  packages: {
    packages: BallerinaPackage[];
  };
}

export async function fetchConnectors(
  orgName: string = 'ballerinax',
  limit: number = 100,
  offset: number = 0
): Promise<BallerinaPackage[]> {
  try {
    const data = await client.request<GraphQLResponse>(GET_BALLERINAX_CONNECTORS, {
      orgName,
      limit,
      offset,
    });
    return data.packages.packages;
  } catch (error) {
    console.error('Error fetching connectors:', error);
    throw error;
  }
}

export async function fetchAllConnectors(
  orgName: string = 'ballerinax'
): Promise<BallerinaPackage[]> {
  const allConnectors: BallerinaPackage[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const batch = await fetchConnectors(orgName, limit, offset);
    allConnectors.push(...batch);

    if (batch.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  return allConnectors;
}

// Lightweight query for fetching just pull counts
const GET_PULL_COUNTS = `
  query GetPullCounts(
    $orgName: String!
    $limit: Int!
    $offset: Int!
  ) {
    packages(
      orgName: $orgName
      limit: $limit
      offset: $offset
    ) {
      packages {
        name
        pullCount
      }
    }
  }
`;

interface PullCountPackage {
  name: string;
  pullCount: number;
}

interface PullCountResponse {
  packages: {
    packages: PullCountPackage[];
  };
}

/**
 * Efficiently fetches pull counts for all package versions using GraphQL
 * Returns a map of package name to aggregated total pull count
 */
export async function fetchAllPullCountsGraphQL(
  orgName: string = 'ballerinax'
): Promise<Map<string, number>> {
  const pullCountMap = new Map<string, number>();

  try {
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    // Fetching pull counts for all packages

    while (hasMore) {
      const data = await client.request<PullCountResponse>(GET_PULL_COUNTS, {
        orgName,
        limit,
        offset,
      });

      const packages = data.packages.packages;

      // Aggregate pull counts by package name
      packages.forEach((pkg) => {
        const currentCount = pullCountMap.get(pkg.name) || 0;
        pullCountMap.set(pkg.name, currentCount + pkg.pullCount);
      });

      if (packages.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }

      // Small delay to avoid rate limiting
      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Successfully aggregated pull counts
  } catch (error) {
    console.error('[GraphQL Pull Count] Error:', error);
  }

  return pullCountMap;
}
