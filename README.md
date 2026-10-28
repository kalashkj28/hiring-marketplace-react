# Hiring Marketplace Analytics Dashboard (React + TypeScript)

> ⚠️ **Synthetic data for portfolio purposes only.** All data was generated using a Python script with fixed random seed (42). These are not real numbers or any real company's data.

A high-performance, responsive analytics dashboard for a hyperlocal, vernacular job marketplace tracking the seeker journey from view to hire across 21 Tier-2 & Tier-3 cities.

- **Live Dashboard:** [https://hiring-marketplace-react.vercel.app/](https://hiring-marketplace-react.vercel.app/)
- **Data covers:** 1 June 2026 - 29 August 2026 (90 days, 28,934 records)
- **Live Source:** Direct CSV sync from Google Sheets

---

## Architecture & Tech Stack

```
Google Sheets (Live Data Source)
        │
        ▼ (PapaParse CSV Stream)
Vite + React 18 (TypeScript)
        │
        ├── Client-Side In-Memory Filtering (< 20ms across 29k rows via useMemo)
        ├── Dynamic KPIs & Metric Derivations
        │
        ▼
Tailwind CSS + Recharts UI
  ├── Overview Tab (KPIs, 6-Stage Funnel, Weekly Trends)
  ├── Segments Tab (City Table, Category, Verified Status, Nagpur Dip)
  └── Insights Tab (Actionable Findings & SQL Evidence)
```

| Layer | Technology | Role |
|---|---|---|
| **Framework** | React 18, TypeScript, Vite | Fast SPA bundling, strict type safety, zero compile lag |
| **Styling** | Tailwind CSS | Modern, clean UI matching light-mode analytics design |
| **Visualizations** | Recharts | Interactive SVG charts (Funnel, Dual-Axis, Grouped Bars) |
| **Icons** | Lucide React | Minimalist UI icons |
| **Data Engine** | PapaParse | In-browser CSV streaming & parsing from Google Sheets |
| **Deployment** | Vercel | Global edge CDN deployment |

---

## Core Funnel & SQL Reconciliation

The headline funnel counts were independently validated against SQL queries run on the dataset:

| Funnel Stage | SQL Count | React Dashboard | Difference |
|---|---|---|---|
| **Views** | 28,934 | 28,934 | 0 |
| **Applications** | 5,727 | 5,727 | 0 |
| **Recruiter Views** | 4,334 | 4,334 | 0 |
| **Responses** | 2,486 | 2,486 | 0 |
| **Interviews** | 1,179 | 1,179 | 0 |
| **Hires** | 362 | 362 | 0 |

---

## Key Findings

1. **Tier-3 cities convert worse from view to apply:** 15.2% vs 22.0% for Tier-2 (a 6.8pp gap).
2. **Verified employers respond 2.5x more:** 57.4% response rate vs 22.2% for unverified employers.
3. **Delivery & Logistics is the slowest category:** Average 70.5h to first response vs 33.0h for Sales.
4. **Weekend postings get weaker response:** 36.6% response rate vs 46.0% for weekday postings.
5. **WhatsApp Share brings the highest applicant intent:** 25.1% view-to-apply vs 15.7% for Paid Ads.
6. **Nagpur experienced a 2-week application dip in July:** Dropped to ~6-9% apply rate (days 40-54) while peer cities (Nashik, Patna) remained stable.

---

## Features

- **Live Data Sync:** Button to re-fetch live records from Google Sheets on demand.
- **Instant Client-Side Filtering:** Date Range, City Tier, City, Language, Category, and Acquisition Channel filters recalculate metrics in under 20ms without network roundtrips.
- **Interactive Visualizations:**
  - 6-Stage Funnel drop-off visualization with exact percentages
  - Volume trends & conversion rate stability over time
  - City performance table with inline progress bars
  - Nagpur dual-axis volume vs conversion chart with highlighted anomaly region
- **Expandable Insights:** Tactical business recommendations and impact measurement frameworks for each key finding.

---

## Local Development

```bash
# 1. Clone the repository
git clone https://github.com/kalashkj28/hiring-marketplace-react.git
cd hiring-marketplace-react

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

```bash
# Build for production
npm run build
```

---

## Limitations

- **Synthetic data:** Generated via Python to simulate real-world hyperlocal hiring dynamics.
- **Dataset scale:** Ideal for client-side processing up to ~50K rows. For larger enterprise scale, backend data warehousing (BigQuery / ClickHouse) would be recommended.
