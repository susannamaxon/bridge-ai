import type { PlayerStats } from "@/types";

type PlayerStatsPanelProps = {
  stats: PlayerStats[];
};

export default function PlayerStatsPanel({ stats }: PlayerStatsPanelProps) {
  if (stats.length === 0) return null;

  return (
    <section className="rounded-2xl border p-6">
      <h2 className="text-lg font-semibold mb-4">Player Statistics</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 pr-4 font-medium">Player</th>
              <th className="pb-2 pr-4 font-medium text-right">Competitions</th>
              <th className="pb-2 pr-4 font-medium text-right">Boards</th>
              <th className="pb-2 pr-4 font-medium text-right">As Declarer</th>
              <th className="pb-2 pr-4 font-medium text-right">Games Bid</th>
              <th className="pb-2 pr-4 font-medium text-right">Games Made</th>
              <th className="pb-2 pr-4 font-medium text-right">Defeated Opps</th>
              <th className="pb-2 font-medium text-right">Missed Opps</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.playerName} className="border-b last:border-0">
                <td className="py-2 pr-4 font-medium">{s.playerName}</td>
                <td className="py-2 pr-4 text-right">{s.competitionsPlayed}</td>
                <td className="py-2 pr-4 text-right">{s.boardsPlayed}</td>
                <td className="py-2 pr-4 text-right">{s.declarerCount}</td>
                <td className="py-2 pr-4 text-right">{s.gamePlayedCount}</td>
                <td className="py-2 pr-4 text-right">
                  <span
                    className={
                      s.gameMadeCount > 0 ? "text-green-700 font-medium" : ""
                    }
                  >
                    {s.gameMadeCount}
                  </span>
                  {s.gamePlayedCount > 0 && (
                    <span className="text-gray-400 ml-1">
                      ({Math.round((s.gameMadeCount / s.gamePlayedCount) * 100)}%)
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 text-right text-green-700 font-medium">
                  {s.contractsDefeatedCount}
                </td>
                <td className="py-2 text-right text-amber-600 font-medium">
                  {s.missedOpportunityCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
