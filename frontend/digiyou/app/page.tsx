"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarEvent,
  connectGoogle,
  getEvents,
  getStatus,
  sendEmail,
} from "./lib/api";

type Notice = { type: "ok" | "error"; text: string } | null;

const card = "rounded-xl border border-slate-200 bg-white p-6 shadow-sm";
const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";
const primaryBtn =
  "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

export default function Home() {
  const [connected, setConnected] = useState<boolean | null>(null); // null = loading
  const [notice, setNotice] = useState<Notice>(null);

  // email form
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  // calendar
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      setEvents(await getEvents());
    } catch (e) {
      setNotice({ type: "error", text: (e as Error).message });
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // On load: read ?google=connected|error from the backend redirect, then check session status
  useEffect(() => {
    const flag = new URLSearchParams(window.location.search).get("google");
    if (flag === "error")
      setNotice({
        type: "error",
        text: "Google connection failed. Try again.",
      });
    if (flag) window.history.replaceState({}, "", "/"); // clean the URL

    getStatus()
      .then((s) => {
        setConnected(s.google);
        if (s.google) loadEvents();
      })
      .catch(() => {
        setConnected(false);
        setNotice({
          type: "error",
          text: "Can't reach the backend. Is it running?",
        });
      });
  }, [loadEvents]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setNotice(null);
    try {
      await sendEmail({ to, subject, body });
      setNotice({ type: "ok", text: `Email sent to ${to}` });
      setTo("");
      setSubject("");
      setBody("");
    } catch (err) {
      setNotice({ type: "error", text: (err as Error).message });
    } finally {
      setSending(false);
    }
  }

  const formatStart = (ev: CalendarEvent) => {
    const raw = ev.start?.dateTime ?? ev.start?.date;
    if (!raw) return "";
    return ev.start?.dateTime
      ? new Date(raw).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : new Date(raw).toLocaleDateString([], { dateStyle: "medium" }) +
          " (all day)";
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">
            Google Connect Demo
          </h1>
          <p className="text-sm text-slate-600">
            Gmail + Calendar through your backend&apos;s OAuth session.
          </p>
        </header>

        {notice && (
          <div
            role="status"
            className={`rounded-lg border px-4 py-3 text-sm ${
              notice.type === "ok"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {notice.text}
          </div>
        )}

        {/* Connection */}
        <section className={card}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium text-slate-900">Google account</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                <span
                  className={`h-2 w-2 rounded-full ${
                    connected
                      ? "bg-green-500"
                      : connected === null
                        ? "bg-slate-300"
                        : "bg-red-400"
                  }`}
                />
                {connected === null
                  ? "Checking…"
                  : connected
                    ? "Connected"
                    : "Not connected"}
              </p>
            </div>
            {connected === false && (
              <button onClick={connectGoogle} className={primaryBtn}>
                Connect Google
              </button>
            )}
          </div>
        </section>

        {connected && (
          <>
            {/* Send email */}
            <section className={card}>
              <h2 className="mb-4 font-medium text-slate-900">Send an email</h2>
              <form onSubmit={handleSend} className="space-y-3">
                <input
                  className={input}
                  type="email"
                  required
                  placeholder="To"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
                <input
                  className={input}
                  required
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <textarea
                  className={input}
                  required
                  rows={5}
                  placeholder="Message"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <button type="submit" disabled={sending} className={primaryBtn}>
                  {sending ? "Sending…" : "Send email"}
                </button>
              </form>
            </section>

            {/* Calendar */}
            <section className={card}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-medium text-slate-900">Calendar events</h2>
                <button
                  onClick={loadEvents}
                  disabled={loadingEvents}
                  className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
                >
                  {loadingEvents ? "Loading…" : "Refresh"}
                </button>
              </div>
              {events.length === 0 && !loadingEvents ? (
                <p className="text-sm text-slate-500">No events found.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {events.map((ev) => (
                    <li key={ev.id} className="py-3">
                      <a
                        href={ev.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-slate-900 hover:underline"
                      >
                        {ev.summary ?? "(No title)"}
                      </a>
                      <p className="text-xs text-slate-500">
                        {formatStart(ev)}
                        {ev.location ? ` · ${ev.location}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
