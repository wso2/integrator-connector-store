# URL-Based Routing Guide

## Overview

The WSO2 Connector Store now supports **URL-based routing** for all user interactions. This means every filter, search, sort, and page navigation is reflected in the URL, making the application fully bookmarkable and shareable.

## URL Structure

### Base URL
```
https://your-domain.com/
```

### With Parameters
```
https://your-domain.com/?page=3&size=50&search=salesforce&areas=Finance,CRM&vendors=Salesforce&sort=name-asc
```

## Query Parameters

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `page` | number | 1 | Current page number | `page=3` |
| `size` | number | 30 | Items per page | `size=50` |
| `search` | string | - | Search query | `search=salesforce` |
| `areas` | string (comma-separated) | - | Selected area filters | `areas=Finance,Health` |
| `vendors` | string (comma-separated) | - | Selected vendor filters | `vendors=AWS,Google` |
| `sort` | string | pullCount-desc | Sort option | `sort=name-asc` |

## Sort Options

| Value | Display Name |
|-------|--------------|
| `name-asc` | Name (A-Z) |
| `name-desc` | Name (Z-A) |
| `pullCount-desc` | Most Popular *(default)* |
| `pullCount-asc` | Least Popular |
| `date-desc` | Newest First |
| `date-asc` | Oldest First |

## URL Examples

### Example 1: Default View
```
https://connector-store.com/
```
- Page 1
- 30 items per page
- No search
- No filters
- Sorted by popularity

### Example 2: Filtered View
```
https://connector-store.com/?areas=Finance,CRM&vendors=Salesforce
```
- Shows Finance and CRM connectors
- From Salesforce vendor
- Page 1 (default)
- 30 items per page (default)

### Example 3: Search Results - Page 3
```
https://connector-store.com/?search=database&page=3
```
- Searching for "database"
- Viewing page 3 of results
- 30 items per page (default)

### Example 4: Complete Custom View
```
https://connector-store.com/?page=2&size=50&search=api&areas=Communication&vendors=Twilio,SendGrid&sort=name-asc
```
- Page 2
- 50 items per page
- Searching for "api"
- Communication area
- Twilio and SendGrid vendors
- Sorted alphabetically

### Example 5: Custom Page Size
```
https://connector-store.com/?size=100
```
- Page 1
- 100 items per page
- Shows more connectors at once

## Key Features

###  Bookmarkable
Users can bookmark any page with their specific filters and return to it later.

**Example:**
```
Bookmark: https://connector-store.com/?areas=Finance&vendors=Stripe,PayPal&sort=pullCount-desc
```
Opening this bookmark shows Finance connectors from Stripe/PayPal, sorted by popularity.

###  Shareable
Users can share links with colleagues to show specific connectors or results.

**Example:**
```
Email: "Check out these AWS connectors: https://connector-store.com/?vendors=AWS&page=1"
```

###  Browser Back/Forward
Browser navigation buttons work as expected:
- Back button: Returns to previous filter/page state
- Forward button: Goes to next state
- Full history preserved

###  Direct Access
Users can manually craft URLs to jump to specific views:

```
https://connector-store.com/?page=5&size=10
```
Goes directly to page 5 with 10 items per page.

###  Clean URLs
The implementation keeps URLs clean by only adding non-default parameters:

**Default view:**
```
https://connector-store.com/
```
*(No parameters needed)*

**Page 1:**
```
https://connector-store.com/
```
*(page=1 not shown since it's default)*

**Page 3:**
```
https://connector-store.com/?page=3
```
*(Only page parameter added)*

## Implementation Details

### State Initialization
When the page loads, state is initialized from URL parameters:

```typescript
const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
```

### URL Synchronization
Any state change automatically updates the URL:

```typescript
useEffect(() => {
  const params = new URLSearchParams();

  if (currentPage > 1) params.set('page', currentPage.toString());
  if (pageSize !== 30) params.set('size', pageSize.toString());
  if (searchQuery) params.set('search', searchQuery);
  // ... more params

  setSearchParams(params, { replace: true });
}, [currentPage, pageSize, searchQuery, ...]);
```

### Replace vs Push
The implementation uses `replace: true` to avoid cluttering browser history with every keystroke. This means:
- Filter changes replace the current history entry
- Users can still use back/forward for major navigation
- Browser history remains clean and useful

## Use Cases

### 1. Support & Bug Reports
Users can share exact URL showing the issue:
```
"I'm seeing an error on this page: https://connector-store.com/?page=10&vendors=AWS"
```

### 2. Documentation
Documentation can link to specific filtered views:
```
"For Finance connectors, visit: https://connector-store.com/?areas=Finance"
```

### 3. Presentations
Presenters can bookmark specific views for demos:
```
Slide 1: https://connector-store.com/?areas=Communication
Slide 2: https://connector-store.com/?vendors=Twilio&page=1
```

### 4. Onboarding
New users can be sent direct links to relevant connectors:
```
"Check out our AWS integrations: https://connector-store.com/?vendors=AWS&sort=pullCount-desc"
```

## SEO Benefits

While the connector store is a single-page app, URL routing provides SEO benefits:

1. **Crawlable URLs**: Search engines can discover different views
2. **Meaningful URLs**: URLs describe the content (useful for search results)
3. **Link Sharing**: Social media previews can show specific filtered views

## Technical Notes

### Router Setup
Uses `react-router-dom` v6 with `BrowserRouter`:

```typescript
<BrowserRouter>
  <Routes>
    <Route path="/" element={<HomePage />} />
  </Routes>
</BrowserRouter>
```

### URL Parameter Parsing
Uses `useSearchParams` hook from react-router-dom:

```typescript
const [searchParams, setSearchParams] = useSearchParams();
```

### Validation
- Invalid page numbers default to 1
- Invalid page sizes default to 30
- Invalid sort options default to 'pullCount-desc'
- Malformed arrays (areas, vendors) are filtered and cleaned

## Migration Notes

### Before (No URL Routing)
```
URL: https://connector-store.com/
State: Page 3, Finance filter, 50 items per page
Refresh:  Returns to page 1, loses filters
```

### After (With URL Routing)
```
URL: https://connector-store.com/?page=3&areas=Finance&size=50
State: Page 3, Finance filter, 50 items per page
Refresh:  Stays on page 3 with Finance filter and 50 items
```

## Best Practices

### For Users
1. **Bookmark frequently used views** (e.g., your favorite vendor filters)
2. **Share specific pages** with team members
3. **Use browser back/forward** for navigation
4. **Copy URLs** when reporting issues

### For Developers
1. **Always validate URL parameters** before using
2. **Provide sensible defaults** for missing parameters
3. **Keep URLs clean** by omitting default values
4. **Use replace: true** for frequent updates to avoid history pollution

## Future Enhancements

Potential improvements:
- URL shortening for complex filter combinations
- Share button to copy current URL to clipboard
- "Reset filters" button that clears URL parameters
- URL-based deep linking to specific connectors

## Summary

URL-based routing transforms the connector store from a stateful app into a fully linkable, shareable, and bookmarkable platform. Every interaction is captured in the URL, making it:

-  More professional
-  More user-friendly
-  Better for collaboration
-  Easier to support
-  More accessible

Users can now share exactly what they're seeing with a simple link!
