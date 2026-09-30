export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type CalendarEvent = {
  id: string;
  summary?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
};

// credentials: "include" makes the browser send/receive the express-session cookie cross-origin
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.message ?? `Request failed (${res.status})`);
  return data as T;
}

export const getStatus = () => request<{ google: boolean }>("/auth/status");

export const sendEmail = (p: { to: string; subject: string; body: string }) =>
  request<{ success: boolean; messageId: string }>("/gmail/send", {
    method: "POST",
    body: JSON.stringify(p),
  });

export const getEvents = () => request<CalendarEvent[]>("/calendar/events");

// Full-page redirect (not fetch): Google's consent screen must load in the browser
export const connectGoogle = () => {
  window.location.href = `${API_URL}/auth/google`;
};
