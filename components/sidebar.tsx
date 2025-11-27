"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CgProfile } from 'react-icons/cg';
import { FaMap } from 'react-icons/fa';
import { IoSettings } from 'react-icons/io5';
import { FiLogOut, FiMoon, FiSun } from 'react-icons/fi';

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseLinkClasses =
    "flex items-center p-2 rounded-md transition-colors";

  const inactiveClasses = "text-muted-foreground hover:bg-muted";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="group flex flex-col h-full border-r border-gray-200 bg-white overflow-hidden transition-[width] duration-300 w-16 hover:w-64">
      <nav className="flex-1 p-3 space-y-2">
        <Link
          href="/map"
          className={`${baseLinkClasses} ${
            pathname === "/map"
              ? "bg-primary text-primary-foreground"
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
              ? "bg-primary text-primary-foreground"
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
              ? "bg-primary text-primary-foreground"
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
      
      <div className="p-3 border-t border-gray-200 space-y-3">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center px-2 py-2 text-sm rounded-md border bg-background hover:bg-muted text-foreground"
        >
          <span className="flex w-10 items-center justify-center">
            {mounted ? (
              theme === "dark" ? (
                <FiMoon className="w-4 h-4" />
              ) : (
                <FiSun className="w-4 h-4" />
              )
            ) : (
              <span className="w-4 h-4" />
            )}
          </span>
          <span className="flex-1 flex items-center justify-between overflow-hidden">
            <span className="block pl-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Dark mode
            </span>
            <span className="ml-2 flex items-center">
              {mounted ? (
                <span
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    theme === "dark" ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform ${
                      theme === "dark" ? "translate-x-4" : "translate-x-1"
                    }`}
                  />
                </span>
              ) : (
                <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-muted">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-background shadow translate-x-1" />
                </span>
              )}
            </span>
          </span>
        </button>

        {/* Sign out button */}
        <button
          type="button"
          onClick={handleSignOut}
          className={`${baseLinkClasses} bg-red-600 text-white hover:bg-red-700 w-full`}
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

