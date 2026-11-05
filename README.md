# Meridian DMM — Enterprise Digital Maturity & AI Transformation Engine

Meridian DMM is a web-native executive command center built for CIOs, CTOs, Digital Transformation Leads, and Enterprise Strategy VPs to audit organizational capabilities, benchmark against industry peers, model 3-year AI operating margin ROI, and manage a customizable transformation roadmap.

## Target Frameworks

- **Digital Maturity Model (DMM)**: Evaluates enterprise readiness across five weighted pillars (*Data & Analytics*, *Cloud & Infrastructure*, *Automated Workflows*, *Culture & Talent*, and *Customer & Product*) on a `1.0` to `5.0` scale.
- **McKinsey Digital Transformation Framework**: Maps capability deficits to architectural, operational, and talent bottlenecks.
- **Kotter’s 8-Step Change Accelerator**: Structures multi-year transformation milestones across three change phases (*Create Climate*, *Engage & Enable*, *Implement & Sustain*).

## Core Capabilities

1. **Interactive 5-Pillar Maturity Radar & Audit**
   - Real-time SVG radar comparing **Enterprise Current**, **Sector Peer Average**, and **Top-Quartile Target** maturity.
   - Dynamic **AI Integration Bottleneck Map** ranking transformation constraints by pillar deficit and sector friction.
2. **Multi-Sector Peer Benchmarking**
   - Calibrated baselines for **Financial Services (FinServ)**, **Healthcare**, **Retail**, and **Manufacturing**.
3. **Automated AI Technology Intervention ROI Simulator**
   - Toggle and adjust adoption rates (`0%–100%`) for built-in AI interventions (*AI-Driven Customer Service*, *Predictive Maintenance*, *Intelligent Document & Claims Automation*, *Autonomous Supply Chain*, *GenAI Engineering Copilots*, *Real-Time Fraud Detection*) or add custom interventions.
   - Projects Year 1–3 operating margin expansion, cumulative EBITDA lift, net 3-year ROI %, and payback period in a side-by-side comparative view (*Status Quo Baseline* vs. *Selected Scenario* vs. *Full-Adoption Target*).
4. **Customizable Transformation Roadmap Generator**
   - Automatically synthesizes a phased 3-year roadmap (Horizons 1–3) from maturity gaps and active AI interventions.
   - Supports manual priority reordering, horizon/timeline editing, Kotter gate tracking, status cycling, and custom milestone creation.
5. **Local Persistence & Sanitized Export**
   - Save and load named snapshots in `localStorage`, import validated JSON scenarios, and export **JSON** and **CSV** reports (with RFC-4180 quoting and CSV formula-injection neutralization).

## Development & Testing

```bash
# Install dependencies
npm install

# Run unit & security tests
npm test

# Type-check
npm run lint

# Build production bundle
npm run build
```
