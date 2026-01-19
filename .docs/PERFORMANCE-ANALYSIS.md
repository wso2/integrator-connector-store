# Performance Analysis & Optimization Report

**Date**: 2025-12-23
**Current Status**: Page loads in ~2s, but download counts take 10-12 seconds
**Target**: Reduce download count loading to < 3 seconds

---

##  Root Cause Analysis

### Critical Bottleneck: GraphQL Enrichment Process

**Location**: `src/lib/graphql-client.ts:105-147` and `src/pages/HomePage.tsx:94-119`

**The Problem**:
1. **16 Sequential GraphQL Requests**: To fetch pull counts for 800 connectors, the app makes 16 batched requests (800 ÷ 50 per batch)
2. **Two-Phase Sequential Enrichment**:
   - Phase 1: Enrich first 100 connectors (2 requests) → **WAIT**
   - Phase 2: Enrich remaining 700 connectors (14 requests)
3. **All-or-Nothing Approach**: Enriches ALL 800 connectors regardless of whether they're visible

**Current Flow**:
```
Load 100 connectors (1 request) → Show page
↓
Load 700 more connectors (7 parallel requests) → Update page
↓
Enrich first 100 (2 sequential batches of 50) → Update page ← 2-4 seconds
↓
Enrich remaining 700 (14 sequential batches of 50) → Update page ← 8-10 seconds
```

---

##  High-Impact Optimizations (Ranked by Impact)

### 1. ⚡ **ON-DEMAND ENRICHMENT** (Critical - 80% improvement)

**Impact**: Reduce from 10-12s to ~2-3s
**Effort**: Medium
**Priority**: **CRITICAL**

**Problem**: Currently enriching all 800 connectors. Only 30 are visible on first page.

**Solution**: Only enrich connectors that are actually displayed on the current page.

```typescript
// src/pages/HomePage.tsx - Modified approach
useEffect(() => {
  const loadConnectors = async () => {
    // ... load all connectors as before ...

    // NEW: Only enrich visible connectors
    const visibleConnectors = paginatedConnectors; // First 30 by default
    const visibleNames = new Set(visibleConnectors.map(c => c.name));
    const toEnrich = uniqueConnectors.filter(c => visibleNames.has(c.name));

    // Enrich only 30 items = 1 GraphQL request instead of 16!
    const enriched = await enrichPackagesWithPullCounts(toEnrich);

    // Update only the enriched ones
    const enrichedMap = new Map(enriched.map(c => [c.name, c]));
    setConnectors(uniqueConnectors.map(c => enrichedMap.get(c.name) || c));

    // Background: Enrich next page
    enrichNextBatch();
  };
}, []);

// Separate effect: Enrich when page changes
useEffect(() => {
  enrichVisibleConnectors(paginatedConnectors);
}, [currentPage, filteredConnectors]);
```

**Expected Result**:
- Initial load: 1-2 GraphQL requests (30-50 items) = **~2 seconds**
- Page navigation: 1 GraphQL request = **~1 second**

---

### 2. 🔄 **PARALLEL ENRICHMENT** (High - 40% improvement)

**Impact**: Reduce from 10-12s to ~6-7s
**Effort**: Low
**Priority**: **HIGH**

**Problem**: Lines 99 and 111 in `HomePage.tsx` run sequentially:
```typescript
// Current: SEQUENTIAL
const enrichedFirstBatch = await enrichPackagesWithPullCounts(firstBatchToEnrich);
setConnectors(partiallyEnriched);

const enrichedRemaining = await enrichPackagesWithPullCounts(remainingToEnrich);
setConnectors(fullyEnriched);
```

