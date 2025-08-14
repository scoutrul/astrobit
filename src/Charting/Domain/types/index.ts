// Charting Domain Types

export interface ChartRange {
  from: number;
  to: number;
}

export interface ChartInteractionState {
  isDragging: boolean;
  lastX: number;
  lastTimestamp: number;
} 