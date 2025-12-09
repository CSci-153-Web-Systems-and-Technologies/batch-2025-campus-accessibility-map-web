'use client';

import { useEffect, useRef, RefObject, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useRouteDrawing } from './RouteDrawingContext';
import { RouteGraph, GraphNode } from '@/lib/routing/RouteGraph';
import { saveRoutes, fetchRoutes, deleteRoutes } from '@/lib/api/routes';
import { toPolylineInsert, deserializePolyline } from '@/lib/routing/serialization';
import { SaveRoutesButton } from './SaveRoutesButton';
// @ts-ignore - Leaflet Draw doesn't have official types
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

/** Creates a Leaflet marker icon for route nodes with optional stair tag styling */
const createNodeIcon = (tags: string[]): L.DivIcon => {
  const hasStairs = tags.includes('has_stairs');
  const color = hasStairs ? 'hsl(var(--m3-error))' : 'hsl(var(--m3-tertiary))';
  
  return L.divIcon({
    className: 'route-node-marker',
    html: `<div style="width: 16px; height: 16px; background-color: ${color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); cursor: pointer;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

interface RouteDrawingControlProps {
  graphRef: RefObject<RouteGraph | null>;
}

export function RouteDrawingControl({ graphRef }: RouteDrawingControlProps) {
  const map = useMap();
  const { isDrawing, setSelectedNode } = useRouteDrawing();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const nodeLayerRef = useRef<L.LayerGroup | null>(null);
  const localGraphRef = useRef<RouteGraph>(graphRef.current || new RouteGraph());
  const nodeMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const snapIndicatorRef = useRef<L.CircleMarker | null>(null);
  const polylineLayers = useRef<Map<string, L.Polyline>>(new Map());
  const deletedPolylineIds = useRef<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!graphRef.current) {
      graphRef.current = localGraphRef.current;
    } else {
      localGraphRef.current = graphRef.current;
    }
  }, [graphRef]);

  /** Saves all route changes to database: deletions first, then inserts/updates */
  const handleSaveRoutes = async (): Promise<void> => {
    if (deletedPolylineIds.current.size > 0) {
      const idsToDelete = Array.from(deletedPolylineIds.current);
      const deleteResult = await deleteRoutes(idsToDelete);
      
      if (deleteResult.error) {
        console.error('Failed to delete routes:', deleteResult.error);
        throw deleteResult.error;
      }
      
      deletedPolylineIds.current.clear();
    }
    
    const polylinesToSave: Array<ReturnType<typeof toPolylineInsert>> = [];

    polylineLayers.current.forEach((layer) => {
      const latlngs = layer.getLatLngs() as L.LatLng[];
      const coordinates = latlngs.map(ll => [ll.lat, ll.lng]);
      const nodeTags: Record<string, { hasStairs?: boolean }> = {};
      
      latlngs.forEach((latlng, index) => {
        const node = localGraphRef.current.findNodeAt(latlng);
        if (node?.tags.length) {
          nodeTags[`${index}`] = {
            hasStairs: node.tags.includes('has_stairs'),
          };
        }
      });

      const dbId = (layer as any)._dbId as string | undefined;
      const polylineData = toPolylineInsert(
        { id: (layer as any)._polylineId, coordinates, nodeTags },
        true
      );

      if (dbId) {
        (polylineData as any).id = dbId;
      } else {
        delete (polylineData as any).id;
      }

      polylinesToSave.push(polylineData);
    });

    if (polylinesToSave.length > 0) {
      const result = await saveRoutes(polylinesToSave);
      
      if (result.error) {
        console.error('Failed to save routes:', result.error);
        throw result.error;
      }
      
      if (result.data?.data) {
        result.data.data.forEach((savedPolyline) => {
          polylineLayers.current.forEach((layer) => {
            const coords = layer.getLatLngs() as L.LatLng[];
            const matchingPolyline = result.data!.data.find(p => {
              if (p.coordinates.length !== coords.length) return false;
              return p.coordinates.every((c, i) => 
                Math.abs(c[0] - coords[i].lat) < 0.0000001 &&
                Math.abs(c[1] - coords[i].lng) < 0.0000001
              );
            });
            
            if (matchingPolyline) {
              (layer as any)._dbId = matchingPolyline.id;
            }
          });
        });
      }
    }
    
    setHasUnsavedChanges(false);
  };

  useEffect(() => {
    if (!isDrawing) return;

    const drawnItems = new L.FeatureGroup();
    const nodeLayer = new L.LayerGroup();
    drawnItemsRef.current = drawnItems;
    nodeLayerRef.current = nodeLayer;
    
    nodeMarkersRef.current.clear();
    deletedPolylineIds.current.clear();
    
    map.addLayer(drawnItems);
    map.addLayer(nodeLayer);

    const snapIndicator = L.circleMarker([0, 0], {
      radius: 10,
      color: 'hsl(var(--m3-primary))',
      fillColor: 'hsl(var(--m3-primary))',
      fillOpacity: 0.3,
      weight: 3,
      opacity: 0,
    });
    snapIndicatorRef.current = snapIndicator;
    snapIndicator.addTo(map);

    /** Creates or updates a visual marker for a graph node */
    const updateNodeMarker = (node: GraphNode): void => {
      let marker = nodeMarkersRef.current.get(node.id);
      
      if (!marker) {
        marker = L.marker(node.latlng, { icon: createNodeIcon(node.tags) }).addTo(nodeLayer);
        marker.on('click', () => setSelectedNode?.(node));
        nodeMarkersRef.current.set(node.id, marker);
      } else {
        marker.setLatLng(node.latlng);
        marker.setIcon(createNodeIcon(node.tags));
      }
    };

    const removeNodeMarker = (nodeId: string): void => {
      const marker = nodeMarkersRef.current.get(nodeId);
      if (marker) {
        nodeLayer.removeLayer(marker);
        nodeMarkersRef.current.delete(nodeId);
      }
    };

    /** Loads existing routes from database and displays them in edit mode */
    const loadExistingRoutesForEditing = async (): Promise<void> => {
      const result = await fetchRoutes({ isPublic: true });
      
      if (result.error) {
        console.error('Failed to load routes for editing:', result.error);
        return;
      }

      const polylines = result.data?.data || result.data;
      
      if (!polylines || !Array.isArray(polylines) || polylines.length === 0) {
        return;
      }

      polylines.forEach(polyline => {
        const { latlngs } = deserializePolyline(polyline);
        
        const layer = L.polyline(latlngs, {
          color: 'hsl(var(--m3-primary))',
          weight: 4,
          opacity: 0.8,
        });

        (layer as any)._polylineId = polyline.id;
        (layer as any)._originalLatLngs = latlngs.map(ll => L.latLng(ll.lat, ll.lng));
        (layer as any)._dbId = polyline.id;
        
        drawnItems.addLayer(layer);
        polylineLayers.current.set(polyline.id, layer);

        latlngs.forEach(latlng => {
          const node = localGraphRef.current.findNodeAt(latlng);
          if (node) {
            updateNodeMarker(node);
          }
        });
      });
    };

    loadExistingRoutesForEditing();

    const drawControl = new L.Control.Draw({
      draw: {
        polyline: {
          shapeOptions: {
            color: 'hsl(var(--m3-primary))',
            weight: 4,
            opacity: 0.8,
          },
          metric: true,
          showLength: true,
        },
        polygon: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
        edit: {
          selectedPathOptions: {
            opacity: 0.3,
          } as any,
        },
      },
    });

    // Configure Leaflet Draw text/confirmations
    (L.drawLocal as any).draw.toolbar.buttons.polyline = 'Draw a route';
    (L.drawLocal as any).draw.handlers.polyline.tooltip.start = 'Click to start drawing a route';
    (L.drawLocal as any).draw.handlers.polyline.tooltip.cont = 'Click to continue drawing';
    (L.drawLocal as any).draw.handlers.polyline.tooltip.end = 'Click last point to finish';
    
    (L.drawLocal as any).edit.toolbar.buttons.edit = 'Edit routes';
    (L.drawLocal as any).edit.toolbar.buttons.editDisabled = 'No routes to edit';
    (L.drawLocal as any).edit.toolbar.buttons.remove = 'Delete routes';
    (L.drawLocal as any).edit.toolbar.buttons.removeDisabled = 'No routes to delete';
    
    (L.drawLocal as any).edit.handlers.edit.tooltip.text = 'Drag handles or markers to edit routes';
    (L.drawLocal as any).edit.handlers.edit.tooltip.subtext = 'Click cancel to undo changes';
    
    (L.drawLocal as any).edit.handlers.remove.tooltip.text = 'Click on a route to remove it';
    (L.drawLocal as any).edit.toolbar.actions.save.text = 'Save';
    (L.drawLocal as any).edit.toolbar.actions.save.title = 'Save changes';
    (L.drawLocal as any).edit.toolbar.actions.cancel.text = 'Cancel';
    (L.drawLocal as any).edit.toolbar.actions.cancel.title = 'Cancel editing, discard all changes';
    (L.drawLocal as any).edit.toolbar.actions.clearAll.text = 'Clear All';
    (L.drawLocal as any).edit.toolbar.actions.clearAll.title = 'Clear all routes';

    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    const SNAP_DISTANCE = 80;
    
    const findNearestNode = (latlng: L.LatLng): GraphNode | null => {
      let nearestNode: GraphNode | null = null;
      let minDistance = Infinity;

      localGraphRef.current.getNodes().forEach((node) => {
        const point1 = map.latLngToContainerPoint(latlng);
        const point2 = map.latLngToContainerPoint(node.latlng);
        const distance = point1.distanceTo(point2);

        if (distance < SNAP_DISTANCE && distance < minDistance) {
          minDistance = distance;
          nearestNode = node;
        }
      });

      return nearestNode;
    };

    const findNearestLinePoint = (latlng: L.LatLng): { latlng: L.LatLng; layer: L.Polyline; index: number } | null => {
      let nearestPoint: { latlng: L.LatLng; layer: L.Polyline; index: number } | null = null;
      let minDistance = Infinity;

      drawnItemsRef.current?.eachLayer((layer) => {
        if (layer instanceof L.Polyline) {
          const latlngs = layer.getLatLngs() as L.LatLng[];
          
          for (let i = 0; i < latlngs.length - 1; i++) {
            const p1 = map.latLngToContainerPoint(latlngs[i]);
            const p2 = map.latLngToContainerPoint(latlngs[i + 1]);
            const point = map.latLngToContainerPoint(latlng);

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const lengthSquared = dx * dx + dy * dy;

            if (lengthSquared === 0) continue;

            const t = Math.max(0, Math.min(1, ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lengthSquared));
            const closestX = p1.x + t * dx;
            const closestY = p1.y + t * dy;
            const distance = Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);

            if (distance < SNAP_DISTANCE && distance < minDistance) {
              minDistance = distance;
              const closestLatLng = map.containerPointToLatLng(L.point(closestX, closestY));
              nearestPoint = { latlng: closestLatLng, layer, index: i };
            }
          }
        }
      });

      return nearestPoint;
    };

    const showSnapIndicator = (latlng: L.LatLng, type: 'node' | 'line') => {
      if (snapIndicatorRef.current) {
        snapIndicatorRef.current.setLatLng(latlng);
        snapIndicatorRef.current.setStyle({ 
          opacity: 1,
          color: type === 'node' ? 'hsl(var(--m3-tertiary))' : 'hsl(var(--m3-primary))',
          fillColor: type === 'node' ? 'hsl(var(--m3-tertiary))' : 'hsl(var(--m3-primary))',
        });
      }
    };

    const hideSnapIndicator = (): void => {
      if (snapIndicatorRef.current) {
        snapIndicatorRef.current.setStyle({ opacity: 0 });
      }
    };

    /** Updates node tags in graph and refreshes marker visual */
    const updateNodeTags = (nodeId: string, tags: string[]): void => {
      localGraphRef.current.updateNodeTags(nodeId, tags);
      const node = localGraphRef.current.getNode(nodeId);
      if (node) {
        updateNodeMarker(node);
        setHasUnsavedChanges(true);
      }
    };

    const onCreated = (event: any): void => {
      const layer = event.layer;
      const polylineId = `polyline-${Date.now()}`;
      (layer as any)._polylineId = polylineId;
      drawnItems.addLayer(layer);

      if (layer instanceof L.Polyline) {
        const latlngs = layer.getLatLngs() as L.LatLng[];
        (layer as any)._originalLatLngs = latlngs.map(ll => L.latLng(ll.lat, ll.lng));
        
        polylineLayers.current.set(polylineId, layer);
        setHasUnsavedChanges(true);
        
        const { nodes } = localGraphRef.current.addPolyline(latlngs, polylineId);
        nodes.forEach(node => updateNodeMarker(node));
        localGraphRef.current.printStats();
      }
    };

    const onEdited = (event: any): void => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        if (layer instanceof L.Polyline) {
          let latlngs = layer.getLatLngs() as L.LatLng[];
          const polylineId = (layer as any)._polylineId as string;
          const originalLatLngs = (layer as any)._originalLatLngs || [];
          
          setHasUnsavedChanges(true);
          
          if (polylineId) {
            localGraphRef.current.removePolyline(polylineId);
            drawnItemsRef.current?.removeLayer(layer);
            
            const movedVertices = new Set<number>();
            latlngs.forEach((latlng, index) => {
              if (index < originalLatLngs.length) {
                const distance = latlng.distanceTo(originalLatLngs[index]);
                if (distance > 1) {
                  movedVertices.add(index);
                }
              }
            });
            
            const snappedLatLngs = latlngs.map((latlng, index) => {
              if (!movedVertices.has(index)) {
                return latlng;
              }
              
              const nearestNode = findNearestNode(latlng);
              if (nearestNode) {
                const nodePoint = map.latLngToContainerPoint(nearestNode.latlng);
                const vertexPoint = map.latLngToContainerPoint(latlng);
                const nodeDistance = nodePoint.distanceTo(vertexPoint);
                
                if (nodeDistance < 30) {
                  console.log(`✅ Vertex ${index} snapped to node (${nodeDistance.toFixed(1)}px)`);
                  showSnapIndicator(nearestNode.latlng, 'node');
                  return nearestNode.latlng;
                }
              }
              
              const nearestLine = findNearestLinePoint(latlng);
              if (nearestLine && nearestLine.layer !== layer) {
                console.log(`✅ Vertex ${index} snapped to line - inserting node`);
                showSnapIndicator(nearestLine.latlng, 'line');
                
                const existingLatLngs = nearestLine.layer.getLatLngs() as L.LatLng[];
                const existingPolylineId = (nearestLine.layer as any)._polylineId;
                
                existingLatLngs.splice(nearestLine.index + 1, 0, nearestLine.latlng);
                nearestLine.layer.setLatLngs(existingLatLngs);
                
                if (existingPolylineId) {
                  localGraphRef.current.removePolyline(existingPolylineId);
                  const { nodes: updatedNodes } = localGraphRef.current.addPolyline(existingLatLngs, existingPolylineId);
                  updatedNodes.forEach(node => updateNodeMarker(node));
                  const insertedNode = localGraphRef.current.findNodeAt(nearestLine.latlng);
                  if (insertedNode) {
                    return insertedNode.latlng;
                  }
                }
                
                return nearestLine.latlng;
              }
              
              return latlng;
            });
            
            layer.setLatLngs(snappedLatLngs);
            (layer as any)._originalLatLngs = snappedLatLngs.map(ll => L.latLng(ll.lat, ll.lng));
            drawnItemsRef.current?.addLayer(layer);
            
            const currentNodeIds = new Set(Array.from(localGraphRef.current.getNodes().keys()));
            nodeMarkersRef.current.forEach((marker, nodeId) => {
              if (!currentNodeIds.has(nodeId)) {
                removeNodeMarker(nodeId);
              }
            });
            
            const { nodes } = localGraphRef.current.addPolyline(snappedLatLngs, polylineId);
            nodes.forEach(node => updateNodeMarker(node));
            localGraphRef.current.printStats();
          }
        }
      });
    };

    const onDeleted = (event: any): void => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        const polylineId = (layer as any)._polylineId as string;
        const dbId = (layer as any)._dbId as string | undefined;
        
        if (polylineId) {
          if (dbId) {
            deletedPolylineIds.current.add(dbId);
          }
          
          localGraphRef.current.removePolyline(polylineId);
          polylineLayers.current.delete(polylineId);
          setHasUnsavedChanges(true);
          
          const currentNodeIds = new Set(Array.from(localGraphRef.current.getNodes().keys()));
          nodeMarkersRef.current.forEach((marker, nodeId) => {
            if (!currentNodeIds.has(nodeId)) {
              removeNodeMarker(nodeId);
            }
          });
          
          localGraphRef.current.printStats();
        }
      });
    };

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.EDITED, onEdited);
    map.on(L.Draw.Event.DELETED, onDeleted);

    map.on(L.Draw.Event.EDITSTART, () => {
      console.log('Edit mode started');
      hideSnapIndicator();
    });

    map.on(L.Draw.Event.EDITSTOP, () => {
      console.log('Edit mode stopped');
      hideSnapIndicator();
    });

    map.on('draw:editvertex', (e: any) => {
      const poly = e.poly;
      if (poly && poly instanceof L.Polyline) {
        const latlngs = poly.getLatLngs() as L.LatLng[];
        
        latlngs.forEach((latlng) => {
          const nearestNode = findNearestNode(latlng);
          if (nearestNode) {
            showSnapIndicator(nearestNode.latlng, 'node');
            return;
          }
          
          const nearestLine = findNearestLinePoint(latlng);
          if (nearestLine) {
            showSnapIndicator(nearestLine.latlng, 'line');
            return;
          }
        });
      }
    });

    (window as any).updateRouteNodeTags = updateNodeTags;
    (window as any).routeGraph = localGraphRef.current;

    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
      if (drawnItemsRef.current) {
        map.removeLayer(drawnItemsRef.current);
      }
      if (nodeLayerRef.current) {
        map.removeLayer(nodeLayerRef.current);
      }
      if (snapIndicatorRef.current) {
        map.removeLayer(snapIndicatorRef.current);
      }
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off(L.Draw.Event.EDITED, onEdited);
      map.off(L.Draw.Event.DELETED, onDeleted);
      map.off(L.Draw.Event.EDITSTART);
      map.off(L.Draw.Event.EDITSTOP);
      map.off('draw:editvertex');
      delete (window as any).updateRouteNodeTags;
      delete (window as any).routeGraph;
    };
  }, [isDrawing, map, setSelectedNode]);

  if (!isDrawing) return null;

  return (
    <div className="absolute top-44 right-4 z-[1000]">
      <SaveRoutesButton 
        onSave={handleSaveRoutes} 
        disabled={!hasUnsavedChanges}
      />
    </div>
  );
}

