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

function getRowHighlight(
  board: BoardResult,
  selectedPlayers: string[]
): string {
  if (selectedPlayers.length === 0) return "";

  const isSelectedDeclarer =
    board.declarerName != null && selectedPlayers.includes(board.declarerName);

  if (isSelectedDeclarer) return "bg-yellow-50";

  // Check if a selected player was a defender who defeated the contract
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
    return "bg-green-50";
  }

  return "";
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
      <p className="text-sm text-gray-500 py-2">
        No boards found for the selected player(s) and filter.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
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
            const highlight = getRowHighlight(board, selectedPlayers);
            return (
              <tr
                key={`${board.boardNumber}-${board.pairIdNS}-${board.pairIdEW}-${i}`}
                className={`border-b last:border-0 ${highlight}`}
              >
                <td className="py-1.5 pr-3 font-mono">{board.boardNumber}</td>
                <td className="py-1.5 pr-3 font-mono font-medium">
                  {formatContract(board)}
                </td>
                <td className="py-1.5 pr-3">
                  {board.declarerName ?? board.declarerSeat ?? "-"}
                </td>
                <td className="py-1.5 pr-3 font-mono">
                  {formatResult(board)}
                </td>
                <td className="py-1.5 pr-3 text-right font-mono">
                  {board.score ?? "-"}
                </td>
                <td className="py-1.5 pr-3 text-xs">
                  {board.north} / {board.south}
                </td>
                <td className="py-1.5 text-xs">
                  {board.east} / {board.west}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-2">
        {boards.length} board{boards.length !== 1 ? "s" : ""} shown
        {selectedPlayers.length > 0 && " · Yellow = player declared · Green = player defended and defeated contract"}
      </p>
    </div>
  );
}
