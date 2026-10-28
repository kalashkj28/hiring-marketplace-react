# Hiring Marketplace Analytics - React + TypeScript Dashboard

A high-performance, modern React + TypeScript reproduction of the Hiring Marketplace Analytics dashboard.

- **Framework**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Data Source**: Fetches directly from Google Sheets CSV (`PapaParse`) with client-side in-memory filtering (< 20ms across 29,000+ rows).

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run the development server
```bash
npm run dev
```

The app will start at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```

---

## Features
- **Live Google Sheet Sync**: Reads live data with real-time recalculations.
- **Identical 3 Tabs**:
  1. **Overview**: 6 headline KPIs, funnel stage progression, weekly views/applications trend, conversion rate stability line chart.
  2. **Segments**: Sorted city breakdown with progress bars, Tier-2 vs Tier-3 apply rate, category response rate & response time, verified vs unverified employers, acquisition channel intent, posting day analysis, and the Nagpur July dip.
  3. **Insights**: 6 expandable findings with SQL reconciliation numbers and tactical recommendations.
- **Client-Side Filters**: Instant date range, city tier, city, language, category, and acquisition channel filtering without re-fetching.
