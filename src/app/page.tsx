"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message.content,
          },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-black">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Trip Architect</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Your AI-powered travel planning assistant
        </p>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-4 pb-48">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Plan your next adventure
                </h2>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Tell me where you want to go and I will help you plan the perfect trip.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
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
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="mr-12 rounded-lg bg-white px-4 py-3 dark:bg-zinc-900">
                  <div className="text-zinc-500 dark:text-zinc-400">Thinking...</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-50 via-zinc-50/95 to-transparent pt-20 pb-6 dark:from-black dark:via-black/95">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-6">
            <div className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
              <input
                className="flex-1 rounded-xl border-0 bg-transparent px-4 py-3 text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-0 dark:text-zinc-50 dark:placeholder-zinc-400"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Plan a trip to Tokyo for 3 days..."
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
