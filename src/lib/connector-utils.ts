import { BallerinaPackage, ConnectorMetadata, FilterOptions } from '@/types/connector';

/**
 * Converts a package name to a display name using smart capitalization
 *
 * Strategy:
 * 1. Uses vendor metadata (from keywords) for proper brand capitalization (e.g., Salesforce, GitHub)
 * 2. Only hardcodes very common technical acronyms (API, SQL, HTTP, etc.)
 * 3. Default: capitalize first letter of each part
 *
 * Examples:
 * - aws.s3 => AWS S3 (technical acronyms)
 * - salesforce.api => Salesforce API (uses Vendor keyword + technical acronym)
 * - github.connector => GitHub Connector (uses Vendor keyword)
 */
export function getDisplayName(packageName: string, vendor?: string): string {
  // Split by dot to get parts
  const parts = packageName.split('.');

  // Transform each part to capitalize properly
  const transformedParts = parts.map((part, index) => {
    const lowerPart = part.toLowerCase();

    // Very common technical acronyms (minimal list of widely-used terms)
    const technicalAcronyms = [
      'api', 'http', 'https', 'ftp', 'sftp', 'ssh', 'sql',
      'xml', 'json', 'html', 'css', 'rest', 'soap', 'smtp',
      'imap', 'pop3', 'jwt', 'oauth', 'tcp', 'udp', 'ip',
      'dns', 'url', 'uri', 'csv', 'rss', 'sms', 'mms', 'iot',
      'aws', 'gcp', 's3', 'sqs', 'sns', 'ldap'
    ];

    // Check if it's a technical acronym
    if (technicalAcronyms.includes(lowerPart)) {
      return part.toUpperCase();
    }

    // If we have vendor info and this is the first part, try to match with vendor
    if (index === 0 && vendor && vendor.toLowerCase() !== 'other') {
      const vendorLower = vendor.toLowerCase();
      // Check if the part matches or is contained in the vendor name
      if (lowerPart === vendorLower || vendorLower.includes(lowerPart) || lowerPart.includes(vendorLower)) {
        return vendor; // Use the vendor's proper capitalization
      }
    }

    // Default: capitalize first letter
    return part.charAt(0).toUpperCase() + part.slice(1);
  });

  // Join with space
  return transformedParts.join(' ');
}

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
 * Note: Only includes connectors with type "connector"
 */
export function extractFilterOptions(connectors: BallerinaPackage[]): FilterOptions {
  const areas = new Set<string>();
  const vendors = new Set<string>();

  connectors.forEach((connector) => {
    const metadata = parseConnectorMetadata(connector.keywords);
    // Only include connectors with type "connector"
    if (metadata.type.toLowerCase() === 'connector') {
      areas.add(metadata.area);
      vendors.add(metadata.vendor);
    }
  });

  return {
    areas: Array.from(areas).sort(),
    vendors: Array.from(vendors).sort(),
  };
}


/**
 * Filters connectors based on selected criteria
 * Note: Automatically filters to only show connectors with type "connector"
 */
export function filterConnectors(
  connectors: BallerinaPackage[],
  filters: {
    selectedAreas: string[];
    selectedVendors: string[];
    searchQuery: string;
  }
): BallerinaPackage[] {
  return connectors.filter((connector) => {
    const metadata = parseConnectorMetadata(connector.keywords);

    // Only show connectors with type "connector"
    if (metadata.type.toLowerCase() !== 'connector') {
      return false;
    }

    // Area filter
    if (filters.selectedAreas.length > 0 && !filters.selectedAreas.includes(metadata.area)) {
      return false;
    }

    // Vendor filter
    if (filters.selectedVendors.length > 0 && !filters.selectedVendors.includes(metadata.vendor)) {
      return false;
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const displayName = getDisplayName(connector.name, metadata.vendor);
      const searchableText = [
        connector.name,
        displayName,
        connector.summary,
        ...connector.keywords,
        metadata.area,
        metadata.vendor,
      ]
        .join(' ')
        .toLowerCase();

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
 * Formats a date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculates days since a date
 */
export function getDaysSinceUpdate(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Formats time since update in a human-readable way
 */
export function formatDaysSince(dateString: string): string {
  const days = getDaysSinceUpdate(dateString);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
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
      return sorted.sort((a, b) => {
        const vendorA = parseConnectorMetadata(a.keywords).vendor;
        const vendorB = parseConnectorMetadata(b.keywords).vendor;
        return getDisplayName(a.name, vendorA).localeCompare(getDisplayName(b.name, vendorB));
      });

    case 'name-desc':
      return sorted.sort((a, b) => {
        const vendorA = parseConnectorMetadata(a.keywords).vendor;
        const vendorB = parseConnectorMetadata(b.keywords).vendor;
        return getDisplayName(b.name, vendorB).localeCompare(getDisplayName(a.name, vendorA));
      });

    case 'pullCount-desc':
      return sorted.sort(
        (a, b) => (b.totalPullCount || b.pullCount) - (a.totalPullCount || a.pullCount)
      );

    case 'pullCount-asc':
      return sorted.sort(
        (a, b) => (a.totalPullCount || a.pullCount) - (b.totalPullCount || b.pullCount)
      );

    case 'date-desc':
      return sorted.sort(
        (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      );

    case 'date-asc':
      return sorted.sort(
        (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
      );

    default:
      return sorted;
  }
}
