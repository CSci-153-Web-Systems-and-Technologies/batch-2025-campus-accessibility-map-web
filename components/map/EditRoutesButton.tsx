'use client';

import { FaRoute } from 'react-icons/fa';
import { useRouteDrawing } from './RouteDrawingContext';
import { useAdmin } from '@/lib/hooks/use-admin';

/** Button to toggle route drawing/editing mode (admin only) */
export function EditRoutesButton() {
  const { isDrawing, setDrawing } = useRouteDrawing();
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading || !isAdmin) return null;

  return (
    <button
      onClick={() => setDrawing(!isDrawing)}
      className={`absolute bottom-4 right-36 z-[1000] w-14 h-14 rounded-full shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-m3-primary focus:ring-offset-2 ${
        isDrawing
          ? 'bg-m3-tertiary text-m3-on-tertiary hover:bg-m3-tertiary/90'
          : 'bg-m3-primary text-m3-on-primary hover:bg-m3-primary-hover active:bg-m3-primary-pressed'
      }`}
      aria-label={isDrawing ? 'Stop Editing Routes' : 'Edit Routes'}
      title={isDrawing ? 'Stop Editing Routes' : 'Edit Route Network (Admin)'}
    >
      <FaRoute className="w-6 h-6" />
    </button>
  );
}
