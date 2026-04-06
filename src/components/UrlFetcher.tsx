"use client";

import { useState } from "react";

type UrlFetcherProps = {
  onFetched: (fileName: string, content: string) => void;
};

const UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function extractId(input: string): string | null {
  const trimmed = input.trim();
  // Already a bare UUID
  if (UUID_REGEX.test(trimmed) && trimmed.length === 36) return trimmed;
  // URL containing a UUID
  const match = trimmed.match(UUID_REGEX);
  return match ? match[0] : null;
}

export default function UrlFetcher({ onFetched }: UrlFetcherProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    const id = extractId(input);
    if (!id) {
      setError("Could not find a tournament ID. Paste the full URL or just the UUID.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/fetch-tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? `Error ${res.status}`);
        return;
      }

      const fileName = json.filename ?? `${id}.json`;
      const content = JSON.stringify(json.data);
      onFetched(fileName, content);
      setInput("");
    } catch {
      setError("Network error — could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleFetch();
  }

  return (
    <section className="rounded-2xl border border-zinc-700 bg-zinc-950 p-6">
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Load from URL</h2>
          <p className="text-sm text-zinc-400">
            Paste a tournament URL or UUID to fetch the competition data.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="https://urslit.bridge.is/tournament/… or UUID"
            className="flex-1 rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleFetch}
            disabled={loading || !input.trim()}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Loading…" : "Load"}
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </section>
  );
}
