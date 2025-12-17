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
    const data = await client.request<GraphQLResponse>(
      GET_BALLERINAX_CONNECTORS,
      {
        orgName,
        limit,
        offset,
      }
    );
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
