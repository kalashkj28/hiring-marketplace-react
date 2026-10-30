# Hiring Marketplace Analytics Dashboard (Local-First React + TypeScript + DuckDB-Wasm)

> **Synthetic data for portfolio purposes only.** All data was generated using a Python script with fixed random seed (42). These are not real numbers or any real company's data.

A local-first analytics dashboard for a hyperlocal, vernacular job marketplace tracking the seeker journey from view to hire across 21 Tier-2 & Tier-3 cities.

- **Live Dashboard:** [https://hiring-marketplace-react.vercel.app/](https://hiring-marketplace-react.vercel.app/)
- **Data covers:** 1 June 2026 - 29 August 2026 (90 days, ~29,000 records)
- **Local Engine:** DuckDB WebAssembly running in a Web Worker, persisted in OPFS

---

## Local-First Architecture

The dashboard is built local-first: all user actions (filtering, aggregations, tab switching, searches, CSV exports) read strictly from an embedded, client-side SQL database (DuckDB-Wasm). The UI never makes a network request when the user interacts.

```
Google Sheet (Source of Truth)
        │
        ▼ (Pull-based Sync)
Sync Engine (Main Thread Fetch & Parse)
  ├── SHA-256 Content Hash Comparison
  └── Single Transaction Diff Dispatch (Insert / Update / Delete)
        │
        ▼
DuckDB WebAssembly (`opfs://hiring.duckdb` in dedicated Web Worker)
  ├── Tables: `records`, `sync_state`
  ├── Persistent Storage: OPFS (Origin Private File System)
  └── Fallback: In-memory database if OPFS is unavailable
        │
        ▼ (Strictly Typed SQL Queries)
React 18 + Tailwind CSS + Recharts UI
  ├── Instant Startup: Opens directly from local OPFS data
  ├── Interactive Filters & 6-Stage Step-by-Step Funnel
  ├── What-If Marketplace ROI Simulator
  └── Offline Operation: Fully functional without network connection
```

| Layer | Technology | Role |
|---|---|---|
| **Local Database** | DuckDB-Wasm (`@duckdb/duckdb-wasm`) | In-browser analytical SQL engine running in a dedicated Web Worker |
| **Persistence** | OPFS (`opfs://hiring.duckdb`) | Persistent file storage in the browser with in-memory fallback |
| **Sync Engine** | Pull-Sync (`syncEngine.ts`) | Event-driven differential sync from Google Sheet into local SQL tables |
| **Frontend** | React 18, TypeScript, Vite | Strictly typed, reactive UI components |
| **Styling** | Tailwind CSS | Clean, modern light-mode analytics styling |
| **Visualizations** | Recharts | Interactive SVG charts (Funnel, Dual-Axis, Grouped Bars) |
| **Deployment** | Vercel | Global edge CDN hosting static assets (WASM & Worker files) |

---

## How Synchronization Works (Pull-Based Sync)

The sync engine follows a **pull-based** model:

- **Threading model:** DuckDB executes inside a dedicated Web Worker (`AsyncDuckDB`) for non-blocking queries, while CSV fetching, SHA-256 calculation, and PapaParse parsing run on the main thread, dispatching batched SQL statements to the worker connection.
- **Event-driven triggers:** Sync does not run on a polling timer. It triggers exclusively on:
  1. Initial application load (checks if the local database has records).
  2. Background verification after initial render (checks if the upstream sheet changed).
  3. Browser reconnect (`online` event).
  4. Manual click on the **"Sync now"** button in the header.
- **Change detection:** The engine calculates a SHA-256 hash of the fetched CSV content and compares it with `content_hash` in `sync_state`. If the hash is identical, no table writes occur, avoiding unnecessary work.
- **Differential updates:** When changes are detected, incoming rows are compared against local storage in a temporary table inside a single SQL transaction:
  - Rows absent from the sheet are deleted from local storage.
  - Rows with modified fields across any column are updated using SQL `IS DISTINCT FROM` comparison.
  - New rows are inserted.
  - A `CHECKPOINT` is executed to flush changes to the OPFS database file immediately.
- **Concurrency control:** An in-flight promise guard ensures that multiple overlapping sync triggers (such as React StrictMode mounts or rapid button clicks) share a single execution rather than opening conflicting transactions.
- **"Sync now" vs "Reset local data":**
  - **Sync now:** Fetches the upstream sheet and applies an incremental diff (inserts, updates, deletes) to the local database without wiping data.
  - **Reset local data:** Clears the local OPFS database file and executes a complete, fresh re-import from scratch.
- **Sync scope and limitations:**
  - Sync is strictly **pull-only** (from Google Sheet to local DuckDB).
  - Writing changes back from the client to a remote server (push-sync, outbox queues, conflict resolution) is not implemented.
  - If a network fetch fails, the app continues running on local data and indicates an `Offline` status in the header. Local data is never wiped because of a network error.

---

## User-Focused Features

| Feature Added | Target Persona | User Pain Point Solved | How It Enhances Experience & Business Impact |
|---|---|---|---|
| **1. Local-First Instant Open** | All Users | Traditional web apps show loading spinners on every page reload while waiting for remote CSV fetches. | Instant startup from local OPFS storage. Works offline without network connectivity. |
| **2. What-If Marketplace ROI Simulator** | Executive / Product Leads | Static dashboards show past numbers, but leaders ask *"What is the projected ROI if we take action?"* | An interactive slider tool that models the impact of increasing employer verification (from 60% baseline to 80%+) and reducing response latency. Dynamically calculates **Projected Additional Hires** and **Net Efficiency Lift**. |
| **3. Step-to-Step Drop-Off & Conversion %** | Growth & Funnel PMs | Normal funnels only show "% of total views". Users cannot quickly spot which transition stage leaks the most candidates. | Added step-to-step conversion badges (e.g. `19.8% View→Apply`, `75.7% Apply→Recruiter View`) along with explicit drop-off warnings (e.g. `↓ 42.6% drop` between recruiter review and response). |
| **4. 1-Click Investigation Presets** | City Ops & Regional Leads | Manually adjusting date sliders and 5 dropdowns to examine known business anomalies causes multi-click fatigue. | One-click shortcut presets for: **Nagpur July Dip**, **Tier-3 Deep Dive**, **WhatsApp Intent Channel**, and **Delivery Category**. |
| **5. Instant Search & Dual-Level CSV Export** | Data Analysts & Field Ops | Business users often need to export specific cohorts into Excel for regional field-team distribution or reporting. | Added live **City Search bar** and **One-Click CSV Export** executed directly from DuckDB SQL. |

---

## Core Funnel and SQL Reconciliation

The headline funnel counts were validated against SQL queries run on the dataset:

| Funnel Stage | SQL Count | DuckDB Result | Difference |
|---|---|---|---|
| **Views** | 28,959 | 28,959 | 0 |
| **Applications** | 5,732 | 5,732 | 0 |
| **Recruiter Views** | 4,338 | 4,338 | 0 |
| **Responses** | 2,487 | 2,487 | 0 |
| **Interviews** | 1,179 | 1,179 | 0 |
| **Hires** | 362 | 362 | 0 |

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

- **Browser Storage (OPFS):** Persistent storage via OPFS is supported primarily in desktop Chromium-based browsers (Chrome, Edge, Brave). In other environments (or private browsing modes), the dashboard falls back to an in-memory DuckDB database and displays a notification banner.
- **Pull-Only Sync:** Data synchronizes from Google Sheets to the browser. Local edits are not pushed back to a central server.
- **Dataset Scale:** Designed for fast client-side analytical queries on datasets up to ~100K rows. For larger enterprise scale (>1M rows), server-side analytical data warehouses (BigQuery / ClickHouse) are recommended.
