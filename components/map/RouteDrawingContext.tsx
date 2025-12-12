'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { GraphNode } from '@/lib/routing/RouteGraph';

/** Context for managing route drawing state */
interface RouteDrawingContextType {
  isDrawing: boolean;
  setDrawing: (drawing: boolean) => void;
  selectedNode: GraphNode | null;
  setSelectedNode: (node: GraphNode | null) => void;
}

const RouteDrawingContext = createContext<RouteDrawingContextType | undefined>(
  undefined
);

export const RouteDrawingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const setDrawing = (drawing: boolean) => {
    setIsDrawing(drawing);
    if (!drawing) {
      setSelectedNode(null); // Clear selection when exiting drawing mode
    }
  };

  return (
    <RouteDrawingContext.Provider value={{ isDrawing, setDrawing, selectedNode, setSelectedNode }}>
      {children}
    </RouteDrawingContext.Provider>
  );
};

export const useRouteDrawing = () => {
  const context = useContext(RouteDrawingContext);
  if (!context) {
    throw new Error('useRouteDrawing must be used within RouteDrawingProvider');
  }
  return context;
};

export type { GraphNode } from '@/lib/routing/RouteGraph';
