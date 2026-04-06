// src/types/bridge.ts
export type Seat = "N" | "E" | "S" | "W";
export type Partnership = "NS" | "EW";
export type ContractLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Strain = "C" | "D" | "H" | "S" | "NT";
export type DoubledState = "" | "X" | "XX";

export interface Player {
  id: string;
  name: string;
}

export interface Contract {
  level: ContractLevel;
  strain: Strain;
  doubled: DoubledState;
  declarer: Seat;
}

export interface BoardResult {
  boardNumber: number;

  north: string;
  east: string;
  south: string;
  west: string;

  pairIdNS?: string | null;
  pairIdEW?: string | null;
  table?: string | null;
  round?: string | null;

  contract: Contract | null;
  tricksTaken: number | null;
  result: number | null;
  score: number | null;

  declarerName: string | null;
  declarerSeat: Seat | null;
  partnership: Partnership | null;

  raw?: Record<string, unknown>;
}

export interface Competition {
  id: string;
  fileName: string;
  eventName?: string;
  date?: string;
  boards: BoardResult[];
  players: Player[];
}

export interface ParseError {
  message: string;
  line?: number;
  boardNumber?: number;
  severity: "error";
}

export interface ParseWarning {
  message: string;
  line?: number;
  boardNumber?: number;
  severity: "warning";
}

export interface ParsedCompetitionFile {
  competition: Competition;
  errors: ParseError[];
  warnings: ParseWarning[];
}

export interface PlayerStats {
  playerName: string;
  filterPartnership: Partnership | "ALL";
  competitionsPlayed: number;
  boardsPlayed: number;
  declarerCount: number;
  defenderCount: number;
  gamePlayedCount: number;
  gameMadeCount: number;
  nonGameDeclaredCount: number;
  contractsDefeatedCount: number;
  missedOpportunityCount: number;
}
export interface JsonBoardScoreEntry {
  table: string;
  round: string;
  pairIdNS: string;
  pairIdEW: string;
  contract: string;
  declarer: string;
  result: string;
  lead: string;
  scoreNS: string;
  scoreEW: string;
  mpNS: string;
  mpEW: string;
  percentageNS: string;
  percentageEW: string;
}