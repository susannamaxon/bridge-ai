import type {
  BoardResult,
  Competition,
  Contract,
  Partnership,
  PlayerStats,
  Seat,
} from "@/types";

function isGameContract(contract: Contract): boolean {
  const { level, strain } = contract;
  if (level >= 6) return true;
  if (level === 5 && (strain === "C" || strain === "D")) return true;
  if (level === 4 && (strain === "H" || strain === "S")) return true;
  if (level === 3 && strain === "NT") return true;
  return false;
}

type BoardRole = "declarer" | "defender" | "absent";

function getPlayerSeatOnBoard(
  board: BoardResult,
  playerName: string,
  filter: Partnership | "ALL"
): Seat | null {
  const checkNS = filter === "ALL" || filter === "NS";
  const checkEW = filter === "ALL" || filter === "EW";

  if (checkNS && board.north === playerName) return "N";
  if (checkNS && board.south === playerName) return "S";
  if (checkEW && board.east === playerName) return "E";
  if (checkEW && board.west === playerName) return "W";
  return null;
}

function getBoardRole(
  board: BoardResult,
  playerSeat: Seat
): BoardRole {
  if (!board.declarerSeat) return "defender";
  if (board.declarerSeat === playerSeat) return "declarer";

  // Player is on opposing side to declarer
  const declarerIsNS = board.declarerSeat === "N" || board.declarerSeat === "S";
  const playerIsNS = playerSeat === "N" || playerSeat === "S";

  return declarerIsNS !== playerIsNS ? "defender" : "absent";
}

export function computePlayerStats(
  competitions: Competition[],
  playerName: string,
  filter: Partnership | "ALL"
): PlayerStats {
  let boardsPlayed = 0;
  let declarerCount = 0;
  let defenderCount = 0;
  let gamePlayedCount = 0;
  let gameMadeCount = 0;
  let nonGameDeclaredCount = 0;
  let contractsDefeatedCount = 0;
  let missedOpportunityCount = 0;
  const competitionIds = new Set<string>();

  for (const competition of competitions) {
    let playedInCompetition = false;

    for (const board of competition.boards) {
      const playerSeat = getPlayerSeatOnBoard(board, playerName, filter);
      if (!playerSeat) continue;

      const role = getBoardRole(board, playerSeat);
      if (role === "absent") continue;

      playedInCompetition = true;
      boardsPlayed++;

      if (role === "declarer") {
        declarerCount++;
        if (board.contract) {
          if (isGameContract(board.contract)) {
            gamePlayedCount++;
            if (board.result != null && board.result >= 0) {
              gameMadeCount++;
            }
          } else {
            nonGameDeclaredCount++;
          }
        }
      } else {
        // defender
        defenderCount++;
        if (board.result != null && board.result < 0) {
          contractsDefeatedCount++;
        }
        if (
          board.contract &&
          isGameContract(board.contract) &&
          board.result != null &&
          board.result >= 0
        ) {
          missedOpportunityCount++;
        }
      }
    }

    if (playedInCompetition) {
      competitionIds.add(competition.id);
    }
  }

  return {
    playerName,
    filterPartnership: filter,
    competitionsPlayed: competitionIds.size,
    boardsPlayed,
    declarerCount,
    defenderCount,
    gamePlayedCount,
    gameMadeCount,
    nonGameDeclaredCount,
    contractsDefeatedCount,
    missedOpportunityCount,
  };
}

export function getPlayerBoardsInCompetition(
  competition: Competition,
  selectedPlayers: string[],
  filter: Partnership | "ALL"
): BoardResult[] {
  if (selectedPlayers.length === 0) return competition.boards;

  return competition.boards.filter((board) =>
    selectedPlayers.some((playerName) => {
      const seat = getPlayerSeatOnBoard(board, playerName, filter);
      if (!seat) return false;
      return getBoardRole(board, seat) !== "absent";
    })
  );
}
