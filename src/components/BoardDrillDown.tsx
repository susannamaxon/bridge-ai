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

function getRowStyle(
  board: BoardResult,
  selectedPlayers: string[]
): { className: string; textClass: string } {
  if (selectedPlayers.length === 0)
    return { className: "", textClass: "text-white" };

  const isSelectedDeclarer =
    board.declarerName != null && selectedPlayers.includes(board.declarerName);

  if (isSelectedDeclarer)
    return { className: "bg-yellow-500", textClass: "text-black" };

  const isNSPlayer =
    selectedPlayers.includes(board.north) ||
    selectedPlayers.includes(board.south);
  const isEWPlayer =
    selectedPlayers.includes(board.east) ||
    selectedPlayers.includes(board.west);

  const declarerIsNS =
    board.declarerSeat === "N" || board.declarerSeat === "S";

  const selectedPlayerIsDefender =
    (declarerIsNS && isEWPlayer) || (!declarerIsNS && isNSPlayer);

  if (selectedPlayerIsDefender && board.result != null && board.result < 0) {
    return { className: "bg-green-600", textClass: "text-white" };
  }

  const isGameContract =
    board.contract != null &&
    (board.contract.level >= 6 ||
      (board.contract.level === 5 &&
        (board.contract.strain === "C" || board.contract.strain === "D")) ||
      (board.contract.level === 4 &&
        (board.contract.strain === "H" || board.contract.strain === "S")) ||
      (board.contract.level === 3 && board.contract.strain === "NT"));

  if (
    selectedPlayerIsDefender &&
    isGameContract &&
    board.result != null &&
    board.result >= 0
  ) {
    return { className: "bg-red-700", textClass: "text-white font-bold" };
  }

  return { className: "", textClass: "text-white" };
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
            const { className, textClass } = getRowStyle(board, selectedPlayers);
            return (
              <tr
                key={`${board.boardNumber}-${board.pairIdNS}-${board.pairIdEW}-${i}`}
                className={`border-b border-zinc-800 last:border-0 ${className}`}
              >
                <td className={`py-1.5 pr-3 font-mono ${textClass}`}>{board.boardNumber}</td>
                <td className={`py-1.5 pr-3 font-mono font-medium ${textClass}`}>
                  {formatContract(board)}
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
            <span className="text-yellow-400">Yellow</span> = player declared{" · "}
            <span className="text-green-400">Green</span> = player defended and defeated contract{" · "}
            <span className="text-red-400 font-bold">Red</span> = missed opportunity (opponent made game)
          </>
        )}
      </p>
    </div>
  );
}
