# Meridian DMM — Enterprise Digital Maturity & AI Transformation Engine

Meridian DMM is a web-native executive command center for CIOs, CTOs, Digital Transformation Leads, and Enterprise Strategy VPs to audit organizational capabilities across five Digital Maturity Model (DMM) pillars, benchmark against multi-sector industry peers, model specific AI technology interventions in an automated 3-year ROI simulator, and generate a customizable, Kotter phase-gated transformation roadmap.

## User Review & Critical Decisions

> [!IMPORTANT]
> All Phase 1 choices and your latest requirements for **AI Technology Intervention ROI Modeling** and **Customizable Transformation Roadmap Generation** are incorporated below. All calculations, peer benchmarks, and persistence run deterministically in the browser with strict input validation and JSON/CSV export.

- **Confirmed Decision 1 (Industry Peer Benchmarks)**: Multi-sector presets covering **Financial Services (FinServ)**, **Healthcare**, **Retail**, and **Manufacturing**, each with calibrated 5-pillar baseline scores, top-quartile targets, and sector-specific AI bottleneck weights.
- **Confirmed Decision 2 (Persistence & Export)**: Automatic **local browser storage (`localStorage`)** for saving/loading named transformation scenarios, paired with **JSON** (full scenario state) and **CSV** (executive audit, intervention ROI comparison, and roadmap table) export.
- **Confirmed Decision 3 (Automated AI Intervention ROI Module)**: Interactive catalog of AI technology interventions (e.g., *AI-Driven Customer Service*, *Predictive Maintenance*, *Intelligent Document Processing*, *Autonomous Supply Chain*, *Engineering Copilots*, plus custom user-defined interventions) with per-intervention adoption rate sliders, comparative 3-year operating margin projections, and 3-year ROI % calculations.
- **Confirmed Decision 4 (Customizable Transformation Roadmap Generator)**: Automatically generates a phased 3-year roadmap (Horizon 1–3) with Kotter's 8-Step Change Accelerator phase gates, suggested AI interventions, and estimated timelines derived from the user's maturity gaps and active ROI interventions—with full manual prioritization, timeline adjustment, editing, and reordering.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces static consulting spreadsheets with a live, deterministic transformation engine. Leadership teams:
  1. Score 5 core digital pillars (*Data & Analytics*, *Cloud & Infrastructure*, *Automated Workflows*, *Culture & Talent*, *Customer & Product*) and benchmark against industry peers.
  2. Select and configure specific **AI Technology Interventions** with individual adoption rates (0%–100%) to project 3-year operating margin expansion and 3-year ROI in a side-by-side comparative view.
  3. Automatically generate a **Phased Transformation Roadmap** from their maturity gaps and selected AI interventions, then manually prioritize, adjust timelines, and track Kotter phase gates.
- **Target Audience / Persona**: CIOs, CTOs, Digital Transformation Leads, and Enterprise Strategy VPs conducting capability audits, board-level ROI modeling, and multi-year change governance.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Executive Command Overview & 5-Pillar Audit**: Displays the **Digital Maturity Index (DMI)**, peer benchmark delta, projected 3-year ROI %, and an interactive **5-Pillar Maturity Radar** comparing *Current Enterprise*, *Industry Peer Baseline*, and *Target Maturity*. Adjusting any pillar slider immediately recalculates the DMI, updates the radar polygon, and ranks AI integration bottlenecks.
  2. **Industry Peer Benchmarking & Bottleneck Mapping**: Switching between *FinServ*, *Healthcare*, *Retail*, and *Manufacturing* updates the peer baseline polygon and re-ranks AI integration bottlenecks with severity and remediation impact.
  3. **Automated AI Intervention ROI Simulator**:
     - Users toggle built-in AI interventions (e.g., *AI-Driven Customer Service*, *Predictive Maintenance*, *Intelligent Claims & Document Automation*, *Predictive Demand & Inventory AI*, *AI Code & QA Copilots*, *Fraud & Anomaly Detection*) or add custom interventions with custom investment ($M) and margin impact.
     - Users adjust individual **Adoption Rates (%)** and global execution sensitivity (Data Readiness & Governance, Workforce Upskilling Velocity).
     - Displays a **Comparative 3-Year ROI & Operating Margin View**: side-by-side comparison of *Status Quo Baseline*, *Current Selected Interventions*, and *Full-Adoption Target* across Year 1, Year 2, and Year 3 operating margins, cumulative EBITDA lift ($M), net 3-year ROI %, and payback period.
  4. **Customizable Transformation Roadmap Generator**:
     - Clicking **"Generate Roadmap from Audit & ROI"** (or auto-syncing) synthesizes a phased 3-year roadmap based on the lowest-scoring DMM pillars and the active AI interventions from the ROI module.
     - Each roadmap item includes: **Phase/Horizon** (Year 1 Foundation, Year 2 Scale, Year 3 Autonomous), **Kotter Change Gate** (Steps 1–8), **Linked Pillar & AI Intervention**, **Priority** (P1 Critical, P2 High, P3 Medium), **Estimated Timeline** (e.g., `Q1–Q2 Year 1`), and **Status** (`Planned`, `In Progress`, `Completed`).
     - Users can manually **reorder/prioritize** items (move up/down, change P1/P2/P3), **adjust timelines/horizons**, **edit titles/interventions**, **add custom milestones**, or **delete items**.
  5. **Scenario Persistence & Export**: Save named snapshots to `localStorage`, switch between saved scenarios, or export sanitized **JSON** and **CSV** reports.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-Density Tech Command Center / Cyber-Slate Dark Mode.
  - *Color Palette & Mood*:
    - Dominant Canvas (`--background`): Deep Midnight Charcoal (`#06080F`)
    - Structural Surfaces (`--surface`): Cyber-Slate (`#0C111D` and `#111827`) with crisp `1px` hairline borders (`#1E293B`)
    - Primary Radar & Action Accent (`--primary`): Neon Electric Blue (`#3B82F6`)
    - Maturity Target & Positive Delta (`--accent`): Vibrant Emerald (`#10B981`)
    - Bottleneck / Warning: Amber (`#F59E0B`) and Crimson (`#EF4444`) paired with explicit text labels
  - *Typography & Hierarchy*:
    - Display & Navigation: `Plus Jakarta Sans` (`text-wrap: balance` on headings)
    - Body & Dense Controls: `Public Sans`
    - Telemetry, Scores & Financial Tables: `JetBrains Mono` with `font-variant-numeric: tabular-nums`
  - *Component Styling & Layout*:
    - Left sidebar navigation (`240px`) + Top header bar with contextual breadcrumbs and primary Save/Export actions + Main 1440px-optimized analytical viewport.
    - Single-elevation flat surfaces with `1px` hairline borders (no nested card sandwiches, no thick left accent borders, no static pill badges, no decorative pulsing dots).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Deterministic Mathematical Engine vs. External AI Calls**
  - *Chosen Approach*: Pure, deterministic TypeScript calculation engine for Digital Maturity Index, intervention-level 3-year ROI & operating margin projections, and rule-based roadmap synthesis.
  - *Why*: Guarantees instant, reproducible, auditable numbers for executive boardrooms with zero latency, zero API key exposure, and full compliance with user instructions.

