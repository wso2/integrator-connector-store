# WSO2 Integrator Connector Store - AI Context Guide

## Project Overview

**Name**: WSO2 Integrator Connector Store
**Type**: React Web Application (migrated from Next.js to Create React App)
**Purpose**: A searchable, filterable catalog of Ballerina connectors for WSO2 Integrator
**Status**: Active development on branch `migrate-to-cra`
**Target Performance**: Page load < 2 seconds

This application provides a user-friendly interface to discover, search, and browse 800+ Ballerina connectors from Ballerina Central, with features similar to the [Refold.ai Integrations Store](https://www.refold.ai/integrations).

## Architecture

### Tech Stack

```json
{
  "framework": "React 19.2.3 (CRA)",
  "language": "TypeScript 5.9.3 (strict mode)",
  "ui": "Material-UI 7.3.6",
  "styling": "Emotion CSS-in-JS",
  "routing": "react-router-dom 6.30.2",
  "api": "GraphQL (graphql-request 7.4.0)",
  "build": "react-app-rewired 2.2.1"
}
```

### Project Structure

```
src/
├── App.tsx                      # Main app entry, routing setup
├── index.tsx                    # React DOM render, theme provider wrapper
├── pages/
│   └── HomePage.tsx             # Main connector store page (348 lines)
├── components/
│   ├── ConnectorCard.tsx        # Individual connector card (159 lines)
│   ├── FilterSidebar.tsx        # Filter panel with Area/Vendor (116 lines)
│   ├── Pagination.tsx           # Smart pagination component (169 lines)
│   ├── SearchBar.tsx            # Real-time search input (39 lines)
│   ├── SortSelector.tsx         # Sort dropdown (50 lines)
│   ├── ThemeProvider.tsx        # Dark/light theme context (79 lines)
│   ├── ThemeToggle.tsx          # Theme switcher button
│   └── WSO2Header.tsx           # Branded header (54 lines)
├── lib/
│   ├── connector-utils.ts       # Filtering, sorting, formatting (246 lines)
│   └── graphql-client.ts        # GraphQL API integration
├── types/
│   └── connector.ts             # TypeScript interfaces
└── styles/
    ├── globals.css              # Global styles
    └── theme.ts                 # WSO2 design tokens
```

## Data Architecture

### Data Model

```typescript
// Core connector data structure
interface BallerinaPackage {
  name: string;              // e.g., "salesforce"
  version: string;           // e.g., "8.0.0"
  URL: string;               // Link to Ballerina Central docs
  summary: string;           // Markdown description
  keywords: string[];        // Metadata tags (Area/*, Vendor/*, Type/*)
  icon: string;              // Icon URL
  createdDate: string;       // ISO date
  totalPullCount?: number;   // Aggregated downloads (enriched)
  pullCount: number;         // Per-version downloads
}

// Metadata extracted from keywords
interface ConnectorMetadata {
  area: string;     // Finance, Health, Communication, etc.
  vendor: string;   // AWS, Salesforce, Google, etc.
  type: string;     // API, Database, Messaging, etc.
}
```

### Keyword-Based Metadata System

Connectors use a keyword-based metadata system:

```typescript
keywords: [
  "Area/Finance",           // Categorization
  "Vendor/Stripe",          // Provider/Brand
  "Type/connector",         // Package type
  "payment",                // Searchable tags
  "billing"
]
```

**Parsing Logic** (`connector-utils.ts:58-64`):
```typescript
function parseConnectorMetadata(keywords: string[]): ConnectorMetadata {
  const area = keywords.find(k => k.startsWith('Area/'))?.replace('Area/', '') || 'Other';
  const vendor = keywords.find(k => k.startsWith('Vendor/'))?.replace('Vendor/', '') || 'Other';
  const type = keywords.find(k => k.startsWith('Type/'))?.replace('Type/', '') || 'Other';
  return { area, vendor, type };
}
```

## API Integration

### GraphQL Endpoint

**URL**: `https://api.central.ballerina.io/2.0/graphql`

**Primary Query**:
```graphql
query GetBallerinaxConnectors(
  $orgName: String!,
  $limit: Int!,
  $offset: Int!
) {
  packages(orgName: $orgName, limit: $limit, offset: $offset) {
    packages {
      name
      version
      URL
      summary
      keywords
      icon
      createdDate
      pullCount
      totalPullCount
    }
  }
}
```

**Variables**:
- `orgName`: `"ballerinax"` (connector organization)
- `limit`: 100 (batch size)
- `offset`: Pagination offset

**Known Issue**: `totalPullCount` returns null/0, requiring separate enrichment query.

### Hybrid Data Loading Strategy

The app uses a **progressive loading strategy** for optimal perceived performance:

```
┌─────────────────────────────────────────────────────────┐
│ Phase 1: Immediate Display (< 1s)                       │
│ - Fetch first 100 connectors                            │
│ - Hide loading spinner                                  │
│ - Display cards (without accurate pull counts)          │
│ - Extract initial filter options                        │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 2: Parallel Background Fetching                   │
│ - Fetch remaining 700 connectors in 7 parallel requests │
│ - Each batch: 100 connectors                            │
│ - Update filter options as batches arrive               │
│ - Deduplicate by name-version pair                      │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 3: Progressive Pull Count Enrichment              │
│ - Enrich first 100 connectors (visible cards priority)  │
│ - Update state immediately                              │
│ - Enrich remaining batches in background                │
│ - Uses GraphQL aliases for batched queries (50/request) │
└─────────────────────────────────────────────────────────┘
```

**Implementation** (`HomePage.tsx:39-118`):
```typescript
useEffect(() => {
  const loadConnectors = async () => {
    // Phase 1: First batch
    const firstBatch = await fetchConnectors('ballerinax', 100, 0);
    setConnectors(firstBatch);
    setLoading(false); // UI visible immediately

    // Phase 2: Remaining batches in parallel
    const remainingPromises = [...Array(7)].map((_, i) =>
      fetchConnectors('ballerinax', 100, (i + 1) * 100)
    );
    const remainingBatches = await Promise.all(remainingPromises);
    const allConnectors = [firstBatch, ...remainingBatches].flat();

    // Phase 3: Progressive enrichment
    const enrichedFirst = await enrichPackagesWithPullCounts(allConnectors.slice(0, 100));
    setConnectors(partiallyEnriched);

    const enrichedRest = await enrichPackagesWithPullCounts(allConnectors.slice(100));
    setConnectors(fullyEnriched);
  };
}, []);
```

## State Management

### HomePage State Architecture

**Primary State** (`HomePage.tsx:21-36`):
```typescript
// Data
const [connectors, setConnectors] = useState<BallerinaPackage[]>([]);
const [filterOptions, setFilterOptions] = useState<FilterOptions>({ areas: [], vendors: [] });
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Filters
const [searchQuery, setSearchQuery] = useState('');
const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

// Pagination
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(24);

// Sorting
const [sortBy, setSortBy] = useState<SortOption>('pullCount-desc');
```

### Derived State (Memoized)

**Filtering + Sorting** (`HomePage.tsx:121-128`):
```typescript
const filteredConnectors = useMemo(() => {
  const filtered = filterConnectors(connectors, {
    selectedAreas,
    selectedVendors,
    searchQuery,
  });
  return sortConnectors(filtered, sortBy);
}, [connectors, selectedAreas, selectedVendors, searchQuery, sortBy]);
```

**Pagination** (`HomePage.tsx:131-135`):
```typescript
const paginatedConnectors = useMemo(() => {
  const startIndex = (currentPage - 1) * pageSize;
  return filteredConnectors.slice(startIndex, startIndex + pageSize);
}, [filteredConnectors, currentPage, pageSize]);
```

### State Update Side Effects

**Auto-reset pagination on filter changes** (`HomePage.tsx:138-140`):
```typescript
useEffect(() => {
  setCurrentPage(1);
}, [selectedAreas, selectedVendors, searchQuery, pageSize]);
```

**Auto-scroll on page navigation** (`HomePage.tsx:143-145`):
```typescript
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, [currentPage]);
```

## Core Features

### 1. Search (`SearchBar.tsx`)

**Functionality**:
- Real-time, case-insensitive search
- Searches across: name, display name, summary, keywords, area, vendor

**Search Algorithm** (`connector-utils.ts:114-130`):
```typescript
const searchableText = [
  connector.name,
  getDisplayName(connector.name, metadata.vendor),
  connector.summary,
  ...connector.keywords,
  metadata.area,
  metadata.vendor,
].join(' ').toLowerCase();

return searchableText.includes(query.toLowerCase());
```

### 2. Filtering (`FilterSidebar.tsx`)

**Filter Categories**:
- **Area**: Finance, Health, Communication, Productivity, etc.
- **Vendor**: AWS, Salesforce, Google, Microsoft, etc.
- **Type**: Displayed on cards but NOT filterable (migration requirement)

**Dynamic Filter Extraction** (`connector-utils.ts:70-85`):
```typescript
function extractFilterOptions(connectors: BallerinaPackage[]): FilterOptions {
  const areas = new Set<string>();
  const vendors = new Set<string>();

  connectors.forEach(connector => {
    const { area, vendor } = parseConnectorMetadata(connector.keywords);
    areas.add(area);
    vendors.add(vendor);
  });

  return {
    areas: Array.from(areas).sort(),
    vendors: Array.from(vendors).sort(),
  };
}
```

**Filter Logic** (`connector-utils.ts:92-135`):
- Multi-select within categories (OR logic)
- Combined with search (AND logic)
- Automatically includes all connector types (migration change)

### 3. Sorting (`SortSelector.tsx`)

**6 Sort Options**:
1. Name (A-Z)
2. Name (Z-A)
3. Most Popular (highest downloads)
4. Least Popular (lowest downloads)
5. Newest First
6. Oldest First

**Smart Name Sorting** (`connector-utils.ts:16-53`):
Uses vendor metadata for proper brand capitalization:
```typescript
function getDisplayName(packageName: string, vendor?: string): string {
  // salesforce.api + vendor="Salesforce" → "Salesforce API"
  // aws.s3 → "AWS S3" (technical acronym)
  // github.connector + vendor="GitHub" → "GitHub Connector"
}
```

### 4. Pagination (`Pagination.tsx`)

**Features**:
- Smart page number display with ellipsis
- Customizable page size: 10, 24, 50, 100
- "Showing X-Y of Z" counter
- Previous/Next navigation
- Auto-scroll to top on page change

**Smart Ellipsis Logic** (`Pagination.tsx:69-96`):
```
Total pages: 25, Current: 5
Display: [1] ... [4] [5] [6] ... [25]

Total pages: 6, Current: 3
Display: [1] [2] [3] [4] [5] [6] (no ellipsis)
```

## Utility Functions

### Display Name Generation (`connector-utils.ts:16-53`)

**Purpose**: Convert package names to human-readable titles with proper capitalization

**Strategy**:
1. Use vendor metadata for brand names (Salesforce, GitHub)
2. Hardcode technical acronyms (API, SQL, HTTP, AWS)
3. Default: capitalize first letter

**Examples**:
```typescript
getDisplayName('salesforce', 'Salesforce')        → "Salesforce"
getDisplayName('salesforce.api', 'Salesforce')    → "Salesforce API"
getDisplayName('aws.s3')                          → "AWS S3"
getDisplayName('github.connector', 'GitHub')      → "GitHub Connector"
```

### Number Formatting (`connector-utils.ts:140-148`)

```typescript
formatPullCount(1_200_000) → "1.2M"
formatPullCount(500_000)   → "500.0K"
formatPullCount(999)       → "999"
```

### Date Formatting (`connector-utils.ts:176-185`)

```typescript
formatDaysSince('2025-12-20') → "3 days ago"
formatDaysSince('2025-12-15') → "1 week ago"
formatDaysSince('2025-11-20') → "1 month ago"
formatDaysSince('2024-12-20') → "1 year ago"
```

## Design System

### WSO2 Brand Colors

```typescript
// Light mode
background: '#f7f8fb'      // Light gray
cardBg: '#ffffff'          // White
textPrimary: '#000000'     // Black
textSecondary: '#494848'   // Dark gray

// Dark mode
background: '#000000'      // Pure black
cardBg: '#1a1a1a'         // Dark gray
textPrimary: '#ffffff'     // White
textSecondary: '#cccccc'   // Light gray

// Brand
primary: '#ff7300'         // WSO2 Orange
```

### Typography

**Font Family**: Plus Jakarta Sans
**Weights**: 300, 400, 500, 600, 700, 800

### Component Patterns

**Card Hover Effect**:
```typescript
'&:hover': {
  transform: 'translateY(-4px)',
  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
}
```

**Button Style**:
```typescript
{
  textTransform: 'none',
  borderRadius: '5px',
}
```

## Theme Management

### Context-based Theme System (`ThemeProvider.tsx`)

**Features**:
- System theme detection
- localStorage persistence
- Hydration mismatch prevention

**Implementation**:
```typescript
const [theme, setTheme] = useState<'light' | 'dark'>(() => {
  if (typeof window === 'undefined') return 'light';

  const saved = localStorage.getItem('theme');
  if (saved) return saved;

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
});
```

## Performance Optimizations

### 1. Lazy Image Loading
Uses `react-lazy-load-image-component` with blur effect for connector icons.

### 2. Memoization
All derived state (`filteredConnectors`, `paginatedConnectors`) uses `useMemo`.

### 3. Client-side Processing
All filtering, sorting, and pagination happen client-side (< 50ms) after initial load.

### 4. Progressive Enhancement
UI becomes interactive immediately with partial data, enriches in background.

### 5. GraphQL Batching
Enrichment queries batch 50 packages using GraphQL aliases:
```graphql
query {
  pkg0: package(orgName: "ballerinax", name: "aws.s3") { totalPullCount }
  pkg1: package(orgName: "ballerinax", name: "salesforce") { totalPullCount }
  ...
}
```

## Migration Context

### From Next.js to React (CRA)

**Completed Changes**:
- Removed Next.js specific APIs (`next/image`, `next/link`, `next/router`)
- Replaced with React equivalents (`react-router-dom`, `react-lazy-load-image`)
- Moved from `app/` directory to `pages/` + `components/`
- Converted server components to client components
- Added `config-overrides.js` for path aliases

**Current State**:
- All functionality preserved
- Type filtering disabled (shows all connectors)
- Type displayed as label on cards (not in filter sidebar)
- Performance maintained (< 2s load time)

### Key Requirement Changes

**Original**: Filter by Type (API, Database, Messaging)
**New**: Display Type as label only, show ALL connectors regardless of Type

**Rationale**: Users should see all packages, not just those tagged as "Type/connector"

## Component Details

### ConnectorCard (`ConnectorCard.tsx:1-159`)

**Layout**:
```
┌─────────────────────────────────┐
│  [Icon]  Name                   │
│          v1.0.0                 │
│                                 │
│  Description (markdown)         │
│                                 │
│  [Type] [Vendor] [Area]        │ ← Metadata chips
│                                 │
│  Downloads: 1.2M                │
│  Updated: 3 days ago            │
└─────────────────────────────────┘
```

**Features**:
- Lazy-loaded icon with fallback
- Markdown-rendered summary
- Clickable (opens Ballerina Central docs)
- Metadata chips (orange for Type, default for Vendor/Area)
- Responsive grid layout

### FilterSidebar (`FilterSidebar.tsx:1-116`)

**Layout**:
```
┌──────────────────┐
│ Filters      (2) │ ← Active filter count
│ [Clear All]      │
│                  │
│ ▼ Area           │
│   ☐ Finance      │
│   ☑ Health       │
│   ☐ Communication│
│                  │
│ ▼ Vendor         │
│   ☑ AWS          │
│   ☐ Salesforce   │
│   ☐ Google       │
└──────────────────┘
```

**Behavior**:
- Sticky positioning on desktop
- Collapsible sections (Accordion)
- Multi-select checkboxes
- Clear all button
- Active filter badge

### Pagination (`Pagination.tsx:1-169`)

**Layout**:
```
[Page Size: 24 ▼]        Showing 1-24 of 123

[<] [1] [2] [3] ... [10] [>]
```

**Smart Features**:
- Always show first and last page
- Show current page ± 1
- Use ellipsis for gaps
- Disable Previous/Next at boundaries
- Page size selector

## Development

### Scripts

```bash
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm test             # Run tests
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run format:check # Prettier check
```

### Path Aliases

`config-overrides.js` enables `@/*` imports:
```typescript
import { BallerinaPackage } from '@/types/connector';
import { fetchConnectors } from '@/lib/graphql-client';
```

### Environment

No environment variables required. GraphQL endpoint is hardcoded (public API).

## Code Patterns

### Component Structure

```typescript
// 1. Imports (external → internal)
import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { SomeType } from '@/types/connector';

// 2. Component definition
export default function ComponentName() {
  // 3. State
  const [state, setState] = useState();

  // 4. Derived state (memoized)
  const derived = useMemo(() => ..., [deps]);

  // 5. Effects
  useEffect(() => ..., [deps]);

  // 6. Event handlers
  const handleEvent = () => ...;

  // 7. Render
  return (...);
}
```

### Data Flow Pattern

```
User Action
    ↓
Event Handler (setState)
    ↓
State Update
    ↓
Memoized Derivation (useMemo)
    ↓
Component Re-render
    ↓
UI Update
```

### Error Handling

All async operations use try-catch with user-friendly error messages:
```typescript
try {
  const data = await fetchConnectors(...);
  setConnectors(data);
} catch (error) {
  setError('Failed to load connectors. Please try again later.');
  setLoading(false);
}
```

## Testing Strategy

**Not Currently Implemented**

Recommended approach:
- Unit tests: Utility functions (`connector-utils.ts`)
- Integration tests: Data loading flow
- Component tests: User interactions (search, filter, sort)
- E2E tests: Full user journeys

## Deployment

**Platform**: Netlify (recommended)

**Build Output**: `build/` directory

**Configuration** (`public/_redirects`):
```
/* /index.html 200
```

**Static Assets**:
- PWA manifest (`public/manifest.json`)
- Icons and logos (`public/images/`)
- Fonts (Google Fonts CDN)

## Known Issues & Limitations

1. **Pull Count Accuracy**: `totalPullCount` from GraphQL is often null, requiring separate enrichment query
2. **Static Data**: No real-time updates, requires page refresh to see new connectors
3. **Client-side Processing**: All 800+ connectors loaded in browser (acceptable for current scale)
4. **No Backend**: Pure frontend, no analytics or usage tracking

## Future Enhancement Opportunities

1. **Server-side Filtering/Sorting**: Move to GraphQL queries for better scalability
2. **Infinite Scroll**: Replace pagination with infinite scroll
3. **Connector Details Modal**: In-app preview without leaving to Ballerina Central
4. **Analytics**: Track popular searches, filters, connectors
5. **Favorites/Bookmarks**: User-saved connectors (requires backend)
6. **Version Selector**: Show all versions of a connector
7. **Dependency Graph**: Visualize connector dependencies
8. **Comparison View**: Side-by-side connector comparison

## Key Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/HomePage.tsx` | 348 | Main application page, orchestrates all features |
| `src/lib/connector-utils.ts` | 246 | Core business logic (filtering, sorting, formatting) |
| `src/components/ConnectorCard.tsx` | 159 | Individual connector display |
| `src/components/Pagination.tsx` | 169 | Smart pagination with ellipsis |
| `src/components/FilterSidebar.tsx` | 116 | Dynamic filter panel |
| `src/components/ThemeProvider.tsx` | 79 | Theme management context |

## Critical Technical Decisions

### Why React (CRA) over Next.js?
- Simpler deployment (static hosting)
- No need for SSR (data fetched client-side)
- Easier customization (no framework constraints)
- Better understood by team

### Why Client-side Filtering?
- Dataset size manageable (800 connectors)
- Instant response (< 50ms)
- Reduced API calls
- Better UX (no loading spinners on filter/sort)

### Why Progressive Loading?
- Perceived performance (UI visible < 1s)
- Actual performance maintained (background loading)
- Better UX than single long wait
- Prioritizes visible content (first 100)

### Why Material-UI?
- Comprehensive component library
- WSO2 design system compatibility
- Built-in theming support
- TypeScript support
- Active maintenance

## Summary

This is a well-architected, performance-optimized React application that provides a smooth user experience for browsing WSO2 Integrator connectors. The codebase follows React best practices, uses TypeScript for type safety, and implements progressive loading for optimal perceived performance. The recent migration from Next.js to CRA maintains all functionality while simplifying deployment and customization.

Key strengths:
- Clean component architecture
- Optimized data loading strategy
- Comprehensive filtering/sorting
- Professional WSO2 branding
- Responsive design
- Dark/light theme support

The application is production-ready and maintains the < 2 second load time target while handling 800+ connectors efficiently.
