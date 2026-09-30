"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  feedback?: "up" | "down" | null;
}

const STARTER_SUGGESTIONS = [
  "Should I study or take a break?",
  "Help me plan today",
  "What should I prioritize?",
  "What if I skip studying today?",
];

const createMessageId = (sender: Message["sender"]) =>
  `${sender}-${crypto.randomUUID()}`;

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-ai-msg",
      sender: "ai",
      text: "Hi! I'm your HumanTwin. I can help you make decisions using your goals, preferences, routines and past choices.",
      timestamp: "Just now",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (
      textToSend !== undefined ? textToSend : inputValue
    ).trim();

    if (!messageText || isThinking) return;

    const userMessage: Message = {
      id: createMessageId("user"),
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);

    if (!textToSend) {
      setInputValue("");
    }

    setIsThinking(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const backendUrl = apiUrl.replace(/\/api\/?$/, "");
      const response = await fetch(`${backendUrl}/ai/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();

      console.log(data);

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      const aiMessage: Message = {
        id: createMessageId("ai"),
        sender: "ai",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        feedback: null,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage: Message = {
        id: createMessageId("ai"),
        sender: "ai",
        text: "Sorry, I couldn't connect to the HumanTwin.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        feedback: null,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFeedback = (messageId: string, type: "up" | "down") => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: msg.feedback === type ? null : type }
          : msg,
      ),
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 min-h-[70vh]">
        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
          <span>Connecting to your HumanTwin...</span>
        </div>
      </div>
    );
  }

  // Protected route check
  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 min-h-[70vh]">
        <div className="w-full max-w-md text-center space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            🔒
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Sign In to Meet Your Twin
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Please log in to access your personal HumanTwin AI decision
            assistant.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
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
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 flex-1 flex flex-col">
      {/* Top Welcome & Subtitle */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              HumanTwin AI
            </h1>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              Ready
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Your personal AI for decisions, goals and everyday planning.
          </p>
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-right">
          Twin active for{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">
            {user.name}
          </strong>
        </div>
      </div>

      {/* Main Grid: Chat Area + Twin Context Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 items-start">
        {/* MAIN CHAT AREA (3 Columns on Large Screens) */}
        <div className="lg:col-span-3 flex flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-sm overflow-hidden h-[calc(100vh-210px)] min-h-[520px]">
          {/* Starter Suggestions Bar */}
          <div className="p-3.5 bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Suggestions:
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(suggestion)}
                  className="rounded-full bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar Badge */}
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.sender === "user"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                        : "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-sm"
                    }`}
                  >
                    {msg.sender === "user"
                      ? user.name
                        ? user.name[0].toUpperCase()
                        : "U"
                      : "✨"}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-1.5">
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-normal rounded-tr-none"
                          : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-800 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Metadata & Feedback for AI */}
                    <div
                      className={`flex items-center gap-2 text-[11px] text-zinc-400 ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{msg.timestamp}</span>

                      {msg.sender === "ai" && (
                        <div className="flex items-center gap-1.5 ml-2 border-l border-zinc-200 dark:border-zinc-800 pl-2">
                          <span className="text-[10px] text-zinc-400">
                            Helpful?
                          </span>
                          <button
                            onClick={() => handleFeedback(msg.id, "up")}
                            className={`px-1 rounded transition-colors ${
                              msg.feedback === "up"
                                ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600"
                                : "hover:text-zinc-600 dark:hover:text-zinc-200"
                            }`}
                            title="Helpful"
                          >
                            👍
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, "down")}
                            className={`px-1 rounded transition-colors ${
                              msg.feedback === "down"
                                ? "bg-red-100 dark:bg-red-950/80 text-red-600"
                                : "hover:text-zinc-600 dark:hover:text-zinc-200"
                            }`}
                            title="Not helpful"
                          >
                            👎
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                  ✨
                </div>
                <div className="rounded-2xl rounded-tl-none bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span
                      className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                  <span className="text-xs">HumanTwin is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3.5 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your HumanTwin anything..."
                disabled={isThinking}
                className="flex-1 rounded-xl border border-zinc-300 bg-zinc-50 dark:bg-zinc-900/80 px-4 py-2.5 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100 dark:focus:ring-zinc-100 disabled:opacity-60 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isThinking}
                className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 shrink-0 shadow-sm"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* COMPACT HUMAN TWIN CONTEXT PANEL (1 Column on Large Screens) */}
        <div className="lg:col-span-1 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span>🧬</span> Your Twin
            </h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded">
              Profile
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* GOALS */}
            <div className="space-y-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 p-3 border border-zinc-200/70 dark:border-zinc-800/70">
              <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-[10px] flex items-center gap-1.5">
                <span>🎯</span> Goals
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 italic">
                Your goals will appear here
              </p>
            </div>

            {/* PREFERENCES */}
            <div className="space-y-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 p-3 border border-zinc-200/70 dark:border-zinc-800/70">
              <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-[10px] flex items-center gap-1.5">
                <span>⚙️</span> Preferences
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 italic">
                Your preferences will appear here
              </p>
            </div>

            {/* ROUTINE */}
            <div className="space-y-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 p-3 border border-zinc-200/70 dark:border-zinc-800/70">
              <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-[10px] flex items-center gap-1.5">
                <span>⏰</span> Routine
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 italic">
                Your routine will appear here
              </p>
            </div>

            {/* RECENT DECISIONS */}
            <div className="space-y-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 p-3 border border-zinc-200/70 dark:border-zinc-800/70">
              <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-[10px] flex items-center gap-1.5">
                <span>💡</span> Recent Decisions
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 italic">
                Your recent decisions will appear here
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-400 text-center">
            Personal memory sync & twin alignment active.
          </div>
        </div>
      </div>
    </div>
  );
}
