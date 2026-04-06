"use client";

import { useState } from "react";
import type { Competition, Partnership } from "@/types";
import BoardDrillDown from "./BoardDrillDown";

type CompetitionListProps = {
  competitions: Competition[];
  selectedPlayers: string[];
  filter: Partnership | "ALL";
};

type CompetitionRowProps = {
  competition: Competition;
  selectedPlayers: string[];
  filter: Partnership | "ALL";
};

function CompetitionRow({
  competition,
  selectedPlayers,
  filter,
}: CompetitionRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <div className="font-medium">{competition.fileName}</div>
          <div className="text-sm text-gray-500 mt-0.5">
            {competition.eventName && (
              <span className="mr-3">{competition.eventName}</span>
            )}
            {competition.date && (
              <span className="mr-3">{competition.date}</span>
            )}
            <span className="mr-3">{competition.boards.length} boards</span>
            <span>{competition.players.length} players</span>
          </div>
        </div>
        <span className="text-gray-400 ml-4 shrink-0">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4">
          <BoardDrillDown
            competition={competition}
            selectedPlayers={selectedPlayers}
            filter={filter}
          />
        </div>
      )}
    </div>
  );
}

export default function CompetitionList({
  competitions,
  selectedPlayers,
  filter,
}: CompetitionListProps) {
  if (competitions.length === 0) {
    return (
      <div className="rounded-2xl border p-6 text-sm text-gray-500">
        No competitions loaded yet.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        Competitions ({competitions.length})
      </h2>
      {competitions.map((competition) => (
        <CompetitionRow
          key={competition.id}
          competition={competition}
          selectedPlayers={selectedPlayers}
          filter={filter}
        />
      ))}
    </section>
  );
}
