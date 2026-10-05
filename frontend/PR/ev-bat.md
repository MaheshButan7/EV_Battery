# PROJECT: EV Battery Digital Twin & Predictive Analytics — POC dashboard

Client: a new EV subsidiary of Suzlon. This is a proof of concept for a demo, so visual quality and structure matter more than backend depth.

## TECH STACK (strict)
- React (Vite) with JavaScript. No TypeScript.
- Tailwind CSS for all styling.
- No backend, no live simulator, no websockets. All data is static, in local files.

## SCOPE
Build ONLY two screens:
1. Overview (fleet-level dashboard)
2. Vehicle Dashboard (single-vehicle detail, reached by clicking a vehicle on Overview)

The sidebar must list all of these items: Overview, Battery Digital Twin, Health & SoH, Predictions, Thermal Analysis, Usage & Performance, Reports, Settings.
- "Overview" opens the fleet screen.
- "Battery Digital Twin" opens the vehicle dashboard (default vehicle if none selected).
- Every other item is visible but does nothing: no route, no page, no placeholder screen. Give them a normal look with a subtle "Soon" badge and a not-allowed cursor.

## APP SHELL
- Collapsible left sidebar (logo placeholder + product name at the top, nav items with icons, active state highlighted).
- Top header: breadcrumbs (Fleet > EV-xxxx on the vehicle screen), global search box (visual only), notification bell with a count badge, the theme toggle button, a user avatar placeholder.
- Fully responsive: sidebar becomes a drawer on mobile, and cards reflow to a single column.

## THEMING (important)
- Light and dark theme with a toggle button (sun/moon icon) in the header.
- Use Tailwind's class-based dark mode with CSS variables or semantic color tokens defined once in the Tailwind config. Components must never hardcode theme colors.
- Default to the system preference, persist the choice, and avoid a flash of the wrong theme on load.
- Dark: deep navy/slate surfaces, with restrained accents (green for healthy, amber for warning, red for critical, blue/cyan for primary). Subtle borders, soft glows only on key elements. Do NOT overdo neon.
- Light: clean white/slate-50 surfaces with the same accent logic, and enough contrast in both themes.
- Charts must read the theme colors, so axes, grids, tooltips and series all adapt to light/dark.
- Consistent design system: rounded-xl cards, one spacing scale, one font (Inter or similar), tabular numbers for metrics.

## STATIC DATA (`src/data/`)
Create a hierarchical structure, even though the UI uses only some levels: fleet -> vehicles -> pack -> modules -> cells.
- ~24 vehicles with realistic variety: id (EV-4501...), model, status (Charging / Driving / Idle / Fault), SoC %, SoH % (ranging ~72-98), temperature, voltage, current, cycle count, RUL in years, risk level (Low/Medium/High), active alert count, last updated.
- Fleet-level: SoH trend over the last 12 months, SoH distribution buckets, alert list with severity and timestamp.
- One fully detailed vehicle (EV-4587): pack with 8 modules x 12 cells (96 cells), each with voltage, temperature and internal resistance. It needs 3 predicted anomalies (e.g. Cell 12 voltage deviation in 18 days, Cell 45 rising internal resistance in 42 days, Cell 67 temperature increase in 76 days), an RUL series with actual, predicted, and upper/lower confidence bounds (2025-2030), and a 6-month actual-vs-predicted performance series.
- Other vehicles may reuse a generated/shared detail dataset so the vehicle screen works for any vehicle clicked.
- Access data only through a small service layer (`src/services/api.js`, with functions like `getFleetOverview()`, `getVehicles()`, `getVehicle(id)`) returning Promises, so a real API can be swapped in later without touching components.

## SCREEN 1: OVERVIEW (fleet)
- KPI row (5 cards): Total Vehicles, Average Fleet SoH, Active Alerts, Vehicles Charging, Projected Replacements (next 12 months). Each shows a small trend/delta indicator.
- Fleet SoH trend (area/line chart, 12 months).
- SoH distribution (bar chart) and Fleet status (donut: Driving / Charging / Idle / Fault).
- "Vehicles needing attention": a sortable table ranked by risk by default. Columns: vehicle ID, model, status, SoC, SoH (mini progress bar), RUL, risk badge, alerts. Search/filter by status and risk. Clicking a row navigates to `/vehicle/:id`.
- Recent alerts panel with severity icons and relative timestamps.

## SCREEN 2: VEHICLE DASHBOARD (`/vehicle/:id`)
- Header strip: vehicle ID, model, status chip, charging state with SoC and time remaining, last updated, and a vehicle switcher dropdown.
- Battery Health card: SoH as a large ring gauge (e.g. 92%), with SoC, Temperature, Voltage and Current as labeled progress bars.
- Predicted Remaining Useful Life: line chart with actual, predicted (dashed) and a shaded confidence band. Big number (e.g. 4.2 years) with a delta versus the current estimate.
- Cell heatmap: a grid of all 96 cells grouped by module, with a toggle between Temperature, Voltage and Internal Resistance views, a color legend, and a hover tooltip per cell. Anomalous cells get a visible marker. This is a 2D grid; no 3D.
- Predicted Anomalies list: cell, issue, "in N days", severity dot. Include an "All other cells normal" row.
- Battery Performance: actual vs predicted chart over 6 months.
- Summary stats row: cycle count, total energy throughput, average temperature, health index.
- Label prediction cards with a small "Model estimate" tag.

## COMPONENT STRUCTURE
```
src/
  components/   layout/Sidebar, layout/Header, ThemeToggle, KpiCard, SohRing, MetricBar,
                RulChart, CellHeatmap, AnomalyList, AlertList, VehicleTable, StatusBadge, ChartCard
  pages/        Overview.jsx, VehicleDashboard.jsx
  data/
  services/
  hooks/        useTheme
  utils/        formatters
```
Keep components small and reusable. Use loading states that render instantly (no artificial delays needed) and simple empty states.

## QUALITY BAR
- Looks like a polished enterprise SaaS product, not a template. Generous spacing, clear hierarchy, consistent icon set, smooth but subtle transitions (theme change, hover, sidebar collapse).
- Keyboard-accessible, visible focus states, aria-labels on icon buttons, and good contrast in both themes.
- No console errors or warnings. No unused code or dead routes.

## DO NOT
- Do not build any screen other than the two above.
- Do not add auth, a backend, a live simulator, or 3D.
- Do not copy any existing brand or artwork. Use a neutral logo placeholder and the product name "Battery Digital Twin".

## DELIVERABLES
Working app via `npm install && npm run dev`, plus a short README covering structure, where the static data lives, and how to swap the service layer for a real API.

Before coding, post a brief plan (file structure, design tokens, data shape) and then proceed to build.
