'use client';

import { useRouteDrawing } from './RouteDrawingContext';

export function RouteDrawingOverlay() {
  const { isDrawing, setDrawing } = useRouteDrawing();

  if (!isDrawing) return null;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1001] bg-m3-secondary-container text-m3-on-secondary-container px-3 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg border border-m3-outline max-w-[95vw] sm:max-w-none">
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-m3-tertiary rounded-full animate-pulse" />
          <span className="font-semibold text-sm sm:text-base">Route Drawing Mode</span>
        </div>
        <div className="text-xs sm:text-sm opacity-90 sm:border-l border-m3-outline sm:pl-4 text-center sm:text-left">
          Drag vertices to snap • Click nodes to tag
        </div>
        <button
          onClick={() => setDrawing(false)}
          className="px-3 py-1 bg-m3-surface hover:bg-m3-surface-variant text-m3-on-surface rounded text-xs sm:text-sm transition-colors"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
