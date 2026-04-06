"use client";

import type { Partnership, Player } from "@/types";

type PlayerSelectorProps = {
  players: Player[];
  selectedNames: string[];
  onSelectionChange: (names: string[]) => void;
  filter: Partnership | "ALL";
  onFilterChange: (filter: Partnership | "ALL") => void;
};

export default function PlayerSelector({
  players,
  selectedNames,
  onSelectionChange,
  filter,
  onFilterChange,
}: PlayerSelectorProps) {
  function togglePlayer(name: string) {
    if (selectedNames.includes(name)) {
      onSelectionChange(selectedNames.filter((n) => n !== name));
    } else {
      onSelectionChange([...selectedNames, name]);
    }
  }

  function clearAll() {
    onSelectionChange([]);
  }

  return (
    <aside className="rounded-2xl border border-zinc-700 bg-zinc-950 p-4 space-y-4">
      <div>
        <h2 className="font-semibold text-lg text-white">Players</h2>
        <p className="text-sm text-zinc-400">{players.length} players found</p>
      </div>

      <div>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
          Position filter
        </p>
        <div className="flex gap-2">
          {(["ALL", "NS", "EW"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onFilterChange(option)}
              className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                filter === option
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-zinc-600 text-zinc-300 hover:border-blue-400"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Select players
          </p>
          {selectedNames.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-blue-400 hover:underline"
            >
              Clear ({selectedNames.length})
            </button>
          )}
        </div>

        <ul className="space-y-1 max-h-96 overflow-y-auto">
          {players.map((player) => {
            const isSelected = selectedNames.includes(player.name);
            return (
              <li key={player.id}>
                <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-zinc-800">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePlayer(player.name)}
                    className="rounded accent-blue-500"
                  />
                  <span className="text-sm text-white">{player.name}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
