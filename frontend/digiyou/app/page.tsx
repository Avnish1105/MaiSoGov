"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-20 px-8 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert h-5 w-[100px]"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left my-8">
          <h1 className="max-w-md text-3xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
            Welcome to HumanTwin AI
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Your personal AI for decisions, goals, and everyday planning.
          </p>

          {!loading && (
            <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              {user ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span>✓</span> Logged in as {user.name}
                  </p>
                  <p className="text-xs text-zinc-500">Your HumanTwin AI assistant is ready.</p>
                </div>
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  You are currently not signed in. Sign in or create an account to talk with your HumanTwin.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row w-full sm:w-auto">
          {user ? (
            <Link
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 sm:w-auto font-semibold"
              href="/dashboard"
            >
              Open Twin Chat &rarr;
            </Link>
          ) : (
            <>
              <Link
                className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-6 text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 sm:w-auto font-semibold"
                href="/login"
              >
                Sign In
              </Link>
              <Link
                className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-zinc-300 px-6 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900 sm:w-auto font-semibold"
                href="/register"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
