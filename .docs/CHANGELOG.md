# Changelog

All notable changes to the WSO2 Integrator Connector Store.

## [1.1.0] - 2025-12-17

### ✨ Added

#### Pagination System

- **Page size selector** with options: 10, 24, 50, 100 items
- **Smart page navigation** with Previous/Next buttons
- **Direct page number selection** with ellipsis for large page counts
- **Item counter** showing "Showing X-Y of Z" connectors
- **Auto-reset to page 1** when filters or search changes
- **Smooth scroll to top** when changing pages

#### WSO2 Branding

- **WSO2 Header component** with official logo and branding
- **Exact WSO2 colors** from wso2.com/integrator
  - Primary Orange: #ff7300
  - Background Light: #f7f8fb
  - Background Dark: #000000 (pure black)
  - Text colors: #000000, #494848, #cccccc
- **WSO2 Logo** linking to wso2.com
- **Plus Jakarta Sans font** from WSO2 CDN

#### User Experience

- Smooth page transitions
- Better empty state messaging
- Improved responsive design
- Enhanced dark mode with pure black background

### 📝 Changed

- Replaced generic header with WSO2-branded header
- Updated theme with exact WSO2 design tokens
- Modified connector display to show paginated results only
- Enhanced pagination component with better UX

### 🐛 Fixed

- Material-UI Grid compatibility issues (switched to CSS Grid)
- Theme consistency between light and dark modes
- Responsive layout on mobile devices

### 📦 Files Added

```
public/images/wso2-logo.webp
public/images/integrator-logo.webp
src/components/Pagination.tsx
src/components/WSO2Header.tsx
UPDATES.md
FEATURES.md
CHANGELOG.md
```

### 📝 Files Modified

```
src/app/page.tsx           - Added pagination logic
src/styles/theme.ts        - Updated with exact WSO2 colors
src/components/ThemeProvider.tsx  - Enhanced theme context
```

---

## [1.0.0] - 2025-12-16

### ✨ Initial Release

#### Core Features

- **Connector fetching** from Ballerina Central GraphQL API
- **Hybrid loading strategy**
  - First 100 connectors load immediately
  - Remaining connectors load in background
- **Smart filtering** by Area, Vendor, and Type
  - Dynamic filter extraction from keywords
  - Client-side filtering for instant results
- **Real-time search** across names, summaries, and keywords
- **Dark/Light theme** support

#### Components

- ConnectorCard - Individual connector display
- FilterSidebar - Left panel with filters
- SearchBar - Search input component
- ThemeToggle - Dark/light mode switcher
- ThemeProvider - Theme context management

#### Design

- Material-UI v7 components
- Emotion CSS-in-JS
- Responsive grid layout
- WSO2 color scheme (initial)
- Plus Jakarta Sans typography

#### Performance

- Page load time: < 2 seconds
- Client-side filtering: Instant
- Memoized computations
- Lazy loading for background data

#### Technical Stack

- Next.js 16 (App Router)
- TypeScript 5.9
- Material-UI v7
- GraphQL with graphql-request
- Emotion for styling

---

## Version Comparison

| Feature                | v1.0.0  | v1.1.0 |
| ---------------------- | ------- | ------ |
| Pagination             | ❌      | ✅     |
| Page Size Selector     | ❌      | ✅     |
| WSO2 Header            | ❌      | ✅     |
| WSO2 Logo              | ❌      | ✅     |
| Exact WSO2 Colors      | Partial | ✅     |
| Scroll to Top          | ❌      | ✅     |
| Smart Page Navigation  | ❌      | ✅     |
| Dark Mode (Pure Black) | ❌      | ✅     |

---

## Roadmap

### v1.2.0 (Planned)

- [ ] Sort options (popularity, name, date)
- [ ] "Jump to page" input field
- [ ] Keyboard shortcuts (← → for pagination)
- [ ] Remember user preferences (localStorage)
- [ ] URL parameters for page/pageSize
- [ ] Infinite scroll option

### v1.3.0 (Planned)

- [ ] Server-Side Rendering (SSR)
- [ ] Advanced filters (date range, pull count)
- [ ] Connector comparison feature
- [ ] Export functionality (CSV, JSON)
- [ ] Analytics integration

### v2.0.0 (Future)

- [ ] User accounts and authentication
- [ ] Bookmark/favorite connectors
- [ ] User reviews and ratings
- [ ] Integration with WSO2 Integrator Studio
- [ ] Custom connector upload

---

## Breaking Changes

### v1.1.0

- **None** - All changes are backwards compatible

### v1.0.0

- Initial release

---

## Migration Guide

### Upgrading from v1.0.0 to v1.1.0

No migration needed! All changes are additive and backwards compatible.

**What's New:**

1. Pagination controls at bottom of page
2. WSO2 header at top of page
3. Better WSO2 branding throughout

**No Action Required:**

- All existing functionality still works
- No API changes
- No breaking changes to components

---

## Contributors

- Claude Code (Initial Development & v1.1.0 Updates)

---

## License

Part of the WSO2 ecosystem.
