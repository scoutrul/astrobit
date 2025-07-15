# Tasks for AstroBit

## Project Setup

1. Initialize React + Vite project with TypeScript
   - Use latest stable versions
   - Configure Vite for HMR
   - **Status: Completed**

2. Set up project structure
   - Create directory structure according to architecture
   - Set up initial files and folders
   - **Status: Completed**

3. Configure Tailwind CSS
   - Install and configure Tailwind
   - Set up custom color palette
   - Configure dark theme
   - Create @layer structure for component styles
   - **Status: Completed**

4. Set up Zustand store
   - Install Zustand
   - Create basic store structure
   - **Status: Completed**

## Core Features Implementation

### Chart Component

1. Install and configure Lightweight Charts
   - Set up basic chart component
   - Configure dark theme styling
   - **Status: Completed**

2. Implement chart interactivity
   - Zoom and pan functionality
   - Cursor interaction (crosshair)
   - Time and price tooltips

3. Create timeframe selector
   - UI component for timeframe switching
   - Logic for changing chart resolution

4. Implement legend component
   - Asset name display
   - Current price display
   - Selected timeframe indicator

### API Integration

1. Set up Bybit API connection
   - Create API client with Axios
   - Implement error handling and retries

2. Implement candle data fetching
   - Create hooks for data fetching
   - Handle different timeframes
   - Implement pagination/historical data loading

3. Add real-time updates
   - Set up websocket connection if available
   - Implement fallback polling mechanism

### Astronomical Features

1. Integrate Astronomia library
   - Set up calculation modules
   - Create hooks for astronomical data

2. Implement moon phases calculation
   - Calculate full and new moon events
   - Map to chart timeline

3. Implement eclipse calculations
   - Calculate solar and lunar eclipses
   - Map to chart timeline

4. Implement seasonal points
   - Calculate equinoxes and solstices
   - Map to chart timeline

5. Create event markers
   - Design and implement event icons
   - Add positioning logic on chart
   - Handle zoom and timeframe changes

## UI/UX Enhancements

1. Create responsive layout
   - Implement mobile-first approach
   - Add breakpoints for different screen sizes

2. Implement header component
   - Create app title/logo
   - Add navigation elements if needed

3. Style chart container
   - Apply custom styling to chart
   - Ensure proper sizing and responsiveness

4. Add loading states
   - Implement loading indicators
   - Handle edge cases and errors

## Testing and Optimization

1. Add basic tests
   - Test core functionality
   - Ensure data flow works correctly

2. Performance optimization
   - Optimize rendering
   - Implement memoization where needed
   - Ensure smooth scrolling and zooming

3. Browser compatibility testing
   - Test on major browsers
   - Fix any compatibility issues

## Status

All tasks pending. Implementation will follow the order listed above.

## Complexity Level

Based on the requirements, this project is assessed as **Level 3** complexity:
- Multiple integrated features
- External API integration
- Complex UI with interactive elements
- Custom business logic for astronomical calculations
- Need for performance optimization for smooth chart experience 