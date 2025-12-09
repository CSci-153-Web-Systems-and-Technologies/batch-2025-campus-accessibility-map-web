'use client';

import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';

interface SaveRoutesButtonProps {
  onSave: () => Promise<void>;
  disabled?: boolean;
}

/** Button to save all route polylines to the database */
export function SaveRoutesButton({ onSave, disabled }: SaveRoutesButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save routes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSave}
        disabled={disabled || isSaving}
        className={`shadow-lg rounded-full p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-m3-primary focus:ring-offset-2 ${
          disabled || isSaving
            ? 'bg-m3-surface-variant text-m3-on-surface-variant cursor-not-allowed opacity-50'
            : 'bg-m3-primary text-m3-on-primary hover:bg-m3-primary-hover active:bg-m3-primary-pressed active:scale-95'
        }`}
        title={disabled ? 'No changes to save' : 'Save routes to database'}
      >
        {isSaving ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Save className="w-6 h-6" />
        )}
      </button>
      
      {lastSaved && !isSaving && (
        <div className="bg-m3-surface text-m3-on-surface text-xs px-3 py-1 rounded-full shadow-md text-center whitespace-nowrap">
          Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}
