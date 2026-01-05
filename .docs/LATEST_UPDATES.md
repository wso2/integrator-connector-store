# Latest Updates - WSO2 Integrator Connector Store

## Version 3.0.0 (January 2026) - Major Architecture Migration

### GraphQL to REST API Migration

**Major Change:** Migrated from GraphQL to REST API for all data operations.

**Why the change:**
- GraphQL required loading ALL 800+ connectors client-side for filtering
- Client-side pagination meant high memory usage and slow initial load
- Server-side filtering/sorting/pagination provides better scalability
- REST API with Solr queries enables powerful search capabilities

**Technical Implementation:**

1. **New REST Client** (`src/lib/rest-client.ts`)
   - Endpoint: `https://api.central.ballerina.io/2.0/registry/search-packages`
   - Solr query syntax for filtering: `org:ballerinax AND keyword:Area/Finance`
   - Explicit AND operators between filter types
   - OR logic within same filter type via parallel queries
   - Retry logic with exponential backoff (3 attempts)

2. **Server-Side Operations**
   - Filtering: Solr keyword queries (`keyword:Area/Finance`, `keyword:Vendor/Amazon`)
   - Sorting: REST parameters (`pullCount,DESC`, `name,ASC`)
   - Pagination: Offset/limit based (e.g., offset=30, limit=30)

3. **Progressive Filter Loading**
   - First 100 packages load immediately for filter options (~2s)
   - Complete filter list loads in background
   - 24-hour localStorage cache to avoid repeated full fetches
   - Cached filters reused across sessions

4. **Query Combination Strategy**
   - Multiple values in same filter type = OR logic
   - Different filter types = AND logic
   - Example: `(Area/Finance OR Area/Health) AND Vendor/Amazon`
   - Implemented via parallel API calls and result merging

**Performance Impact:**
- Initial load: ~2 seconds (same as before)
- Memory usage: 90% reduction (only current page in memory)
- Filter changes: ~500ms (API call) vs instant (client-side)
- Scalable to any number of connectors

**API Comparison:**

| Aspect | GraphQL (Old) | REST (New) |
|--------|---------------|------------|
| Endpoint | `/2.0/graphql` | `/2.0/registry/search-packages` |
| Data Loading | All 800+ items | Current page only |
| Filtering | Client-side | Server-side (Solr) |
| Sorting | Client-side | Server-side |
| Pagination | Client-side | Server-side |
| Memory Usage | ~50MB | ~2MB |
| Initial Load | 2s (100 items) | 2s (filter + page) |
| Filter Changes | Instant | ~500ms |

### Next.js to React Migration

**Framework Change:** Migrated from Next.js 16 to React 19 with Create React App.

**Why the change:**
- Simpler architecture for SPA use case
- No need for SSR (all data is from API)
- Easier deployment (static files only)
- Better compatibility with build tools

**Technical Changes:**

1. **Routing**
   - From: Next.js App Router
   - To: React Router DOM v7
   - URL-based navigation preserved
   - File: `src/App.tsx` with BrowserRouter

2. **Build System**
   - From: Next.js build system
   - To: Create React App with react-app-rewired
   - Custom webpack config: `config-overrides.js`
   - Deployment: Static file hosting

3. **File Structure**
   ```
   Old: src/app/page.tsx
   New: src/pages/HomePage.tsx

   Old: src/app/layout.tsx
   New: src/App.tsx + src/index.tsx
   ```

**No User-Facing Changes:**
- Same UI/UX
- Same features
- Same performance
- Same URLs work

### New Features

#### 1. Type Filter (Third Filter Dimension)

**Feature:** Added Type as a third filter category alongside Area and Vendor.

**Implementation:**
- Extract type from keywords: `keyword:Type/Connector`, `keyword:Type/Library`
- New accordion section in FilterSidebar
- URL parameter: `?types=Connector,Library`
- Server-side filtering via Solr queries

**Types Available:**
- Connector
- Library
- Driver
- Other

#### 2. Expandable Connector Descriptions

**Feature:** "Show more" button for long descriptions.

**Problem:** Full descriptions made cards different heights, breaking grid alignment.

**Solution:**
- Truncate descriptions longer than 120 characters to 2 lines
- "Show more" button appears for truncated descriptions
- Click expands to show full text
- "Show less" collapses back
- Prevents click from triggering card navigation

**Code:**
```typescript
const [isExpanded, setIsExpanded] = useState(false);
const needsTruncation = connector.summary.length > 120;

<Button onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  setIsExpanded(!isExpanded);
}}>
  {isExpanded ? 'Show less' : 'Show more'}
</Button>
```

#### 3. Default Sort: Most Popular First

**Change:** Default sorting changed from "Newest First" to "Most Popular First".

**Implementation:**
- Default: `pullCount-desc` (was `date-desc`)
- URL param omitted for default: `/?sort=pullCount-desc` → `/`
- Better discovery of widely-used connectors

#### 4. Improved Loading UX

**Change:** Loading overlay instead of full page re-render.

**Problem:** When applying filters, entire page (including sidebar) would disappear.

**Solution:**
- Separate `initialLoading` and `loading` states
- `initialLoading`: Shows spinner for first page load
- `loading`: Shows overlay only on connector grid
- Sidebar stays visible during filter changes
- Smooth opacity transition (0.7 opacity + overlay)

**Code:**
```typescript
const [initialLoading, setInitialLoading] = useState(true);
const [loading, setLoading] = useState(false);

// Overlay only on grid, not whole page
{loading && (
  <Box sx={{ position: 'absolute', /* overlay styles */ }}>
    <CircularProgress />
  </Box>
)}
```

