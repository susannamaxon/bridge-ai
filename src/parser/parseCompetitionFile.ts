import type {
  BoardResult,
  Competition,
  ParsedCompetitionFile,
  ParseError,
  ParseWarning,
  Partnership,
  Player,
  Seat,
} from "@/types";

type ParseCompetitionFileInput = {
  fileName: string;
  content: string;
};

type SourceJsonEnvelope = {
  id?: string;
  jsonData?: string;
};

type SourceTotalscoreRow = {
  PairId?: string;
  Direction?: string;
  Names?: string;
  Table?: string;
  Rank?: string;
  TotalScoreMP?: string;
  TotalPercentage?: string;
  MemberID1?: string;
  MemberID2?: string;
};

type SourceJson = {
  meta?: {
    Licencee?: string;
    Created?: string;
    BoardCount?: string;
    PairCount?: string;
    TableCount?: string;
    RoundCount?: string;
    [key: string]: unknown;
  };
  boards?: SourceBoard[];
  totalscoretable?: SourceTotalscoreRow[];
  members?: unknown[];
  event?: string;
};

type SourceBoard = {
  nr?: string;
  dealer?: string;
  vulnerable?: string;
  deal?: unknown;
  scoretable?: SourceScoreRow[];
  optimumscore?: string;
  optimumcontract?: string;
  optimumresulttable?: unknown[];
};

type SourceScoreRow = {
  Table?: string;
  Round?: string;
  PairId_NS?: string;
  PairId_EW?: string;
  Contract?: string;
  Declarer?: string;
  Result?: string;
  Lead?: string;
  Score_NS?: string;
  Score_EW?: string;
  MP_NS?: string;
  MP_EW?: string;
  Percentage_NS?: string;
  Percentage_EW?: string;
};

function createCompetitionId(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/\s+/g, "-");
}

function buildEmptyCompetition(fileName: string): Competition {
  return {
    id: createCompetitionId(fileName),
    fileName,
    boards: [],
    players: [],
  };
}

function unwrapCompetitionJson(content: string): SourceJson {
  const outer = JSON.parse(content) as SourceJsonEnvelope | SourceJson;

  if (
    typeof outer === "object" &&
    outer !== null &&
    "jsonData" in outer &&
    typeof outer.jsonData === "string"
  ) {
    return JSON.parse(outer.jsonData) as SourceJson;
  }

  return outer as SourceJson;
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function splitPairNames(names: string | undefined): [string, string] | null {
  if (!names) return null;

  const cleaned = normalizeSpaces(names);
  const parts = cleaned.split(" - ").map((part) => normalizeSpaces(part));

  if (parts.length !== 2) {
    return null;
  }

  return [parts[0], parts[1]];
}

function buildPairNameMap(
  totalscoretable: SourceTotalscoreRow[] | undefined
): Map<string, [string, string]> {
  const pairMap = new Map<string, [string, string]>();

  if (!Array.isArray(totalscoretable)) {
    return pairMap;
  }

  for (const row of totalscoretable) {
    const pairId = row.PairId?.trim();
    const pairNames = splitPairNames(row.Names);

    if (!pairId || !pairNames) {
      continue;
    }

    pairMap.set(pairId, pairNames);
  }

  return pairMap;
}

function extractPlayersFromPairMap(
  pairNameMap: Map<string, [string, string]>
): Player[] {
  const uniqueNames = new Set<string>();

  for (const [, pair] of pairNameMap) {
    uniqueNames.add(pair[0]);
    uniqueNames.add(pair[1]);
  }

  return Array.from(uniqueNames)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
    }));
}

function parseSeat(value?: string): Seat | null {
  if (value === "N" || value === "E" || value === "S" || value === "W") {
    return value;
  }
  return null;
}

function inferPartnershipFromSeat(seat: Seat | null): Partnership | null {
  if (!seat) return null;
  return seat === "N" || seat === "S" ? "NS" : "EW";
}

function parseContract(
  contractText: string | undefined,
  declarerSeat: Seat | null
): BoardResult["contract"] {
  const normalized = (contractText ?? "").trim().toUpperCase();

  if (!normalized || normalized === "-" || normalized === "PASS") {
    return null;
  }

  if (!declarerSeat) {
    return null;
  }

  const match = normalized.match(/^([1-7])(N|S|H|D|C)(XX|X)?$/);
  if (!match) {
    return null;
  }

  const [, levelText, denominationText, doubledText = ""] = match;

  return {
    level: Number(levelText) as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    strain: (denominationText === "N" ? "NT" : denominationText) as
      | "C"
      | "D"
      | "H"
      | "S"
      | "NT",
    doubled: (doubledText || "") as "" | "X" | "XX",
    declarer: declarerSeat,
  };
}

