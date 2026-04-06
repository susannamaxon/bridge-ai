import type { BoardResult, Competition, Partnership } from "@/types";
import { getPlayerBoardsInCompetition } from "@/stats/computePlayerStats";

type BoardDrillDownProps = {
  competition: Competition;
  selectedPlayers: string[];
  filter: Partnership | "ALL";
};

function formatContract(board: BoardResult): string {
  if (!board.contract) return "Pass";
  const { level, strain, doubled } = board.contract;
  return `${level}${strain}${doubled}`;
}

function formatResult(board: BoardResult): string {
  if (board.result == null) return "-";
  if (board.result === 0) return "=";
  return board.result > 0 ? `+${board.result}` : `${board.result}`;
}

function isGame(board: BoardResult): boolean {
  if (!board.contract) return false;
  const { level, strain } = board.contract;
  return (
    level >= 6 ||
    (level === 5 && (strain === "C" || strain === "D")) ||
    (level === 4 && (strain === "H" || strain === "S")) ||
    (level === 3 && strain === "NT")
  );
}

/** "boardNumber-NS" or "boardNumber-EW" where a game was made at any table. */
function buildGameMadeSet(allBoards: BoardResult[]): Set<string> {
  const set = new Set<string>();
  for (const b of allBoards) {
    if (isGame(b) && b.result != null && b.result >= 0 && b.partnership) {
      set.add(`${b.boardNumber}-${b.partnership}`);
    }
  }
  return set;
}

type ConsensusContract = { strain: string; level: number };

/**
 * For each board number, finds the most common (strain, level) combination
 * across all declarations at all tables.
 */
function buildConsensusMap(
  allBoards: BoardResult[]
): Map<number, ConsensusContract> {
  const counts = new Map<number, Map<string, number>>();

  for (const b of allBoards) {
    if (!b.contract) continue;
    const { level, strain } = b.contract;
    const key = `${level}-${strain}`;
    const boardMap = counts.get(b.boardNumber) ?? new Map<string, number>();
    counts.set(b.boardNumber, boardMap);
    boardMap.set(key, (boardMap.get(key) ?? 0) + 1);
  }

  const consensus = new Map<number, ConsensusContract>();
  for (const [boardNumber, boardMap] of counts) {
    let best = { strain: "", level: 0, count: 0 };
    for (const [key, count] of boardMap) {
      if (count > best.count) {
        const [lvl, str] = key.split("-");
        best = { strain: str, level: Number(lvl), count };
      }
    }
    if (best.strain) {
      consensus.set(boardNumber, { strain: best.strain, level: best.level });
    }
  }

  return consensus;
}

function isWrongContract(
  board: BoardResult,
  consensus: Map<number, ConsensusContract>
): boolean {
  if (!board.contract) return false;
  const c = consensus.get(board.boardNumber);
  if (!c) return false;
  // Wrong strain, OR correct strain but underbid by at least one level
  return (
    board.contract.strain !== c.strain ||
    board.contract.level < c.level
  );
}

function getRowStyle(
  board: BoardResult,
  selectedPlayers: string[],
  gameMadeElsewhere: Set<string>,
  consensusMap: Map<number, ConsensusContract>
): { className: string; textClass: string; showConsensus: boolean } {
  if (selectedPlayers.length === 0)
    return { className: "", textClass: "text-white", showConsensus: false };

  const isNSPlayer =
    selectedPlayers.includes(board.north) ||
    selectedPlayers.includes(board.south);
  const isEWPlayer =
    selectedPlayers.includes(board.east) ||
    selectedPlayers.includes(board.west);

  const playerSide: "NS" | "EW" | null = isNSPlayer
    ? "NS"
    : isEWPlayer
      ? "EW"
      : null;

  const isSelectedDeclarer =
    board.declarerName != null && selectedPlayers.includes(board.declarerName);

  // 1. Pink: player was declarer, their side didn't make game here, but the same side did at another table
  if (playerSide !== null && isSelectedDeclarer) {
    const playerSideMadeGameHere =
      board.partnership === playerSide &&
      isGame(board) &&
      board.result != null &&
      board.result >= 0;

    if (
      !playerSideMadeGameHere &&
      gameMadeElsewhere.has(`${board.boardNumber}-${playerSide}`)
    ) {
      return { className: "bg-pink-400", textClass: "text-black", showConsensus: true };
    }
  }

  // 2. Lilac: player declared a wrong contract vs the consensus
  if (isSelectedDeclarer && isWrongContract(board, consensusMap)) {
    return { className: "bg-violet-400", textClass: "text-black", showConsensus: true };
  }

  // 3. Yellow: player declared (correct contract)
  if (isSelectedDeclarer)
    return { className: "bg-yellow-500", textClass: "text-black", showConsensus: false };

  const declarerIsNS =
    board.declarerSeat === "N" || board.declarerSeat === "S";

  const selectedPlayerIsDefender =
    playerSide !== null &&
    ((declarerIsNS && playerSide === "EW") ||
      (!declarerIsNS && playerSide === "NS"));

  // 4. Green: player defended and defeated the contract
  if (selectedPlayerIsDefender && board.result != null && board.result < 0) {
    return { className: "bg-green-600", textClass: "text-white", showConsensus: false };
  }

  // 5. Red: player defended but opponent made a game
  if (
    selectedPlayerIsDefender &&
    isGame(board) &&
    board.result != null &&
    board.result >= 0
  ) {
    return { className: "bg-red-700", textClass: "text-white font-bold", showConsensus: false };
  }

  return { className: "", textClass: "text-white", showConsensus: false };
}

