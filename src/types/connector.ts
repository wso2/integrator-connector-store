export interface BallerinaPackage {
  name: string;
  version: string;
  URL: string;
  summary: string;
  keywords: string[];
  icon: string;
  createdDate: string;
  totalPullCount?: number;
}

export interface ConnectorMetadata {
  area: string;
  vendor: string;
  type: string;
}

export interface FilterOptions {
  areas: string[];
  vendors: string[];
  types: string[];
}

export interface ConnectorFilters {
  selectedAreas: string[];
  selectedVendors: string[];
  selectedTypes: string[];
  searchQuery: string;
}
