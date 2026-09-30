"use client";

import { useState } from "react";

const API_URL = "http://localhost:3000";

export default function Home() {
  const [message, setMessage] = useState<any>("");
  const [messages, setMessages] = useState<any>([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!message.trim() || loading) {
      return;
    }

    const userMessage = message;

    setMessages((prev: any) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await res.json();

      setMessages((prev: any) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error) {
      setMessages((prev: any) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: any) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="flex h-screen flex-col bg-gray-950 text-white">
      {/* Header */}

      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-xl font-semibold">Digital Twin</h1>

        <p className="text-sm text-gray-400">Your personal AI assistant</p>
      </header>

      {/* Messages */}

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {messages.length === 0 && (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="text-center">
                <h2 className="text-3xl font-semibold">How can I help?</h2>

                <p className="mt-2 text-gray-400">
                  Ask your digital twin anything.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg: any, index: number) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user" ? "bg-blue-600" : "bg-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-gray-800 px-4 py-3 text-gray-400">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input */}

      <div className="border-t border-gray-800 p-4">
        <div className="mx-auto flex max-w-3xl gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your digital twin..."
            rows={1}
            className="
                            flex-1 resize-none rounded-2xl
                            border border-gray-700
                            bg-gray-900
                            px-4 py-3
                            outline-none
                            focus:border-gray-500
                        "
          />

          <button
            onClick={sendMessage}
            disabled={loading || !message.trim()}
            className="
                            rounded-2xl
                            bg-white
                            px-5
                            font-medium
                            text-black
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                        "
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