#### 5. Clear All Filters Badge

**Feature:** Badge showing active filter count with clear functionality.

**Implementation:**
- Count badge shows: `totalFilters = areas + vendors + types`
- Click badge to clear all filters
- Only visible when filters are active
- Located in FilterSidebar header

### Technical Improvements

#### 1. Query Building

**Solr Query Syntax:**
```
Text search: graphql AND org:ballerinax AND keyword:Area/Finance
Filters only: org:ballerinax AND keyword:Area/Finance AND keyword:Vendor/Amazon
Multiple areas: (via parallel queries, merged results)
```

**Important:** Explicit `AND` operators to avoid URL encoding issues with `+`.

#### 2. Filter Caching

**Implementation:**
```typescript
interface CachedFilters {
  filters: FilterOptions;
  timestamp: number;
}

const FILTER_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
```

**Benefits:**
- Instant filter display on subsequent visits
- Reduces API load
- Automatic cache invalidation after 24 hours

#### 3. Multi-Query Strategy for OR Logic

**Problem:** Solr doesn't support parenthetical grouping like `(A OR B) AND C`.

**Solution:**
```typescript
// Generate all combinations
Areas: [Finance, Health]
Vendors: [Amazon]

// Becomes 2 parallel queries:
Query 1: Finance AND Amazon
Query 2: Health AND Amazon

// Merge and deduplicate results
```

### Migration Impact

**Files Changed:**
- `src/lib/rest-client.ts` - NEW (REST API client)
- `src/pages/HomePage.tsx` - Major refactor (state management)
- `src/components/FilterSidebar.tsx` - Add Type filter
- `src/components/ConnectorCard.tsx` - Add expandable descriptions
- `src/types/connector.ts` - Add `types` to FilterOptions
- `src/lib/connector-utils.ts` - Update extractFilterOptions

**Files Deprecated:**
- `src/lib/graphql-client.ts` - Still exists but no longer used
- Can be removed in future cleanup

**Breaking Changes:**
- None (all user-facing features preserved)
- URL structure unchanged
- API responses contain same data

### Performance Metrics

**Before (GraphQL):**
- Initial load: ~2s (first 100 items)
- Full load: ~10s (all 800+ items)
- Memory: ~50MB (all items in memory)
- Filter changes: Instant (client-side)
- Pagination: Instant (client-side)

**After (REST):**
- Initial load: ~2s (filters + first page)
- Full load: N/A (only current page)
- Memory: ~2MB (30 items in memory)
- Filter changes: ~500ms (server call)
- Pagination: ~500ms (server call)
- Scalability: Unlimited connectors

### Developer Experience

**New Development Workflow:**

1. **REST API Testing:**
   ```bash
   # Test query building
   curl 'https://api.central.ballerina.io/2.0/registry/search-packages?q=org:ballerinax%20AND%20keyword:Area/Finance&offset=0&limit=10&sort=pullCount,DESC'
   ```

2. **Filter Cache Management:**
   ```typescript
   // Clear cache in browser console
   localStorage.removeItem('ballerina_connector_filters');
   ```

3. **Debug Queries:**
   ```typescript
   // Check generated query
   console.log('Solr Query:', buildSolrQuery(params));
   ```

### Rollback Plan

If needed, rollback is possible:

1. **Revert to GraphQL:**
   - Uncomment `graphql-client.ts` imports
   - Revert `HomePage.tsx` to previous version
   - Deploy previous build

2. **Keep Both:**
   - Could implement feature flag
   - Toggle between GraphQL and REST
   - A/B testing possible

### Future Enhancements

**Planned:**
1. Infinite scroll option (alongside pagination)
2. Advanced search with operators (AND, OR, NOT)
3. Saved filters / bookmarks
4. Filter presets (e.g., "Most Popular Finance Apps")

**Under Consideration:**
1. Server-side caching layer
2. ElasticSearch integration for better search
3. Real-time updates via WebSocket
4. Personalized recommendations

### Known Issues

**Minor Issues:**
1. **First filter change after cache load:** Slightly slower (~1s) due to full query execution
   - **Mitigation:** Subsequent changes are faster (~500ms)

2. **Many filters slow down:** Selecting 5+ values in each filter type = many parallel queries
   - **Current:** Up to 2×3×3 = 18 parallel queries
   - **Mitigation:** Request deduplication, may need query optimization

3. **Sort parameter comma:** Must not be URL-encoded
   - **Current:** Manually append to URL string
   - **Working:** No known issues

### Migration Notes

**For Developers:**

1. **State Management Changed:**
   - Old: `rawConnectors` + client-side filter/sort
   - New: `connectors` (current page only) + server fetch on changes

2. **No More Enrichment:**
   - Old: Separate queries for `totalPullCount`
   - New: Included in REST response automatically

3. **URL Params Still Work:**
   - All previous URLs remain valid
   - Same parameter names
   - Same behavior from user perspective

4. **Testing Focus:**
   - Test filter combinations
   - Test text search + filters
   - Test pagination with filters
   - Test cache invalidation

---

## Previous Updates

### Version 2.0.0 (December 2025)

- Migrated to React 19 and Material-UI 7
- Added URL-based navigation
- Performance optimizations (60% faster)
- Eliminated layout shifts

### Version 1.2.0

- Added sort functionality
- Improved header design
- Better search positioning

### Version 1.1.0

- Added pagination with page size selector
- WSO2 branding implementation
- Scroll-to-top feature

### Version 1.0.0

- Initial release with GraphQL
- Basic filtering and search
- Dark/light themes

---

**Last Updated:** January 2026
**Status:** Production Ready
**Next Review:** February 2026