function parseTricksTaken(resultText?: string): number | null {
  if (!resultText || resultText === "-" || resultText === "Bye") {
    return null;
  }

  const value = Number(resultText);
  return Number.isNaN(value) ? null : value;
}

function getTargetTricks(level: number): number {
  return level + 6;
}

function computeRelativeResult(
  contract: BoardResult["contract"],
  tricksTaken: number | null
): number | null {
  if (!contract || tricksTaken == null) {
    return null;
  }

  return tricksTaken - getTargetTricks(contract.level);
}

function parseScore(scoreNSText?: string, scoreEWText?: string): number | null {
  if (scoreNSText === "Bye" || scoreEWText === "Bye") {
    return null;
  }

  if (scoreNSText && scoreNSText !== "-") {
    const nsValue = Number(scoreNSText);
    return Number.isNaN(nsValue) ? null : nsValue;
  }

  if (scoreEWText && scoreEWText !== "-") {
    const ewValue = Number(scoreEWText);
    return Number.isNaN(ewValue) ? null : -ewValue;
  }

  return null;
}

function parseBoardNumber(value?: string): number {
  const boardNumber = Number(value);
  return Number.isNaN(boardNumber) ? 0 : boardNumber;
}

function getDeclarerName(board: BoardResult): string | null {
  switch (board.declarerSeat) {
    case "N":
      return board.north || null;
    case "S":
      return board.south || null;
    case "E":
      return board.east || null;
    case "W":
      return board.west || null;
    default:
      return null;
  }
}

function parseBoardScoreRow(
  board: SourceBoard,
  row: SourceScoreRow,
  pairNameMap: Map<string, [string, string]>
): BoardResult {
  const boardNumber = parseBoardNumber(board.nr);
  const declarerSeat = parseSeat(row.Declarer);
  const contract = parseContract(row.Contract, declarerSeat);
  const tricksTaken = parseTricksTaken(row.Result);
  const result = computeRelativeResult(contract, tricksTaken);
  const score = parseScore(row.Score_NS, row.Score_EW);

  const nsPair = row.PairId_NS ? pairNameMap.get(row.PairId_NS) ?? null : null;
  const ewPair = row.PairId_EW ? pairNameMap.get(row.PairId_EW) ?? null : null;

  const parsedBoard: BoardResult = {
    boardNumber,

    north: nsPair?.[0] ?? "",
    south: nsPair?.[1] ?? "",
    east: ewPair?.[0] ?? "",
    west: ewPair?.[1] ?? "",

    pairIdNS: row.PairId_NS ?? null,
    pairIdEW: row.PairId_EW ?? null,
    table: row.Table ?? null,
    round: row.Round ?? null,

    contract,
    tricksTaken,
    result,
    score,

    declarerName: null,
    declarerSeat,
    partnership: inferPartnershipFromSeat(declarerSeat),

    raw: {
      boardNumber: board.nr ?? null,
      dealer: board.dealer ?? null,
      vulnerable: board.vulnerable ?? null,
      optimumscore: board.optimumscore ?? null,
      optimumcontract: board.optimumcontract ?? null,
      scoreRow: row,
    },
  };

  parsedBoard.declarerName = getDeclarerName(parsedBoard);

  return parsedBoard;
}

export function parseCompetitionFile({
  fileName,
  content,
}: ParseCompetitionFileInput): ParsedCompetitionFile {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];

  let parsedJson: SourceJson;

  try {
    parsedJson = unwrapCompetitionJson(content);
  } catch {
    return {
      competition: buildEmptyCompetition(fileName),
      errors: [
        {
          message: "Invalid JSON file",
          severity: "error",
        },
      ],
      warnings,
    };
  }

  if (!Array.isArray(parsedJson.boards)) {
    return {
      competition: buildEmptyCompetition(fileName),
      errors: [
        {
          message: 'Missing or invalid "boards" array',
          severity: "error",
        },
      ],
      warnings,
    };
  }

  const pairNameMap = buildPairNameMap(parsedJson.totalscoretable);
  const boards: BoardResult[] = [];

  for (const board of parsedJson.boards) {
    const boardNumber = parseBoardNumber(board.nr);

    if (!Array.isArray(board.scoretable)) {
      warnings.push({
        message: `Board ${boardNumber || "?"} has no scoretable`,
        boardNumber: boardNumber || undefined,
        severity: "warning",
      });
      continue;
    }

    for (const row of board.scoretable) {
      boards.push(parseBoardScoreRow(board, row, pairNameMap));
    }
  }

  const competition: Competition = {
    id: createCompetitionId(fileName),
    fileName,
    eventName: parsedJson.event ?? parsedJson.meta?.Licencee,
    date: parsedJson.meta?.Created,
    boards,
    players: extractPlayersFromPairMap(pairNameMap),
  };

  return {
    competition,
    errors,
    warnings,
  };
}