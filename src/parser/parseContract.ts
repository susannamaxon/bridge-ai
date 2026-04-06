import type { Contract, Seat, Strain, DoubledState } from "@/types";

export function parseSeat(value: string): Seat | null {
  if (value === "N" || value === "E" || value === "S" || value === "W") {
    return value;
  }
  return null;
}

export function parseContract(contractText: string, declarerSeat: Seat | null): Contract | null {
  const normalized = contractText.trim().toUpperCase();

  if (!normalized || normalized === "-" || normalized === "PASS") {
    return null;
  }

  if (!declarerSeat) {
    return null;
  }

  const match = normalized.match(/^([1-7])(N|S|H|D|C)(XX|X)?$/);
  if (!match) return null;

  const [, levelText, denomText, doubledText = ""] = match;

  const strain: Strain =
    denomText === "N" ? "NT" : (denomText as Exclude<Strain, "NT">);

  const doubled: DoubledState =
    doubledText === "XX" ? "XX" : doubledText === "X" ? "X" : "";

  return {
    level: Number(levelText) as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    strain,
    doubled,
    declarer: declarerSeat,
  };
}