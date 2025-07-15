# System Patterns

## Astronomical Logic

Using the astronomia library to calculate the following events:

### Moon Phases
- Full Moon
- New Moon

### Eclipses
- Lunar Eclipses
- Solar Eclipses

### Seasonal Points
- Spring Equinox
- Summer Solstice
- Autumn Equinox
- Winter Solstice

All events are displayed above the chart as icons/markers.
Both past events and the next upcoming event of each type should be displayed.
The chart itself is limited to the current moment, but astronomical events can extend beyond this limit, forming a "future prediction."

## Chart Feature

### Behavior and Requirements
- Chart occupies all free space on the page below the header
- Horizontal axis — time, vertical axis — price
- Uses the lightweight-charts library (official)
- Chart must:
  - Support scaling (scroll, pinch, +/-)
  - Allow movement to past and future
  - Load additional candles when moving or scaling
  - Have buffer data loading beyond screen boundaries for smooth scrolling
  - Support interactivity under the cursor:
    - Horizontal and vertical lines
    - Price value vertically (on scale)
    - Time value horizontally (on timeline)
  - Events (eclipses, phases, solstices) must be:
    - Tied to exact time
    - Displayed as icons above the chart
    - React to scale and timeframe

### Timeframes
- 1h
- 8h
- 1d
- 1w
- 1m
- All (all time)

Timeframe selection is implemented through a UI switch available at the top/side of the chart (not in the header).

### Legend
- Displayed in the upper left corner of the chart
- Contains:
  - Asset name (e.g., BTC/USDT)
  - Current price (if possible to fetch)
  - Timeframe (optional) 