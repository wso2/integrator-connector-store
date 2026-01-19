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

import { BallerinaPackage, ConnectorMetadata, FilterOptions } from '@/types/connector';

/**
 * Dictionary for proper brand/term capitalization
 * Maps lowercase to proper capitalization
 */
const CAPITALIZATION_DICTIONARY: Record<string, string> = {
  // AI/ML Services
  'openai': 'OpenAI',
  'ai': 'AI',
  'ml': 'ML',

  // Cloud Providers & Services
  'aws': 'AWS',
  'gcp': 'GCP',
  'azure': 'Azure',
  's3': 'S3',
  'sqs': 'SQS',
  'sns': 'SNS',
  'dynamodb': 'DynamoDB',

  // Protocols & Standards
  'api': 'API',
  'http': 'HTTP',
  'https': 'HTTPS',
  'ftp': 'FTP',
  'sftp': 'SFTP',
  'ssh': 'SSH',
  'sql': 'SQL',
  'nosql': 'NoSQL',
  'graphql': 'GraphQL',
  'grpc': 'gRPC',
  'rest': 'REST',
  'soap': 'SOAP',
  'smtp': 'SMTP',
  'imap': 'IMAP',
  'pop3': 'POP3',
  'tcp': 'TCP',
  'udp': 'UDP',
  'ip': 'IP',
  'dns': 'DNS',
  'ldap': 'LDAP',

  // Data Formats
  'xml': 'XML',
  'json': 'JSON',
  'html': 'HTML',
  'css': 'CSS',
  'csv': 'CSV',
  'yaml': 'YAML',
  'toml': 'TOML',

  // Auth & Security
  'jwt': 'JWT',
  'oauth': 'OAuth',
  'saml': 'SAML',
  'openid': 'OpenID',

  // Messaging
  'rss': 'RSS',
  'sms': 'SMS',
  'mms': 'MMS',
  'mqtt': 'MQTT',
  'amqp': 'AMQP',

  // Databases
  'mysql': 'MySQL',
  'postgresql': 'PostgreSQL',
  'mongodb': 'MongoDB',
  'redis': 'Redis',
  'mssql': 'MSSQL',
  'mariadb': 'MariaDB',

  // Platforms & Companies (common ones)
  'github': 'GitHub',
  'gitlab': 'GitLab',
  'bitbucket': 'Bitbucket',
  'salesforce': 'Salesforce',
  'workday': 'Workday',
  'servicenow': 'ServiceNow',
  'shopify': 'Shopify',
  'stripe': 'Stripe',
  'paypal': 'PayPal',
  'twilio': 'Twilio',
  'sendgrid': 'SendGrid',
  'hubspot': 'HubSpot',
  'zendesk': 'Zendesk',
  'jira': 'Jira',
  'confluence': 'Confluence',
  'linkedin': 'LinkedIn',
  'facebook': 'Facebook',
  'instagram': 'Instagram',
  'youtube': 'YouTube',
  'twitter': 'Twitter',
  'slack': 'Slack',
  'discord': 'Discord',
  'dropbox': 'Dropbox',
  'onedrive': 'OneDrive',
  'googledrive': 'GoogleDrive',
  'googleapis': 'GoogleAPIs',

  // Technologies
  'iot': 'IoT',
  'sdk': 'SDK',
  'cli': 'CLI',
  'ui': 'UI',
  'ux': 'UX',
  'url': 'URL',
  'uri': 'URI',
  'uuid': 'UUID',
  'pdf': 'PDF',
  'gif': 'GIF',
  'png': 'PNG',
  'jpg': 'JPG',
  'jpeg': 'JPEG',
  'svg': 'SVG',
};

/**
 * Converts a package name to a display name using smart capitalization
 *
 * Strategy:
 * 1. Uses capitalization dictionary for known brands/terms (OpenAI, GitHub, etc.)
 * 2. Uses vendor metadata for proper brand capitalization
 * 3. Default: capitalize first letter of each part
 *
 * Examples:
 * - openai => OpenAI (dictionary)
 * - aws.s3 => AWS S3 (dictionary)
 * - salesforce.api => Salesforce API (vendor + dictionary)
 * - github.connector => GitHub Connector (dictionary)
 */
export function getDisplayName(packageName: string, vendor?: string): string {
  // Split by dot to get parts
  const parts = packageName.split('.');

  // Transform each part to capitalize properly
  const transformedParts = parts.map((part, index) => {
    const lowerPart = part.toLowerCase();

    // Check dictionary first
    if (CAPITALIZATION_DICTIONARY[lowerPart]) {
      return CAPITALIZATION_DICTIONARY[lowerPart];
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
  const types = new Set<string>();

  connectors.forEach((connector) => {
    const metadata = parseConnectorMetadata(connector.keywords);
    // Include ALL connectors regardless of type
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
        (a, b) => (b.totalPullCount || 0) - (a.totalPullCount || 0)
      );

    case 'pullCount-asc':
      return sorted.sort(
        (a, b) => (a.totalPullCount || 0) - (b.totalPullCount || 0)
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
