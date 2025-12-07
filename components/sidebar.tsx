"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/lib/hooks/use-theme';
import { CgProfile } from 'react-icons/cg';
import { FaMap } from 'react-icons/fa';
import { IoSettings } from 'react-icons/io5';
import { FiLogOut } from 'react-icons/fi';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // Initialize theme system
  useTheme();

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
    <div className="group flex flex-col h-full border-r border-m3-outline bg-m3-surface overflow-hidden transition-[width] duration-300 w-16 hover:w-64">
      <nav className="flex-1 p-3 space-y-2">
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
            <span className="block pl-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">
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
            <span className="block pl-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">
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
            <span className="block pl-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Settings
            </span>
          </span>
        </Link>
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
            <span className="flex justify-start block pl-1 whitespace-nowrap font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Sign Out
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

