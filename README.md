# WSO2 Integrator Connector Store

A modern, high-performance connector store for WSO2 Integrator, showcasing 800+ Ballerina connectors from Ballerina Central with accurate download metrics and powerful filtering capabilities.

[![React](https://img.shields.io/badge/React-19.2-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/MUI-7.3-007FFF)](https://mui.com/)
[![License](https://img.shields.io/badge/License-WSO2-orange)](https://wso2.com/)

## Overview

The WSO2 Integrator Connector Store provides a user-friendly interface to discover, search, filter, and explore Ballerina connectors from Ballerina Central. Built with React and Material-UI, it offers a fast, responsive experience with professional WSO2 branding.

**Live Demo:** [Your deployment URL here]

---

## Features

### Professional WSO2 Branding

- Official WSO2 header with logo
- Exact color scheme from wso2.com/integrator
- Plus Jakarta Sans font family
- Dark/Light theme support with pure black dark mode
- Sticky header for better navigation

### Smart Pagination

- Customizable page size: 10, 30, 50, or 100 items per page
- Default: 30 connectors per page
- Smart page navigation with ellipsis
- Auto-reset to page 1 on filter/search changes
- Smooth scroll to top on page transitions
- "Showing X-Y of Z" item counter
- URL-based navigation (bookmarkable, shareable links)

### Advanced Search & Filtering

- **Real-time Search**: Instant search across names, summaries, and keywords
- **Dynamic Filters**:
  - Area (Finance, Communication, Health, etc.)
  - Vendor (AWS, Salesforce, Google, etc.)
- Combined search + filter functionality
- Active filter count badges
- One-click clear all filters
- Filter state preserved in URL

### Powerful Sorting

- **Newest First** - Recently created connectors (default)
- **Oldest First** - Oldest connectors
- **Name (A-Z)** - Alphabetical ascending
- **Name (Z-A)** - Alphabetical descending
- **Most Popular** - Highest downloads first
- **Least Popular** - Lowest downloads first
- All sorting works with filters and search
- Sort preference preserved in URL

### Optimized Performance

- **Fast Initial Load**: ~2 seconds to first render
- **Zero Layout Shift**: Stable page load with no jumps
- **Smart Loading Strategy**:
  - First batch (100 connectors) loads immediately
  - Remaining batches load in parallel (background)
  - Visible items enriched with download counts first
  - Background enrichment continues silently
- **Accurate Download Counts**: Aggregated totals across all versions
- **Retry Logic**: Automatic retries with exponential backoff for network resilience
- **Graceful Degradation**: Works with partial data if some requests fail
- **Client-side Operations**: Instant filtering, sorting, and pagination
- **Optimized Rendering**: Only current page items rendered
- **Memoized Components**: Efficient re-renders

### Responsive Design

- Mobile-first approach
- Adaptive grid: 1-3 columns based on screen width
- Touch-friendly interface
- Optimized for all devices

---

## Quick Start

### Prerequisites

- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher (or yarn/pnpm)
- **Git**: For version control

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd wso2-integrator-connector-store

# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Available Scripts

### Development

```bash
npm start
# or
npm run dev
```

Starts the development server on `http://localhost:3000` with hot-reload.

### Production Build

```bash
npm run build
```

Creates an optimized production build in the `build/` folder.

### Production Server

```bash
# After building
npx serve -s build
```

Serves the production build locally on port 3000.

### Type Checking

```bash
npx tsc --noEmit
```

Runs TypeScript type checking without emitting files.

### Linting

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

Runs ESLint checks on the codebase.

### Formatting

```bash
npm run format        # Format all files
npm run format:check  # Check formatting
```

Runs Prettier formatting.

---

## Project Structure

```
wso2-integrator-connector-store/
├── public/
│   ├── index.html                   # HTML entry point
│   ├── manifest.json                # PWA manifest
│   ├── _redirects                   # SPA routing config (Netlify/Vercel)
│   └── images/
│       ├── wso2-logo.svg            # WSO2 official logo
│       └── wso2-integrator-correct.svg  # Integrator icon
├── src/
│   ├── index.tsx                    # React entry point
│   ├── App.tsx                      # Root component with router
│   ├── pages/
│   │   └── HomePage.tsx             # Main connector store page
│   ├── components/
│   │   ├── ConnectorCard.tsx        # Individual connector card
│   │   ├── FilterSidebar.tsx        # Filter panel (Area/Vendor)
│   │   ├── Pagination.tsx           # Pagination controls
│   │   ├── SearchBar.tsx            # Search input
│   │   ├── SortSelector.tsx         # Sort dropdown
│   │   ├── ThemeProvider.tsx        # Theme context provider
│   │   ├── ThemeToggle.tsx          # Dark/light mode toggle
│   │   └── WSO2Header.tsx           # Branded header component
│   ├── lib/
│   │   ├── graphql-client.ts        # GraphQL API integration with retry logic
│   │   └── connector-utils.ts       # Utility functions (filter/sort)
│   ├── styles/
│   │   └── globals.css              # Global styles
│   └── types/
│       └── connector.ts             # TypeScript type definitions
├── .docs/                           # Comprehensive documentation
│   ├── AI-README.md                 # AI-focused implementation guide
│   ├── FINAL-SOLUTION.md            # Performance optimization details
│   ├── TESTING-GUIDE.md             # Testing instructions
│   ├── URL-ROUTING.md               # URL structure documentation
│   └── VERCEL-BUILD-WARNINGS.md     # Build warnings explained
├── .gitignore
├── .npmrc                           # npm configuration (legacy-peer-deps)
├── config-overrides.js              # Webpack customization
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── vercel.json                      # Vercel deployment config
└── README.md                        # This file
```

---

## Configuration

### Environment Variables

No environment variables required. The application uses public Ballerina Central APIs.

### npm Configuration

**File:** `.npmrc`

```
legacy-peer-deps=true
```

Required to resolve TypeScript 5.x peer dependency conflicts with react-scripts 5.0.1.

### Webpack Configuration

**File:** `config-overrides.js`

Custom webpack configuration for Create React App (using react-app-rewired).

### Deployment Configuration

**File:** `vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Enables client-side routing for single-page application.

### Theme Customization

**File:** `src/components/ThemeProvider.tsx`

WSO2 Brand Colors:

- Primary Orange: `#ff7300`
- Background Light: `#f7f8fb`
- Background Dark: `#000000` (pure black)
- Text Primary: `#000000` / `#ffffff`
- Text Secondary: `#494848` / `#cccccc`

Font: **Plus Jakarta Sans** (loaded from WSO2 CDN)

---

## API Integration

### Ballerina Central GraphQL API

**Endpoint:** `https://api.central.ballerina.io/2.0/graphql`

**Query:**

```graphql
query GetBallerinaxConnectors($orgName: String!, $limit: Int!, $offset: Int!) {
  packages(orgName: $orgName, limit: $limit, offset: $offset, sort: DATE_DESC) {
    packages {
      name
      version
      URL
      summary
      keywords
      icon
      createdDate
      totalPullCount
    }
  }
}
```

**Key Features:**
- Primary data source for connector information
- `totalPullCount` provides aggregated downloads across all versions
- `sort: DATE_DESC` returns newest connectors first
- Pagination support via `limit` and `offset`

### Retry Logic

All API requests include automatic retry with exponential backoff:
- **Main queries**: 3 retry attempts (1s, 2s, 4s delays)
- **Enrichment queries**: 2 retry attempts (1s, 2s delays)
- **Graceful degradation**: Continues with partial data if some requests fail

See `.docs/FINAL-SOLUTION.md` for implementation details.

---

## Data Flow

```
User Visits Page
      ↓
┌─────────────────────────────────────┐
│ 1. Fast Initial Load (0-2s)        │
│    - Fetch first 100 connectors     │
│    - Sort by date (newest first)    │
│    - Display page immediately       │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│ 2. Background Load (2-4s)           │
│    - Fetch remaining ~700 in parallel│
│    - Update state progressively     │
│    - All data ready to use          │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│ 3. Enrich Visible Items (4-5s)     │
│    - Enrich first 30 visible items  │
│    - Show download counts           │
│    - Zero layout shift              │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│ 4. Background Enrichment (5s+)     │
│    - Enrich remaining items silently│
│    - Update counts as they arrive   │
│    - Graceful failure if errors     │
└─────────────────────────────────────┘
```

---

## Performance Metrics

### Load Times (Optimized)

- **Page visible**: ~2 seconds
- **Download counts**: ~5 seconds
- **Total interactive**: ~5 seconds
- **Zero layout shift**: CLS = 0
- **Most Popular sort**: 1-2s (when first selected)

### Network Efficiency

- **Initial requests**: 1 (first batch)
- **Background requests**: ~8 (batches of 100)
- **Enrichment requests**: 2-3 (batches of 50)
- **Total**: ~10 requests (down from 24)
- **Reduction**: 58% fewer requests

### Reliability Improvements

- **Retry logic**: 3 attempts per request
- **Exponential backoff**: 1s, 2s, 4s delays
- **Graceful degradation**: Works with partial data
- **Error recovery**: 95%+ success rate even with network issues

### Client Performance

- **Page changes**: Instant (<50ms)
- **Filter changes**: Instant (<50ms)
- **Sort changes**: Instant (<50ms, except first "Most Popular")
- **Search**: Real-time (<50ms)

### Bundle Size

- **First Load JS**: ~350KB (includes React 19, MUI, GraphQL)
- **CSS**: ~50KB
- **Total**: <400KB
- **Lazy loading**: Connector images load on demand

See `.docs/FINAL-SOLUTION.md` for detailed performance analysis.

---

## Deployment

### Vercel (Recommended)

**Framework Preset:** Create React App

**Configuration:**

1. Connect your Git repository to Vercel
2. Set Framework Preset to "Create React App"
3. Deploy

**Files required:**
- `.npmrc` - Resolves TypeScript peer dependency conflicts
- `vercel.json` - Enables client-side routing

**Build Command:** `npm run build`
**Output Directory:** `build`

### Netlify

**Build Settings:**

- **Build Command:** `npm run build`
- **Publish Directory:** `build`
- **Redirects:** Configured in `public/_redirects`

### Docker

**Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**

```nginx
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
  }
}
```

**Build and Run:**

```bash
docker build -t wso2-connector-store .
docker run -p 80:80 wso2-connector-store
```

### Static Hosting

The app is a static SPA and can be hosted on any static hosting service:

- AWS S3 + CloudFront
- Azure Static Web Apps
- GitHub Pages (with routing config)
- Google Cloud Storage

**Important:** Configure the host to redirect all routes to `index.html` for client-side routing.

---

## URL Structure

The application uses URL-based navigation for bookmarkable, shareable links.

**Base URL:**
```
https://your-domain.com/
```

**Query Parameters:**

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `page` | 1, 2, 3... | 1 | Current page number |
| `size` | 10, 30, 50, 100 | 30 | Items per page |
| `search` | string | - | Search query |
| `areas` | comma-separated | - | Selected area filters |
| `vendors` | comma-separated | - | Selected vendor filters |
| `sort` | date-desc, date-asc, name-asc, name-desc, pullCount-desc, pullCount-asc | date-desc | Sort option |

**Example URLs:**

```
# Page 2, default settings
/?page=2

# Search for "salesforce"
/?search=salesforce

# Filter by Finance area
/?areas=Finance

# Multiple filters
/?areas=Finance,Health&vendors=AWS,Salesforce

# Most popular, page size 50
/?sort=pullCount-desc&size=50

# Complete example
/?page=2&size=50&search=api&areas=Finance&vendors=AWS&sort=pullCount-desc
```

See `.docs/URL-ROUTING.md` for complete documentation.

---

## Development

### Adding New Features

1. **New Component**: Add to `src/components/`
2. **New Utility**: Add to `src/lib/`
3. **New Type**: Add to `src/types/`
4. **New Page**: Add to `src/pages/` and update router in `App.tsx`

### Code Style

- TypeScript strict mode enabled
- Functional components with hooks
- CSS-in-JS with Material-UI `sx` prop
- Descriptive variable names
- ESLint + Prettier for consistent formatting

### Best Practices

- Always use TypeScript types
- Memoize expensive computations (`useMemo`, `memo`)
- Use refs for non-rendering state
- Keep components focused and small
- Use semantic HTML
- Ensure accessibility (ARIA labels, keyboard navigation)
- Avoid unnecessary re-renders

### Performance Considerations

- Separate data loading from UI updates
- Use `useRef` for tracking state that doesn't need re-renders
- Implement smart loading strategies (visible items first)
- Add retry logic for network operations
- Handle partial failures gracefully

---

## Testing

### Manual Testing Checklist

#### Functionality

- [ ] Connectors load correctly (~2s)
- [ ] Download counts appear (~5s)
- [ ] Search works across all fields
- [ ] All filters work (Area, Vendor)
- [ ] Sorting changes order correctly
- [ ] Pagination navigates properly
- [ ] Page size changes work
- [ ] Card links open Ballerina Central
- [ ] URL parameters update correctly
- [ ] Bookmarked URLs restore state

#### UI/UX

- [ ] Header displays correctly
- [ ] Dark/light mode toggle works
- [ ] Responsive on mobile/tablet/desktop
- [ ] Smooth scrolling on page change
- [ ] Loading states show properly
- [ ] Empty states display correctly
- [ ] No layout shifts during load

#### Performance

- [ ] Page loads in ~2 seconds
- [ ] Download counts appear in ~5 seconds
- [ ] Zero layout shift (CLS = 0)
- [ ] Filters/sort are instant
- [ ] No console errors
- [ ] Works on slow network (Slow 3G)
- [ ] Handles offline gracefully

#### Error Handling

- [ ] Displays error message on complete failure
- [ ] Retries failed requests automatically
- [ ] Works with partial data if some requests fail
- [ ] Background enrichment fails silently

See `.docs/TESTING-GUIDE.md` for detailed testing instructions.

---

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf build node_modules package-lock.json
npm install
npm run build
```

### TypeScript Peer Dependency Error

If you see TypeScript version conflicts during deployment:

```bash
# Ensure .npmrc exists with:
legacy-peer-deps=true
```

See `.docs/VERCEL-BUILD-WARNINGS.md` for detailed explanation.

### API Errors

**GraphQL API Issues:**

- Check: https://api.central.ballerina.io/2.0/graphql
- Verify query syntax
- Check network tab for errors
- Look for retry attempts in console

**Network Failures:**

- Application automatically retries failed requests (3 attempts)
- Check console for "retry attempt" messages
- Verify internet connection

### Image Loading Issues

**Connector icons not loading:**

- Check that icons exist at `https://bcentral-packageicons.azureedge.net/`
- Check network tab for blocked requests
- Verify CORS policy

### Performance Issues

```bash
# Analyze bundle size
npm run build
ls -lh build/static/js/

# Check for large dependencies
npx source-map-explorer build/static/js/*.js

# Profile in Chrome DevTools
# Performance tab → Record → Analyze
```

### Common Issues

**"Failed to load connectors" error:**
- Network issue or API temporarily down
- Application will automatically retry 3 times
- Check console for detailed error messages

**Layout shifts during load:**
- Verify default sort is "Newest First"
- Check that API returns items in date-desc order
- Review console for unexpected state updates

**"Most Popular" sort slow:**
- First time: Needs to enrich 100 items (~2s)
- Subsequent times: Should be instant (cached)
- Check network tab for enrichment requests

---

## Documentation

### Key Documents

- **`.docs/AI-README.md`** - Comprehensive implementation guide for AI assistants
- **`.docs/FINAL-SOLUTION.md`** - Performance optimization details and trade-offs
- **`.docs/TESTING-GUIDE.md`** - Detailed testing procedures and checklist
- **`.docs/URL-ROUTING.md`** - URL structure and parameter documentation
- **`.docs/VERCEL-BUILD-WARNINGS.md`** - Build warning explanations and fixes

### Architecture Overview

The application uses a 4-phase loading strategy:

1. **Fast Initial Load** (0-2s) - First 100 connectors
2. **Background Load** (2-4s) - Remaining connectors in parallel
3. **Visible Enrichment** (4-5s) - Download counts for first 30 items
4. **Background Enrichment** (5s+) - Download counts for remaining items

This approach provides:
- Fast time-to-interactive (~2s)
- Zero layout shift (CLS = 0)
- Complete data within ~5s
- Graceful degradation on errors

---

## Changelog

### Version 2.0.0 (Latest - 2025-12-23)

**Major Performance Overhaul:**
- Reduced stable load time by 60% (14s → 6s)
- Eliminated layout shifts (CLS: 3 → 0)
- Added retry logic with exponential backoff
- Implemented graceful degradation for partial failures
- Reduced GraphQL requests by 58% (24 → 10)
- Added URL-based navigation with shareable links
- Migrated to React 19 and Material-UI 7

**Bug Fixes:**
- Fixed re-render loops on sort change
- Fixed TypeScript peer dependency conflicts
- Resolved Vercel deployment issues

### Version 1.2.1

- Fixed header to show "WSO2 Integrator Connector Store"
- Fixed card links to point to Ballerina Central package pages
- Implemented efficient total pull count aggregation

### Version 1.2.0

- Added sort functionality (6 options)
- Improved header design (sticky, better dark mode)
- Made search bar smaller and better positioned

### Version 1.1.0

- Added pagination with page size selector
- Added WSO2 branding (exact colors, fonts, logo)
- Created WSO2 header component
- Added scroll-to-top on pagination

### Version 1.0.0

- Initial release with basic functionality
- GraphQL integration
- Filtering by Area, Vendor
- Real-time search
- Dark/light themes

---

## Contributing

This is a WSO2 internal project. For contributions:

1. Create a feature branch
2. Make your changes
3. Test thoroughly (see `.docs/TESTING-GUIDE.md`)
4. Ensure no TypeScript errors (`npx tsc --noEmit`)
5. Format code (`npm run format`)
6. Lint code (`npm run lint`)
7. Submit a pull request

---

## License

Part of the WSO2 ecosystem. Copyright (c) WSO2 Inc.

---

## Related Links

- [WSO2 Integrator](https://wso2.com/integrator/)
- [Ballerina Central](https://central.ballerina.io/)
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [Create React App Documentation](https://create-react-app.dev/)

---

## Support

For issues, questions, or feature requests:

1. Review documentation in `.docs/` directory
2. Check troubleshooting section above
3. Review console for error messages
4. Contact WSO2 development team

---

**Built by the WSO2 Team**

Powered by React, TypeScript, Material-UI, and GraphQL
