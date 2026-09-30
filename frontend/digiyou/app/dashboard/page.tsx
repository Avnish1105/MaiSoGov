"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function DashboardPage() {
  const { user, token, logout, loading } = useAuth();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleTestProtectedEndpoint = async () => {
    setTestingApi(true);
    setApiError(null);
    setApiResponse(null);

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Error ${res.status}: Failed to fetch protected resource`);
      }

      setApiResponse(data);
    } catch (err: any) {
      setApiError(err.message || "Failed to reach protected endpoint.");
    } finally {
      setTestingApi(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
          <span>Loading authentication state...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
            🔒
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Access Restricted</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You must be logged in to view this protected page.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-6 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            User Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Welcome, <span className="font-semibold text-zinc-900 dark:text-zinc-200">{user.name}</span>! You are successfully authenticated.
          </p>
        </div>
        <button
          onClick={logout}
          className="self-start md:self-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>

      {/* User Information Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>👤</span> Authenticated User Profile
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400">User ID (_id)</span>
              <p className="font-mono text-zinc-900 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg mt-1 break-all">
                {user.id}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400">Full Name</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg mt-1">
                {user.name}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400">Auth Status</span>
              <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                JWT Token Active
              </div>
            </div>
          </div>
        </div>

        {/* Token & Endpoint Verification */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span>🛡️</span> Protected API Verification
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Test sending the Bearer token to the backend endpoint <code className="rounded bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-800 dark:text-zinc-200">GET /api/auth/me</code>.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleTestProtectedEndpoint}
              disabled={testingApi}
              className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
            >
              {testingApi ? "Verifying Token..." : "Test GET /api/auth/me"}
            </button>

            {apiError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900">
                {apiError}
              </div>
            )}

            {apiResponse && (
              <div className="rounded-lg bg-zinc-100 dark:bg-zinc-900 p-3 space-y-1">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ Response 200 OK
                </span>
                <pre className="font-mono text-xs overflow-x-auto text-zinc-800 dark:text-zinc-200">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
