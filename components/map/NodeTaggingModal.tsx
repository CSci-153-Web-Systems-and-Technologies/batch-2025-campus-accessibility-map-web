'use client';

import { useRouteDrawing } from './RouteDrawingContext';
import { useState, useEffect } from 'react';

const AVAILABLE_TAGS = [
  { id: 'has_stairs', label: 'Has Stairs', color: 'bg-m3-error' },
];

export function NodeTaggingModal({ onRouteHere }: { onRouteHere?: (nodeId: string) => void }) {
  const { selectedNode, setSelectedNode } = useRouteDrawing();
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (selectedNode) {
      setTags(selectedNode.tags || []);
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const toggleTag = (tagId: string) => {
    setTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = () => {
    if ((window as any).updateRouteNodeTags) {
      (window as any).updateRouteNodeTags(selectedNode.id, tags);
    }
    console.log('Saved tags:', selectedNode.id, tags);
    setSelectedNode(null);
  };

  const handleRouteHere = () => {
    if (onRouteHere) {
      onRouteHere(selectedNode.id);
      setSelectedNode(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-m3-surface rounded-lg shadow-xl w-[400px] flex flex-col border border-m3-outline">
        <div className="flex items-center justify-between p-4 border-b border-m3-outline">
          <h2 className="text-lg font-bold text-m3-on-surface">Tag Route Node</h2>
          <button
            onClick={() => setSelectedNode(null)}
            className="p-2 hover:bg-m3-surface-variant text-m3-on-surface rounded"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-sm text-m3-on-surface-variant mb-4">
            Select accessibility attributes for this node:
          </div>

          {AVAILABLE_TAGS.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-m3-surface-variant cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={tags.includes(tag.id)}
                onChange={() => toggleTag(tag.id)}
                className="w-5 h-5 rounded border-m3-outline text-m3-primary focus:ring-2 focus:ring-m3-primary"
              />
              <div className="flex items-center gap-2 flex-1">
                <div className={`w-3 h-3 rounded-full ${tag.color}`} />
                <span className="font-medium text-m3-on-surface">{tag.label}</span>
              </div>
            </label>
          ))}

          {tags.length === 0 && (
            <div className="text-sm text-m3-on-surface-variant italic mt-4">
              No tags selected - this node is fully accessible
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-m3-outline">
          {onRouteHere && (
            <button
              onClick={handleRouteHere}
              className="px-4 py-2 bg-m3-tertiary text-m3-on-tertiary rounded hover:bg-m3-tertiary/90 transition-colors"
            >
              Route Here
            </button>
          )}
          <button
            onClick={() => setSelectedNode(null)}
            className="px-4 py-2 text-m3-on-surface hover:bg-m3-surface-variant rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-m3-primary text-m3-on-primary rounded hover:bg-m3-primary-hover transition-colors"
          >
            Save Tags
          </button>
        </div>
      </div>
    </div>
  );
}
