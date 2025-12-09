'use client';

import { useState } from 'react';
import { useAdmin } from '@/lib/hooks/use-admin';

export function SetLocationButton({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-24 right-4 z-[1000] shadow-lg rounded-full p-4 transition-all ${
        isActive
          ? 'bg-m3-tertiary text-m3-on-tertiary'
          : 'bg-m3-primary text-m3-on-primary hover:bg-m3-primary-hover active:bg-m3-primary-pressed active:scale-95'
      }`}
      title={isActive ? "Click map to set location" : "Set my location"}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  );
}
