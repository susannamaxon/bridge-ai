"use client";

import { useMemo, useState } from "react";
import FileUpload from "@/components/FileUpload";
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

  async function handleFilesSelected(files: File[]) {
    const results: ParsedCompetitionFile[] = [];
    for (const file of files) {
      const content = await file.text();
      results.push(parseCompetitionFile({ fileName: file.name, content }));
    }
    setParsedFiles(results);
    setSelectedPlayers([]);
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

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Bridge Analyzer</h1>
        <p className="text-zinc-400 mt-1">
          Upload competition result files to analyze player performance.
        </p>
      </div>

      <FileUpload onFilesSelected={handleFilesSelected} />

      {parsedFiles.some((f) => f.errors.length > 0) && (
        <div className="rounded-xl border border-red-800 bg-red-950 p-4 text-sm">
          <p className="font-medium text-red-400">Parse errors:</p>
          <ul className="mt-1 list-disc list-inside text-red-300">
            {parsedFiles
              .filter((f) => f.errors.length > 0)
              .flatMap((f) =>
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