**Solution**: Run both enrichment phases in parallel:
```typescript
// src/pages/HomePage.tsx:94-119
// NEW: PARALLEL
const [enrichedFirstBatch, enrichedRemaining] = await Promise.all([
  enrichPackagesWithPullCounts(firstBatchToEnrich),
  enrichPackagesWithPullCounts(remainingToEnrich),
]);

// Single state update
const enrichedMap = new Map([
  ...enrichedFirstBatch.map(c => [c.name, c]),
  ...enrichedRemaining.map(c => [c.name, c]),
]);
const fullyEnriched = uniqueConnectors.map(c => enrichedMap.get(c.name) || c);
setConnectors(fullyEnriched);
```

**Expected Result**: ~40% faster enrichment (16 requests in parallel vs sequential)

---

### 3. 💾 **LOCALSTORAGE CACHING** (Medium - Eliminates repeat loads)

**Impact**: Instant load on subsequent visits
**Effort**: Medium
**Priority**: **MEDIUM**

**Problem**: Every page refresh = 16 GraphQL requests, even if data hasn't changed.

**Solution**: Cache pull counts with timestamp:
```typescript
// src/lib/cache.ts (NEW FILE)
const CACHE_KEY = 'connector-pull-counts';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

export function getCachedPullCounts(): Map<string, number> | null {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) return null;

  return new Map(Object.entries(data));
}

export function setCachedPullCounts(pullCounts: Map<string, number>) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data: Object.fromEntries(pullCounts),
    timestamp: Date.now(),
  }));
}
```

**Expected Result**: Repeat visits = instant load, no GraphQL requests for pull counts

---

### 4.  **MEMOIZE CONNECTOR CARD** (Low-Medium - Reduces re-renders)

**Impact**: Faster filtering/sorting/pagination
**Effort**: Low
**Priority**: **MEDIUM**

**Problem**: `ConnectorCard.tsx` re-renders unnecessarily and recalculates on every render:
- Line 19: `parseConnectorMetadata(connector.keywords)` - expensive
- Line 20: `getDisplayName(connector.name, metadata.vendor)` - expensive
- Line 31: `getFirstSentence(connector.summary)` - unnecessary
- No memoization

**Solution**:
```typescript
// src/components/ConnectorCard.tsx
import { memo, useMemo } from 'react';

export default memo(function ConnectorCard({ connector }: ConnectorCardProps) {
  const metadata = useMemo(
    () => parseConnectorMetadata(connector.keywords),
    [connector.keywords]
  );

  const displayName = useMemo(
    () => getDisplayName(connector.name, metadata.vendor),
    [connector.name, metadata.vendor]
  );

  const firstSentence = useMemo(
    () => getFirstSentence(connector.summary),
    [connector.summary]
  );

  // ... rest of component
});
```

**Expected Result**: 50% fewer re-renders when filtering/sorting

---

### 5. ✂ **REMOVE REACTMARKDOWN OVERHEAD** (Low - Minor improvement)

**Impact**: Faster initial render
**Effort**: Low
**Priority**: **LOW**

**Problem**: Using ReactMarkdown for simple text in 30 cards is overkill (lines 107-115 in ConnectorCard.tsx)

**Solution**: Use simple regex for common markdown:
```typescript
// Simple markdown parser for basic formatting
const renderSimpleMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
};

<Typography
  dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(firstSentence) }}
/>
```

**Expected Result**: Slightly faster card rendering

---

##  Advanced Optimizations (Long-term)

### 6. **API-Level Fix** (Best long-term solution)

**Contact Ballerina Central API team** to request accurate `totalPullCount` in the main `packages` query. This would eliminate the need for all 16 enrichment requests.

**Current**:
```graphql
query GetBallerinaxConnectors {
  packages(orgName: "ballerinax") {
    totalPullCount  # ← Returns null/0 (broken)
  }
}
```

**Requested**:
```graphql
query GetBallerinaxConnectors {
  packages(orgName: "ballerinax") {
    totalPullCount  # ← Should return aggregated count
  }
}
```

**Impact**: Eliminate 10-12 seconds entirely 

---

### 7. **Increase Batch Size** (If API allows)

