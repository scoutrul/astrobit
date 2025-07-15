# Technical Context

## Project Structure
```
src/
├── api/              // Simple API requests to remote services
├── hooks/            // Business logic in custom hooks (similar to Vue composables)
├── store/            // Global zustand store (connected by default, used as needed)
├── models/           // Data types and interfaces
├── utils/            // Helpers, transformations, formatters
├── styles/           // Tailwind CSS + custom layers + global themes
├── components/
│   ├── shared/       // Reusable simple components
│   └── chart/        // "Chart" feature: index.tsx (container), ui/ (display)
├── App.tsx
└── main.tsx
```

## Architectural Principles

### Separation of Responsibilities
- API — Simple requests without logic
- Hooks — Business logic, API work, transformations, store interaction
- Store — Zustand, connected by default, used as needed
- Components — Visualization only; no logic or network calls inside

### Hooks ≈ Composables
- All custom hooks useXXX perform exactly one task
- Can use each other, API, store

### Components
- All components are simple, short, controlled via props
- Separation: shared/ for common elements, chart/ui/ for local chart feature components
- In each feature module, index.tsx is a container connecting hooks and visual components

### Tailwind Classes
- Custom className used in JSX (className="ChartContainer")
- All Tailwind utility classes applied through @layer in styles/ — no cluttering of JSX

### Typing
- Entire project structure typed with TypeScript
- Types stored in models/, not mixed directly with API responses

### Hot Reload
- Full hot update (HMR) during development without restart

## Technologies
- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Axios
- Lightweight Charts (official from TradingView)
- Astronomia — library for astronomical calculations

Use only the latest stable versions of all dependencies that are compatible with each other and suitable for the project architecture.

## Visual Requirements
- Theme: Dark, without switching
- Layout:
  - Entire page — 100vh
  - Header — non-fixed, simply at the beginning of the flow
  - Padding — soft, visually balanced
- Adaptivity:
  - Support for screens from mobile to desktop
  - Tailwind breakpoints should be utilized
  - Chart adapts to screen width
- Color palette (in tailwind.config.js):
  - background: #0f0f1a
  - primary: #8dd4ff
  - accent: #ffdd57
  - error: #ff5c5c
  - text: #ffffff

## Launch
- Installation: npm install
- Launch: npm run dev
- Project should start with Hot Module Reloading (HMR)
- At startup:
  - Prepared layer structure
  - Basic chart component (Chart) present
  - Event placeholders output
  - Tailwind and custom theme connected 