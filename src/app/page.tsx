"use client";

import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "@/components/Sidebar";

interface Message {
  id?: string;
  role: string;
  content: string;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  const loadConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`);
      const data = await response.json();
      setMessages(data.messages || []);
      setCurrentConversationId(id);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  }, []);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (data.message) {
        const assistantMessage = {
          role: "assistant",
          content: data.message.content,
        };
        const allMessages = [...updatedMessages, assistantMessage];
        setMessages(allMessages);

        if (!currentConversationId) {
          const title =
            userMessage.content.length > 50
              ? userMessage.content.substring(0, 50) + "..."
              : userMessage.content;
          const createResponse = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              messages: allMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            }),
          });
          const conversation = await createResponse.json();
          setCurrentConversationId(conversation.id);
        } else {
          await fetch(`/api/conversations/${currentConversationId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userMessage),
          });
          await fetch(`/api/conversations/${currentConversationId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(assistantMessage),
          });
        }
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

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getMessageKey = (message: Message, index: number) => {
    return message.id || `msg-${index}-${message.role}`;
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentConversationId={currentConversationId}
        onSelectConversation={loadConversation}
        onNewConversation={handleNewConversation}
      />

      <div className="flex flex-col flex-1 min-h-screen lg:ml-64">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg lg:hidden"
          aria-label="Open sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        <main className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4 pb-48">
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
              <div className="mx-auto max-w-5xl space-y-4">
                {messages.map((m, i) => {
                  const msgKey = getMessageKey(m, i);
                  return (
                    <div
                      key={msgKey}
                      className={`rounded-lg px-6 py-4 ${
                        m.role === "user"
                          ? "ml-8 bg-blue-100 dark:bg-blue-900"
                          : "mr-8 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                        <span>
                          {m.role === "user" ? "You" : "Trip Architect"}
                        </span>
                        {m.role === "assistant" && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(m.content, msgKey)}
                              className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                              title="Copy to clipboard"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="h-4 w-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                                />
                              </svg>
                            </button>
                            {copiedId === msgKey && (
                              <div className="absolute bottom-full right-0 mb-2 rounded bg-zinc-800 px-2 py-1 text-xs text-white whitespace-nowrap">
                                Copied!
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="prose prose-zinc prose-sm dark:prose-invert max-w-none text-zinc-900 dark:text-zinc-50">
                        {m.role === "user" ? (
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ href, children }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                >
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  );
                })}
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

          <div className="fixed bottom-0 right-0 bg-gradient-to-t from-zinc-50 via-zinc-50/95 to-transparent pt-20 pb-6 dark:from-black dark:via-black/95 lg:left-64 left-0">
            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-6">
              <div className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                <input
                  className="flex-1 rounded-xl border-0 bg-transparent px-4 py-3 text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-0 dark:text-zinc-50 dark:placeholder-zinc-400"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Plan a trip to Tokyo for 3 days..."
                  disabled={isLoading}
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
    </div>
  );
}
