"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, user } = useAuth();
  const router = useRouter();

  // If already logged in, redirect to dashboard
  if (user) {
    router.push("/Quiz");
  }

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Registration failed. Please try again.",
        );
      }

      // Successful registration
      register(data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create an Account
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enter your details below to create your account
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-transparent px-3.5 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-transparent px-3.5 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-transparent px-3.5 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-transparent px-3.5 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
          >
            {submitting ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
