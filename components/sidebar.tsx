"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/lib/hooks/use-theme';
import { useAdmin } from '@/lib/hooks/use-admin';
import { CgProfile } from 'react-icons/cg';
import { FaMap } from 'react-icons/fa';
import { IoSettings } from 'react-icons/io5';
import { FiLogOut } from 'react-icons/fi';
import { Shield, Menu, X } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Initialize theme system
  useTheme();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    if (!isMobileOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.sidebar-container') && !target.closest('.mobile-menu-button')) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen]);

  // Dispatch event when sidebar state changes (for map resize)
  useEffect(() => {
    const event = new CustomEvent('sidebar-toggle', { detail: { isOpen: isMobileOpen } });
    window.dispatchEvent(event);
  }, [isMobileOpen]);

  const baseLinkClasses =
    "flex items-center p-2 rounded-md transition-colors";

  const inactiveClasses = "text-m3-on-surface-variant hover:bg-m3-surface-variant";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear remember_me cookie on logout
    document.cookie = `remember_me=; path=/; max-age=0`;
    router.push('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="mobile-menu-button fixed top-2 left-2 sm:hidden z-[1001] w-10 h-10 rounded-lg bg-m3-surface border border-m3-outline text-m3-on-surface flex items-center justify-center shadow-lg hover:bg-m3-surface-variant transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[999] sm:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar-container group flex flex-col h-full border-r border-m3-outline bg-m3-surface overflow-hidden transition-all duration-300
          fixed
          top-0 left-0
          w-64 sm:w-16
          z-[1000]
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
          sm:hover:w-64`}
      >
        <nav className="flex-1 p-2 sm:p-3 space-y-2">
        <Link
          href="/"
          className={`${baseLinkClasses} ${
            pathname === "/"
              ? "bg-m3-primary text-m3-on-primary"
              : inactiveClasses
          }`}
        >
          <span className="flex w-10 items-center justify-center">
            <FaMap className="w-5 h-5" />
          </span>
          <span className="flex-1 overflow-hidden">
            <span className="block pl-1 whitespace-nowrap opacity-0 sm:group-hover:opacity-100 sm:opacity-0 opacity-100 transition-opacity duration-150">
              Map
            </span>
          </span>
        </Link>

        <Link
          href="/profile"
          className={`${baseLinkClasses} ${
            pathname === "/profile"
              ? "bg-m3-primary text-m3-on-primary"
              : inactiveClasses
          }`}
        >
          <span className="flex w-10 items-center justify-center">
            <CgProfile className="w-5 h-5" />
          </span>
          <span className="flex-1 overflow-hidden">
            <span className="block pl-1 whitespace-nowrap opacity-0 sm:group-hover:opacity-100 sm:opacity-0 opacity-100 transition-opacity duration-150">
              Profile
            </span>
          </span>
        </Link>

        <Link
          href="/settings"
          className={`${baseLinkClasses} ${
            pathname === "/settings"
              ? "bg-m3-primary text-m3-on-primary"
              : inactiveClasses
          }`}
        >
          <span className="flex w-10 items-center justify-center">
            <IoSettings className="w-5 h-5" />
          </span>
          <span className="flex-1 overflow-hidden">
            <span className="block pl-1 whitespace-nowrap opacity-0 sm:group-hover:opacity-100 sm:opacity-0 opacity-100 transition-opacity duration-150">
              Settings
            </span>
          </span>
        </Link>

        {isAdmin && (
          <Link
            href="/moderation"
            className={`${baseLinkClasses} ${
              pathname === "/moderation"
                ? "bg-m3-primary text-m3-on-primary"
                : inactiveClasses
            }`}
          >
            <span className="flex w-10 items-center justify-center">
              <Shield className="w-5 h-5" />
            </span>
            <span className="flex-1 overflow-hidden">
              <span className="block pl-1 whitespace-nowrap opacity-0 sm:group-hover:opacity-100 sm:opacity-0 opacity-100 transition-opacity duration-150">
                Moderation
              </span>
            </span>
          </Link>
        )}
      </nav>
      
      <div className="p-3 border-t border-m3-outline space-y-3">
        {/* Sign out button */}
        <button
          type="button"
          onClick={handleSignOut}
          className={`${baseLinkClasses} bg-m3-error text-m3-on-error hover:bg-m3-error-hover w-full`}
        >
          <span className="flex w-10 items-center justify-center">
            <FiLogOut className="w-5 h-5" />
          </span>
          <span className="flex-1 overflow-hidden">
            <span className="flex justify-start block pl-1 whitespace-nowrap font-medium opacity-0 sm:group-hover:opacity-100 sm:opacity-0 opacity-100 transition-opacity duration-150">
              Sign Out
            </span>
          </span>
        </button>
      </div>
    </div>
    </>
  );
}