export default function BoardDrillDown({
  competition,
  selectedPlayers,
  filter,
}: BoardDrillDownProps) {
  const boards = getPlayerBoardsInCompetition(
    competition,
    selectedPlayers,
    filter
  );

  const gameMadeElsewhere = buildGameMadeSet(competition.boards);
  const consensusMap = buildConsensusMap(competition.boards);

  if (boards.length === 0) {
    return (
      <p className="text-sm text-zinc-400 py-2">
        No boards found for the selected player(s) and filter.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700 text-left text-zinc-400">
            <th className="pb-2 pr-3 font-medium">#</th>
            <th className="pb-2 pr-3 font-medium">Contract</th>
            <th className="pb-2 pr-3 font-medium">Declarer</th>
            <th className="pb-2 pr-3 font-medium">Result</th>
            <th className="pb-2 pr-3 font-medium text-right">Score</th>
            <th className="pb-2 pr-3 font-medium">NS Pair</th>
            <th className="pb-2 font-medium">EW Pair</th>
          </tr>
        </thead>
        <tbody>
          {boards.map((board, i) => {
            const { className, textClass, showConsensus } = getRowStyle(
              board,
              selectedPlayers,
              gameMadeElsewhere,
              consensusMap
            );
            const consensus = showConsensus ? consensusMap.get(board.boardNumber) : null;
            return (
              <tr
                key={`${board.boardNumber}-${board.pairIdNS}-${board.pairIdEW}-${i}`}
                className={`border-b border-zinc-800 last:border-0 ${className}`}
              >
                <td className={`py-1.5 pr-3 font-mono ${textClass}`}>{board.boardNumber}</td>
                <td className={`py-1.5 pr-3 font-mono font-medium ${textClass}`}>
                  {formatContract(board)}
                  {consensus && (
                    <span className="ml-1 font-normal opacity-70">
                      ({consensus.level}{consensus.strain})
                    </span>
                  )}
                </td>
                <td className={`py-1.5 pr-3 ${textClass}`}>
                  {board.declarerName ?? board.declarerSeat ?? "-"}
                </td>
                <td className={`py-1.5 pr-3 font-mono ${textClass}`}>
                  {formatResult(board)}
                </td>
                <td className={`py-1.5 pr-3 text-right font-mono ${textClass}`}>
                  {board.score ?? "-"}
                </td>
                <td className={`py-1.5 pr-3 text-xs ${textClass}`}>
                  {board.north} / {board.south}
                </td>
                <td className={`py-1.5 text-xs ${textClass}`}>
                  {board.east} / {board.west}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-zinc-500 mt-2">
        {boards.length} board{boards.length !== 1 ? "s" : ""} shown
        {selectedPlayers.length > 0 && (
          <>
            {" · "}
            <span className="text-pink-400">Pink</span> = same side made game at another table{" · "}
            <span className="text-violet-400">Lilac</span> = wrong contract vs consensus{" · "}
            <span className="text-yellow-400">Yellow</span> = player declared{" · "}
            <span className="text-green-400">Green</span> = player defended and defeated contract{" · "}
            <span className="text-red-400 font-bold">Red</span> = missed opportunity (opponent made game)
          </>
        )}
      </p>
    </div>
  );
}
