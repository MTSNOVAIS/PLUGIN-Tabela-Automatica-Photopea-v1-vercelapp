import { AlertCircle, Plus, Layers } from "lucide-react";
import type { TeamStanding } from "@/types/football";

interface StandingsTableProps {
  standings: TeamStanding[];
  isLoading: boolean;
  error: string | null;
  batchSize: number;
  onAddTeam: (team: TeamStanding) => void;
  onAddBatch: (startPos: number) => void;
  queuedPositions: number[];
}

export function StandingsTable({
  standings,
  isLoading,
  error,
  batchSize,
  onAddTeam,
  onAddBatch,
  queuedPositions,
}: StandingsTableProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Buscando dados do Sofascore...</p>
        </div>
      </div>
    );
  }

  if (!standings.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-center">
        <div className="space-y-2">
          <Layers className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
          <p className="text-xs text-muted-foreground">Selecione uma liga para ver a tabela</p>
        </div>
      </div>
    );
  }

  const batches = Math.ceil(standings.length / batchSize);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {error && (
        <div className="px-3 py-1.5 bg-yellow-50 border-b border-yellow-200 flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0" />
          <span className="text-xs text-yellow-700">{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <tr>
              <th className="text-left px-2 py-1 text-muted-foreground font-medium w-6">#</th>
              <th className="text-left px-2 py-1 text-muted-foreground font-medium">Time</th>
              <th className="text-center px-1 py-1 text-muted-foreground font-medium w-6">J</th>
              <th className="text-center px-1 py-1 text-muted-foreground font-medium w-6">V</th>
              <th className="text-center px-1 py-1 text-muted-foreground font-medium w-6">E</th>
              <th className="text-center px-1 py-1 text-muted-foreground font-medium w-6">D</th>
              <th className="text-center px-1 py-1 text-muted-foreground font-medium w-8">SG</th>
              <th className="text-center px-1 py-1 text-muted-foreground font-medium w-8 text-primary">Pts</th>
              <th className="w-8 px-1"></th>
            </tr>
          </thead>
          {standings.map((standing, idx) => {
              const isQueued = queuedPositions.includes(standing.position);
              const isBatchStart = idx % batchSize === 0;

              return (
                <tbody key={standing.position}>
                  {isBatchStart && batchSize > 1 && (
                    <tr className="bg-muted/30">
                      <td colSpan={9} className="py-0.5">
                        <button
                          onClick={() => onAddBatch(standing.position)}
                          className="w-full text-left px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          <Layers className="w-3 h-3" />
                          <span>Lote {Math.floor(idx / batchSize) + 1} de {batches} (pos. {standing.position}–{Math.min(standing.position + batchSize - 1, standings.length)})</span>
                        </button>
                      </td>
                    </tr>
                  )}
                  <tr
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${isQueued ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-2 py-1 font-medium text-muted-foreground">{standing.position}</td>
                    <td className="px-2 py-1">
                      <span className={`font-medium ${isQueued ? "text-primary" : ""}`}>
                        {standing.team.nameCode || standing.team.name.substring(0, 3).toUpperCase()}
                      </span>
                      <span className="text-muted-foreground ml-1 hidden sm:inline">{standing.team.name}</span>
                    </td>
                    <td className="px-1 py-1 text-center text-muted-foreground">{standing.played}</td>
                    <td className="px-1 py-1 text-center text-green-600">{standing.wins}</td>
                    <td className="px-1 py-1 text-center text-yellow-600">{standing.draws}</td>
                    <td className="px-1 py-1 text-center text-red-600">{standing.losses}</td>
                    <td className="px-1 py-1 text-center text-muted-foreground">
                      {standing.goalDifference >= 0 ? `+${standing.goalDifference}` : standing.goalDifference}
                    </td>
                    <td className="px-1 py-1 text-center font-bold text-primary">{standing.points}</td>
                    <td className="px-1 py-1">
                      <button
                        onClick={() => onAddTeam(standing)}
                        disabled={isQueued}
                        className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                          isQueued
                            ? "text-primary bg-primary/10 cursor-default"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        }`}
                        title={isQueued ? "Já na fila" : "Adicionar à fila"}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              );
            })}
          </table>
      </div>
    </div>
  );
}
