"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 font-mono text-sm font-semibold text-white dark:bg-zinc-100 dark:text-black">
            D
          </span>
          <span>DigiYou</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-zinc-900 dark:hover:text-white ${
              pathname === "/" ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Home
          </Link>

          {user && (
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-zinc-900 dark:hover:text-white ${
                pathname === "/dashboard" ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Dashboard
            </Link>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Hi, <strong className="text-zinc-900 dark:text-zinc-50">{user.name}</strong>
              </span>
              <button
                onClick={logout}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
