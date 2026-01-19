# Quick Start Guide

## Get Started in 3 Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Open Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## What You'll See

-  **Search Bar**: Search across all connector names and descriptions
- 📊 **Filters**: Left sidebar with Area, Vendor, and Type filters
- 🎴 **Connector Cards**: Grid of connector cards with icons and metadata
- 🌓 **Theme Toggle**: Switch between dark and light modes (top right)
- ⚡ **Fast Loading**: First 100 connectors load in < 2 seconds

## Try These Features

1. **Search**: Type "salesforce" or "aws" in the search bar
2. **Filter**: Select "Finance" under Area or "API" under Type
3. **Theme**: Click the moon/sun icon to toggle dark/light mode
4. **Click Card**: Click any connector card to view documentation

## Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/page.tsx        # Main connector store page
├── components/         # React components
├── lib/                # API clients and utilities
├── styles/             # Theme configuration
└── types/              # TypeScript definitions
```

## Key Features

| Feature              | Description                                |
| -------------------- | ------------------------------------------ |
| **Hybrid Loading**   | First batch loads fast, rest in background |
| **Client Filtering** | Instant filter/search results              |
| **WSO2 Design**      | Matches WSO2 Integrator branding           |
| **Responsive**       | Works on mobile, tablet, and desktop       |
| **Dark Mode**        | Full theme support                         |

## Need Help?

- 📖 **Full Documentation**: See [README.md](README.md)
-  **Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- 📊 **Project Summary**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

## Common Issues

### Port 3000 Already in Use?

```bash
# Use a different port
PORT=3001 npm run dev
```

### Build Errors?

```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## Next Steps

1.  Explore the application locally
2.  Customize theme in `src/styles/theme.ts`
3.  Add more features as needed
4.  Deploy to production

---

**Questions?** Check the full [README.md](README.md) or [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
