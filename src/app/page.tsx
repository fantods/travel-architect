"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  const isLoading = status === "streaming";

  const getMessageContent = (message: (typeof messages)[0]) => {
    const textParts = message.parts.filter((p) => p.type === "text");
    return textParts.map((p) => ("text" in p ? p.text : "")).join("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-black">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Trip Architect
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Your AI-powered travel planning assistant
        </p>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Plan your next adventure
                </h2>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Tell me where you want to go and I will help you plan the
                  perfect trip.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg px-4 py-3 ${
                    m.role === "user"
                      ? "ml-12 bg-blue-100 dark:bg-blue-900"
                      : "mr-12 bg-white dark:bg-zinc-900"
                  }`}
                >
                  <div className="mb-1 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                    {m.role === "user" ? "You" : "Trip Architect"}
                  </div>
                  <div className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-50">
                    {getMessageContent(m)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="mr-12 rounded-lg bg-white px-4 py-3 dark:bg-zinc-900">
                  <div className="text-zinc-500 dark:text-zinc-400">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-black">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="flex gap-3">
              <input
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-400"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Plan a trip to Tokyo for 3 days..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