Current: 50 packages per request
Test: 100 or 200 packages per request

**Risk**: May hit GraphQL query size limits

---

### 8. **Virtual Scrolling** (Replace pagination)

Use `react-window` or `react-virtualized` to only render visible cards.

**Benefit**: Better UX + only enrich visible items

---

### 9. **Web Worker for Data Processing**

Move filtering/sorting/parsing to Web Worker to avoid blocking main thread.

---

## 📊 Recommended Implementation Plan

### Phase 1: Quick Wins (1-2 hours)
1.  **Parallel enrichment** (Optimization #2) - Easy, 40% improvement
2.  **Memoize ConnectorCard** (Optimization #4) - Easy, better perceived performance
3.  **Remove ReactMarkdown** (Optimization #5) - Easy, minor improvement

**Expected Result**: 6-7 second load time (down from 10-12s)

---

### Phase 2: Critical Fix (2-4 hours)
4.  **On-demand enrichment** (Optimization #1) - Medium effort, 80% improvement

**Expected Result**: 2-3 second load time  **TARGET MET**

---

### Phase 3: Polish (1-2 hours)
5.  **LocalStorage caching** (Optimization #3) - Medium effort, instant repeat loads

**Expected Result**: Instant loads on subsequent visits

---

### Phase 4: Long-term (Optional)
6. 📧 **Contact API team** for server-side fix
7. 🔬 **Test larger batch sizes**
8.  **Consider virtual scrolling**

---

##  Other Issues Found

### Minor Performance Issues:

1. **Redundant state updates** (`HomePage.tsx:107, 118`): Two `setConnectors` calls cause double re-render
2. **Missing dependency in useMemo** (`HomePage.tsx:140`): Should include `filteredConnectors`
3. **Unnecessary scroll on filter change** (`HomePage.tsx:167`): Should only scroll on page change
4. **Large initial batch** (100 connectors): Could reduce to 50 for faster first paint

### Code Quality Issues:

1. **No error handling in enrichment**: Silent failures in `fetchBatchedPullCounts:96`
2. **No loading states**: Users don't know enrichment is happening
3. **No retry logic**: Network failures = permanent missing data

---

## 📈 Performance Metrics

### Current:
- Initial page render: ~2s 
- Download counts load: **10-12s** 
- Total interactive: **12-14s**

### After Phase 1 (Parallel + Memoization):
- Initial page render: ~2s 
- Download counts load: **6-7s** 🟡
- Total interactive: **8-9s**

### After Phase 2 (On-demand enrichment):
- Initial page render: ~2s 
- Download counts load: **2-3s**  **TARGET**
- Total interactive: **4-5s**

### After Phase 3 (Caching):
- Repeat visits: **< 1s** 

---

##  Implementation Files to Modify

1. **src/pages/HomePage.tsx** (Lines 94-119) - Enrichment logic
2. **src/lib/graphql-client.ts** (Lines 105-147) - Batching strategy
3. **src/components/ConnectorCard.tsx** (Lines 18-31) - Memoization
4. **src/lib/cache.ts** (NEW) - Caching utilities

---

##  Success Criteria

- [ ] Download counts load in < 3 seconds on first visit
- [ ] Page navigation shows pull counts in < 1 second
- [ ] Repeat visits load instantly (cached)
- [ ] No regression in existing functionality
- [ ] Maintain current UX (progressive loading)

---

##  Summary

The 10-12 second delay is caused by **16 sequential GraphQL requests** to fetch pull counts for all 800 connectors. The most impactful fix is **on-demand enrichment** (only enrich visible items), which will reduce this to 2-3 seconds. Combined with parallel processing and caching, we can achieve sub-second performance on repeat visits.

**Recommended first step**: Implement Phase 1 (parallel enrichment + memoization) for immediate 40% improvement, then Phase 2 (on-demand enrichment) for the full solution.