- **Decision 2: Custom SVG 5-Pillar Radar & Comparative Margin Charts**
  - *Chosen Approach*: Purpose-built, responsive SVG 5-Pillar Radar Chart and Comparative 3-Year Operating Margin Trajectory Chart with interactive hover tooltips and tabular numerals.
  - *Why*: Eliminates bundle bloat, avoids React 19 peer-dependency issues, and provides pixel-exact control over `#3B82F6` radar lines and `#10B981` target indicators.

- **Decision 3: Security & Input Hardening**
  - *Chosen Approach*: Strict numeric clamping on all sliders/inputs, schema validation on JSON scenario imports, and RFC-4180 CSV cell sanitization (neutralizing leading `=`, `+`, `-`, `@`, `\t`, `\r` characters to prevent CSV formula injection).
  - *Why*: Protects leadership when exporting reports to Excel/Sheets or importing saved scenario files.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Meridian DMM Application                         │
├───────────────────────────┬──────────────────────────────────────────────┤
│   Left Navigation Rail    │            Top Executive Header              │
│  - Command Overview       │  - Breadcrumb & Active Sector / Scenario     │
│  - Peer Benchmarking      │  - Save Snapshot / Export JSON / Export CSV  │
│  - AI ROI Simulator       │                                              │
│  - Roadmap Generator      │                                              │
├───────────────────────────┴──────────────────────────────────────────────┤
│                        Deterministic Domain Engine                       │
│  ┌─────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐  │
│  │  Maturity & Peer    │  │  AI Intervention     │  │ Customizable    │  │
│  │  Scoring Engine     │  │  3-Yr ROI Engine     │  │ Roadmap Engine  │  │
│  └──────────┬──────────┘  └──────────┬───────────┘  └────────┬────────┘  │
│             └────────────────────────┼───────────────────────┘           │
│                                      ▼                                   │
│                        Validated State & Storage                         │
│             (localStorage persistence + CSV/JSON sanitizer)              │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **5 DMM Pillars**: `data`, `cloud`, `workflows`, `culture`, `customer` (`1.0`–`5.0` scale).
  - **Sector Presets**: `finserv`, `healthcare`, `retail`, `manufacturing` with peer baselines, targets, and sector-weighted AI interventions.
  - **AI Technology Interventions**: Each intervention has `id`, `name`, `targetPillar`, `enabled`, `adoptionRate` (0–100%), `implementationCostM` ($M), `maxMarginLiftBps` (basis points at 100% adoption & 5.0 maturity), and `rampQuarters`.
  - **Comparative 3-Year ROI Output**: Computes Year 1, Year 2, Year 3 operating margin %, net 3-year ROI %, total investment ($M), cumulative EBITDA gain ($M), and payback quarter across *Baseline*, *Selected Scenario*, and *Full-Adoption Target*.
  - **Customizable Roadmap Items**: Synthesized from maturity gaps (`target - current`) and enabled AI interventions, mapped to Kotter's 8 Steps and Horizons 1–3, with full manual reordering, priority/timeline editing, and custom item creation.
  - **Unit Tests**: Automated `vitest` suite covering maturity scoring, AI intervention ROI math, roadmap generation/reordering, and CSV/JSON security sanitization.
