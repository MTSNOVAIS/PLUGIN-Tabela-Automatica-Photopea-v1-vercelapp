import { Trash2, Play, X } from "lucide-react";
import type { TeamStanding } from "@/types/football";

interface UpdateQueueProps {
  queue: TeamStanding[];
  onRemove: (position: number) => void;
  onClear: () => void;
  onApply: () => void;
  isUpdating: boolean;
}

export function UpdateQueue({ queue, onRemove, onClear, onApply, isUpdating }: UpdateQueueProps) {
  if (queue.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-center">
        <div className="space-y-2">
          <Play className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
          <p className="text-xs text-muted-foreground">Nenhuma posição na fila</p>
          <p className="text-xs text-muted-foreground/70">Adicione posições na aba Tabela</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{queue.length} posição(ões) para atualizar</span>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Limpar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {queue.map(team => (
          <div key={team.position} className="flex items-center px-3 py-1.5 border-b border-border/50 hover:bg-muted/30 transition-colors">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0">
              <span className="text-xs font-bold text-primary">{team.position}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{team.team.name}</div>
              <div className="text-xs text-muted-foreground">
                {team.points} pts · {team.played} J · {team.wins}V {team.draws}E {team.losses}D
              </div>
            </div>
            <button
              onClick={() => onRemove(team.position)}
              className="ml-2 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <button
          onClick={onApply}
          disabled={isUpdating}
          className="w-full h-9 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isUpdating ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Aplicar no Photopea ({queue.length})
            </>
          )}
        </button>
      </div>
    </div>
  );
}
