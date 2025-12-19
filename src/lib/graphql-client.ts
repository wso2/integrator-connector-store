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
    throw error;
  }
}


/**
 * Fetches total pull counts for multiple packages in a single batched request using GraphQL aliases
 */
async function fetchBatchedPullCounts(
  packageInfos: Array<{ name: string; version: string }>,
  orgName: string = 'ballerinax'
): Promise<Map<string, number>> {
  if (packageInfos.length === 0) {
    return new Map();
  }

  // Build a query with aliases for each package
  const aliases = packageInfos.map((pkg, index) => {
    // Create a safe alias by replacing special characters
    const safeAlias = `pkg${index}`;
    return `${safeAlias}: package(orgName: "${orgName}", packageName: "${pkg.name}", version: "${pkg.version}") {
      totalPullCount
    }`;
  });

  const query = `query GetBatchedPullCounts {
    ${aliases.join('\n    ')}
  }`;

  try {
    const data = await client.request<Record<string, { totalPullCount: number }>>(query);

    // Map the results back to package names
    const pullCountMap = new Map<string, number>();
    packageInfos.forEach((pkg, index) => {
      const alias = `pkg${index}`;
      const result = data[alias];
      if (result) {
        pullCountMap.set(pkg.name, result.totalPullCount);
      }
    });

    return pullCountMap;
  } catch (error) {
    return new Map();
  }
}

/**
 * Enriches packages with correct total pull counts using batched GraphQL queries
 * The packages query returns per-version data, but we need aggregated counts across all versions
 */
export async function enrichPackagesWithPullCounts(
  packages: BallerinaPackage[],
  orgName: string = 'ballerinax'
): Promise<BallerinaPackage[]> {
  // Group packages by name to get unique packages with their versions
  const uniquePackages = new Map<string, BallerinaPackage>();
  packages.forEach((pkg) => {
    if (!uniquePackages.has(pkg.name)) {
      uniquePackages.set(pkg.name, pkg);
    }
  });

  // Prepare batch requests (GraphQL has limits, so we batch in chunks of 50)
  // Run batches in PARALLEL instead of sequential for faster loading
  const uniquePackageArray = Array.from(uniquePackages.values());
  const batchSize = 50;
  const pullCountMap = new Map<string, number>();

  const batchPromises = [];
  for (let i = 0; i < uniquePackageArray.length; i += batchSize) {
    const batch = uniquePackageArray.slice(i, i + batchSize);
    const batchInfos = batch.map((pkg) => ({
      name: pkg.name,
      version: pkg.version,
    }));

    batchPromises.push(fetchBatchedPullCounts(batchInfos, orgName));
  }

  // Wait for all batches in parallel
  const allBatchResults = await Promise.all(batchPromises);
  allBatchResults.forEach((batchResults) => {
    batchResults.forEach((count, name) => {
      pullCountMap.set(name, count);
    });
  });

  // Enrich all packages with the fetched pull counts
  return packages.map((pkg) => ({
    ...pkg,
    totalPullCount: pullCountMap.get(pkg.name) || pkg.pullCount || 0,
  }));
}
