# EV Battery Digital Twin & Predictive Analytics — POC Dashboard

A fleet-level digital twin and predictive battery analytics dashboard developed for Suzlon EV.

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

---

## 📁 Architecture & File Structure

```
src/
├── components/           # Reusable UI components
│   ├── layout/
│   │   ├── Sidebar.jsx   # Collapsible sidebar with mobile drawer support
│   │   └── Header.jsx    # Breadcrumbs, visual search, notification bell, theme toggle
│   ├── ThemeToggle.jsx   # Dark/Light mode theme switcher with system preference detection
│   ├── KpiCard.jsx       # Metric cards with deltas and tabular numbers
│   ├── SohRing.jsx       # Circular animated SoH gauge
│   ├── MetricBar.jsx     # Telemetry progress indicators (SoC, Temp, Voltage, Current)
│   ├── RulChart.jsx      # Remaining Useful Life chart with 95% confidence bounds
│   ├── CellHeatmap.jsx   # 2D cell telemetry matrix (8 modules x 12 cells = 96 cells)
│   ├── AnomalyList.jsx   # Predicted cell anomalies list with model estimate tags
│   ├── AlertList.jsx     # Prioritized fleet alert notification panel
│   ├── VehicleTable.jsx  # Sortable & filterable vehicles needing attention table
│   ├── StatusBadge.jsx   # Vehicle status & risk chips
│   └── ChartCard.jsx     # Standardized card wrapper for visualizations
├── data/
│   ├── vehicles.js       # Static telemetry data for ~24 vehicles
│   ├── fleetOverview.js  # Fleet KPIs, 12-month SoH trend, distribution, and alerts
│   └── vehicleDetail.js  # Detailed pack telemetry (96 cells), RUL series & anomalies
├── services/
│   └── api.js            # Service abstraction layer returning Promises
├── hooks/
│   └── useTheme.js       # Dark/Light theme context and local storage persistence
├── utils/
│   └── formatters.js     # Telemetry formatting helpers (V, A, °C, mΩ, %)
├── pages/
│   ├── Overview.jsx      # Fleet Overview screen
│   └── VehicleDashboard.jsx # Vehicle Digital Twin detail screen
├── App.jsx               # Navigation shell and client router
├── main.jsx              # Application entrypoint
└── index.css             # Tailwind base styles and design system tokens
```

---

## 🔌 Data Layer & Swapping for a Real API

All components fetch data exclusively via the **service abstraction layer** located at [`src/services/api.js`](file:///e:/WebDev/Baellchen/EV%20Battery/src/services/api.js).

Currently, functions return resolved Promises with static datasets:
- `getFleetOverview()` -> Fleet KPIs, trends, distribution, and alert stream.
- `getVehicles()` -> Summary list of all ~24 vehicles.
- `getVehicle(id)` -> Full single-vehicle telemetry, 96-cell pack matrix, RUL forecast, and predicted anomalies.

### To swap for a live REST/GraphQL backend:
1. Open [`src/services/api.js`](file:///e:/WebDev/Baellchen/EV%20Battery/src/services/api.js).
2. Replace mock Promise returns with `fetch()` or `axios` HTTP calls to your backend endpoints.
3. Keep the return data shapes aligned with the components — no component code edits required!
