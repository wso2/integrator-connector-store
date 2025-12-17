import { BallerinaPackage, ConnectorMetadata, FilterOptions } from '@/types/connector';

/**
 * Extracts metadata from connector keywords
 */
export function parseConnectorMetadata(keywords: string[]): ConnectorMetadata {
  const area = keywords.find((k) => k.startsWith('Area/'))?.replace('Area/', '') || 'Other';
  const vendor = keywords.find((k) => k.startsWith('Vendor/'))?.replace('Vendor/', '') || 'Other';
  const type = keywords.find((k) => k.startsWith('Type/'))?.replace('Type/', '') || 'Other';

  return { area, vendor, type };
}

/**
 * Extracts all unique filter options from connectors
 */
export function extractFilterOptions(connectors: BallerinaPackage[]): FilterOptions {
  const areas = new Set<string>();
  const vendors = new Set<string>();
  const types = new Set<string>();

  connectors.forEach((connector) => {
    const metadata = parseConnectorMetadata(connector.keywords);
    areas.add(metadata.area);
    vendors.add(metadata.vendor);
    types.add(metadata.type);
  });

  return {
    areas: Array.from(areas).sort(),
    vendors: Array.from(vendors).sort(),
    types: Array.from(types).sort(),
  };
}

/**
 * Filters connectors based on selected criteria
 */
export function filterConnectors(
  connectors: BallerinaPackage[],
  filters: {
    selectedAreas: string[];
    selectedVendors: string[];
    selectedTypes: string[];
    searchQuery: string;
  }
): BallerinaPackage[] {
  return connectors.filter((connector) => {
    const metadata = parseConnectorMetadata(connector.keywords);

    // Area filter
    if (filters.selectedAreas.length > 0 && !filters.selectedAreas.includes(metadata.area)) {
      return false;
    }

    // Vendor filter
    if (filters.selectedVendors.length > 0 && !filters.selectedVendors.includes(metadata.vendor)) {
      return false;
    }

    // Type filter
    if (filters.selectedTypes.length > 0 && !filters.selectedTypes.includes(metadata.type)) {
      return false;
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        connector.name,
        connector.summary,
        ...connector.keywords,
        metadata.area,
        metadata.vendor,
        metadata.type,
      ].join(' ').toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Formats pull count for display
 */
export function formatPullCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Sort options
 */
export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'pullCount-desc'
  | 'pullCount-asc'
  | 'date-desc'
  | 'date-asc';

/**
 * Sorts connectors based on selected option
 */
export function sortConnectors(
  connectors: BallerinaPackage[],
  sortBy: SortOption
): BallerinaPackage[] {
  const sorted = [...connectors];

  switch (sortBy) {
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));

    case 'pullCount-desc':
      return sorted.sort((a, b) => (b.totalPullCount || b.pullCount) - (a.totalPullCount || a.pullCount));

    case 'pullCount-asc':
      return sorted.sort((a, b) => (a.totalPullCount || a.pullCount) - (b.totalPullCount || b.pullCount));

    case 'date-desc':
      return sorted.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

    case 'date-asc':
      return sorted.sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());

    default:
      return sorted;
  }
}
