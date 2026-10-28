# Hiring Marketplace Analytics Dashboard (React + TypeScript)

> ⚠️ **Synthetic data for portfolio purposes only.** All data was generated using a Python script with fixed random seed (42). These are not real numbers or any real company's data.

A high-performance, responsive analytics dashboard for a hyperlocal, vernacular job marketplace tracking the seeker journey from view to hire across 21 Tier-2 & Tier-3 cities.

- **Live Dashboard:** [https://hiring-marketplace-react.vercel.app/](https://hiring-marketplace-react.vercel.app/)
- **Data covers:** 1 June 2026 - 29 August 2026 (90 days, 28,934 records)
- **Live Source:** Direct CSV sync from Google Sheets

---

## 🌟 Bonus Section: User-Focused Creative Enhancements

To go beyond standard dashboard requirements, four user-centric features were designed by putting ourselves in the shoes of **Product Managers**, **City Operations Leads**, and **Executive Decision Makers**:

| Feature Added | Target Persona | User Pain Point Solved | How It Enhances Experience & Business Impact |
|---|---|---|---|
| **1. What-If Marketplace ROI Simulator** | Executive / Product Leads | Static dashboards show past numbers, but leaders ask *"What is the projected ROI if we take action?"* | An interactive slider tool that models the real-world impact of increasing employer verification (from 60% baseline to 80%+) and reducing response latency. Dynamically calculates **Projected Additional Hires** and **Net Efficiency Lift**. |
| **2. Step-to-Step Drop-Off & Conversion %** | Growth & Funnel PMs | Normal funnels only show "% of total views". Users cannot quickly spot which transition stage leaks the most candidates. | Added Amplitude/Mixpanel-style step-to-step conversion badges (e.g. `19.8% View→Apply`, `75.7% Apply→Recruiter View`) along with explicit drop-off warnings (e.g. `↓ 42.6% drop` between recruiter review and response). |
| **3. 1-Click Investigation Presets** | City Ops & Regional Leads | Manually adjusting date sliders and 5 dropdowns to examine known business anomalies causes multi-click fatigue. | One-click shortcut presets for: **Nagpur July Dip**, **Tier-3 Deep Dive**, **WhatsApp Intent Channel**, and **Delivery Category**. Instant filtered perspective in one click. |
| **4. Instant Search & Dual-Level CSV Export** | Data Analysts & Field Ops | Business users often need to export specific cohorts into Excel for regional field-team distribution or reporting. | Added live **City Search bar** (instant debounce filtering across 21 cities) and **One-Click CSV Export** (both aggregated city table and granular row-level data). |

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
        ├── Interactive What-If ROI Simulation Engine
        │
        ▼
Tailwind CSS + Recharts UI
  ├── Overview Tab (KPIs, 6-Stage Step-by-Step Funnel, Weekly Trends, ROI Simulator)
  ├── Segments Tab (Searchable City Table, Category, Verified Status, Nagpur Dip, CSV Exports)
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
