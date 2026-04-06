"use client";

import { useMemo, useState } from "react";
import FileUpload from "@/components/FileUpload";
import UrlFetcher from "@/components/UrlFetcher";
import PlayerSelector from "@/components/PlayerSelector";
import PlayerStatsPanel from "@/components/PlayerStatsPanel";
import CompetitionList from "@/components/CompetitionList";
import { parseCompetitionFile } from "@/parser";
import { computePlayerStats } from "@/stats/computePlayerStats";
import type { ParsedCompetitionFile, Partnership, Player } from "@/types";

export default function HomePage() {
  const [parsedFiles, setParsedFiles] = useState<ParsedCompetitionFile[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [filter, setFilter] = useState<Partnership | "ALL">("ALL");

  function addParsed(fileName: string, content: string) {
    const parsed = parseCompetitionFile({ fileName, content });
    setParsedFiles((prev) => {
      // Replace if same fileName already loaded, otherwise append
      const exists = prev.findIndex(
        (f) => f.competition.fileName === fileName
      );
      if (exists !== -1) {
        const next = [...prev];
        next[exists] = parsed;
        return next;
      }
      return [...prev, parsed];
    });
  }

  async function handleFilesSelected(files: File[]) {
    const results: ParsedCompetitionFile[] = [];
    for (const file of files) {
      const content = await file.text();
      results.push(parseCompetitionFile({ fileName: file.name, content }));
    }
    setParsedFiles(results);
    setSelectedPlayers([]);
  }

  function handleUrlFetched(fileName: string, content: string) {
    addParsed(fileName, content);
  }

  const competitions = useMemo(
    () => parsedFiles.map((f) => f.competition),
    [parsedFiles]
  );

  const allPlayers = useMemo<Player[]>(() => {
    const seen = new Set<string>();
    const players: Player[] = [];
    for (const competition of competitions) {
      for (const player of competition.players) {
        if (!seen.has(player.name)) {
          seen.add(player.name);
          players.push(player);
        }
      }
    }
    return players.sort((a, b) => a.name.localeCompare(b.name));
  }, [competitions]);

  const playerStats = useMemo(
    () =>
      selectedPlayers.map((name) =>
        computePlayerStats(competitions, name, filter)
      ),
    [competitions, selectedPlayers, filter]
  );

  const hasData = competitions.length > 0;
  const parseErrors = parsedFiles.filter((f) => f.errors.length > 0);

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Bridge Analyzer</h1>
        <p className="text-zinc-400 mt-1">
          Upload competition result files or load from a URL to analyze player performance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FileUpload onFilesSelected={handleFilesSelected} />
        <UrlFetcher onFetched={handleUrlFetched} />
      </div>

      {parseErrors.length > 0 && (
        <div className="rounded-xl border border-red-800 bg-red-950 p-4 text-sm">
          <p className="font-medium text-red-400">Parse errors:</p>
          <ul className="mt-1 list-disc list-inside text-red-300">
            {parseErrors.flatMap((f) =>
              f.errors.map((e) => (
                <li key={`${f.competition.fileName}-${e.message}`}>
                  {f.competition.fileName}: {e.message}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {hasData && (
        <div className="flex gap-6 items-start">
          <div className="w-64 shrink-0">
            <PlayerSelector
              players={allPlayers}
              selectedNames={selectedPlayers}
              onSelectionChange={setSelectedPlayers}
              filter={filter}
              onFilterChange={(f) => {
                setFilter(f);
                setSelectedPlayers([]);
              }}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-6">
            {selectedPlayers.length > 0 && (
              <PlayerStatsPanel stats={playerStats} />
            )}
            <CompetitionList
              competitions={competitions}
              selectedPlayers={selectedPlayers}
              filter={filter}
            />
          </div>
        </div>
      )}
    </main>
  );
}
