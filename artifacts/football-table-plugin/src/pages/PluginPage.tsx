import { useState, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { LeagueSelector } from "@/components/LeagueSelector";
import { StandingsTable } from "@/components/StandingsTable";
import { UpdateQueue } from "@/components/UpdateQueue";
import { LayerMapper } from "@/components/LayerMapper";
import { useSofascore } from "@/hooks/useSofascore";
import { usePhotopea } from "@/hooks/usePhotopea";
import type { TeamStanding, LayerConfig } from "@/types/football";

const DEFAULT_CONFIG: LayerConfig = {
  groupPrefix: "",
  fieldMap: {},
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function PluginPage() {
  const { toast } = useToast();
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [batchSize, setBatchSize] = useState<number>(3);
  const [layerConfig, setLayerConfig] = useState<LayerConfig>(DEFAULT_CONFIG);
  const [updateQueue, setUpdateQueue] = useState<TeamStanding[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"standings" | "mapper" | "queue">("standings");
  const [nextBatchIndex, setNextBatchIndex] = useState(0);

  const { standings, isLoading, error, lastUpdated, fetchStandings } = useSofascore();
  const { applyUpdates, isPhotopea } = usePhotopea();

  const hasLeague = selectedLeague !== "";

  const currentRound = standings.length > 0
    ? Math.max(...standings.map(s => s.played))
    : null;

  const handleLeagueChange = useCallback(async (leagueId: string, seasonId: string) => {
    setSelectedLeague(leagueId);
    setSelectedSeason(seasonId);
    setUpdateQueue([]);
    setUpdatedCount(0);
    setNextBatchIndex(0);
    await fetchStandings(leagueId, seasonId);
  }, [fetchStandings]);

  const handleAddToQueue = useCallback((team: TeamStanding) => {
    setUpdateQueue(prev => {
      if (prev.find(t => t.position === team.position)) return prev;
      return [...prev, team].sort((a, b) => a.position - b.position);
    });
    toast({ title: "Adicionado à fila", description: `${team.team.name} (${team.position}º)` });
  }, [toast]);

  const handleAddBatch = useCallback(() => {
    if (!standings.length) return;

    setNextBatchIndex(prev => {
      const batch = standings.slice(prev, prev + batchSize);
      if (batch.length === 0) {
        toast({ title: "Fim da tabela", description: "Todas as posições já foram processadas", variant: "destructive" });
        return prev;
      }

      setUpdateQueue(q => {
        const queued = new Set(q.map(t => t.position));
        const toAdd = batch.filter(t => !queued.has(t.position));
        if (toAdd.length === 0) return q;

        const first = batch[0].position;
        const last = batch[batch.length - 1].position;
        toast({
          title: `${toAdd.length} posições adicionadas`,
          description: `Pos. ${first}${last !== first ? ` a ${last}` : ""}`,
        });

        return [...q, ...toAdd].sort((a, b) => a.position - b.position);
      });

      return prev + batchSize;
    });
  }, [standings, batchSize, toast]);

  const handleAddAll = useCallback(() => {
    setUpdateQueue([...standings].sort((a, b) => a.position - b.position));
    setNextBatchIndex(standings.length);
    toast({ title: "Todos adicionados", description: `${standings.length} equipes na fila` });
  }, [standings, toast]);

  const handleRemoveFromQueue = useCallback((position: number) => {
    setUpdateQueue(prev => prev.filter(t => t.position !== position));
  }, []);

  const handleClearQueue = useCallback(() => {
    setUpdateQueue([]);
    setUpdatedCount(0);
  }, []);

  const [updateProgress, setUpdateProgress] = useState<{ done: number; total: number } | null>(null);

  const handleApplyUpdates = useCallback(async () => {
    if (!updateQueue.length) {
      toast({ title: "Fila vazia", description: "Adicione posições à fila primeiro", variant: "destructive" });
      return;
    }
    const mappedFields = Object.values(layerConfig.fieldMap).filter(Boolean).length;
    if (mappedFields === 0 && isPhotopea) {
      toast({ title: "Nenhum campo mapeado", description: "Configure os layers na aba Layers primeiro", variant: "destructive" });
      return;
    }
    setIsUpdating(true);
    setUpdateProgress({ done: 0, total: updateQueue.length });
    const snapshot = [...updateQueue];
    try {
      await applyUpdates(snapshot, layerConfig, {}, (done, total) => {
        setUpdateProgress({ done, total });
      });
      setUpdatedCount(prev => prev + snapshot.length);
      toast({ title: "Atualização concluída!", description: `${snapshot.length} posições atualizadas no Photopea` });
      setUpdateQueue([]);
    } catch (err) {
      toast({ title: "Erro na atualização", description: String(err), variant: "destructive" });
    } finally {
      setIsUpdating(false);
      setUpdateProgress(null);
    }
  }, [updateQueue, layerConfig, applyUpdates, isPhotopea, toast]);

  void selectedSeason;

  const progress = standings.length > 0 ? (updatedCount / standings.length) * 100 : 0;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          {currentRound !== null && (
            <Badge variant="secondary" className="text-xs">Rodada {currentRound}</Badge>
          )}
        </div>
        <div className="flex-1 flex justify-end">
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground">
              Atualizado às {formatTime(lastUpdated)}
            </span>
          )}
        </div>
      </header>

      <div className="px-3 py-2 border-b border-border">
        <LeagueSelector onLeagueChange={handleLeagueChange} isLoading={isLoading} />
      </div>

      {updateProgress && (
        <div className="px-3 py-1.5 border-b border-border bg-blue-50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-700 font-medium">
              Atualizando {updateProgress.done}/{updateProgress.total}...
            </span>
            <Progress
              value={(updateProgress.done / updateProgress.total) * 100}
              className="flex-1 h-1.5"
            />
            <span className="text-xs text-blue-700">
              {Math.round((updateProgress.done / updateProgress.total) * 100)}%
            </span>
          </div>
        </div>
      )}
      {!updateProgress && standings.length > 0 && updatedCount > 0 && (
        <div className="px-3 py-1 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Progresso</span>
            <Progress value={progress} className="flex-1 h-1.5" />
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      {!hasLeague && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="text-4xl">⚽</div>
          <p className="text-sm font-medium text-foreground">Selecione uma liga</p>
          <p className="text-xs text-muted-foreground">
            Escolha um país e uma liga acima para carregar a tabela de classificação.
          </p>
        </div>
      )}

      {hasLeague && (
        <>
          <div className="flex border-b border-border">
            {(["standings", "mapper", "queue"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "standings" ? "Tabela" : tab === "mapper" ? "Layers" : `Fila (${updateQueue.length})`}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === "standings" && (
              <div className="flex flex-col h-full">
                {standings.length > 0 && (
                  <div className="px-3 py-2 border-b border-border flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Lote de</span>
                      <Select value={String(batchSize)} onValueChange={v => setBatchSize(Number(v))}>
                        <SelectTrigger className="h-6 w-14 text-xs px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 5, 10].map(n => (
                            <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <button
                      className="h-6 text-xs px-2 border border-border rounded-md hover:bg-muted transition-colors"
                      onClick={handleAddBatch}
                    >
                      Próximos {batchSize}
                    </button>
                    <button
                      className="h-6 text-xs px-2 border border-border rounded-md hover:bg-muted transition-colors"
                      onClick={handleAddAll}
                    >
                      Todos
                    </button>
                  </div>
                )}
                <StandingsTable
                  standings={standings}
                  isLoading={isLoading}
                  error={error}
                  onAddTeam={handleAddToQueue}
                  queuedPositions={updateQueue.map(t => t.position)}
                />
              </div>
            )}

            {activeTab === "mapper" && (
              <LayerMapper
                config={layerConfig}
                isPhotopea={isPhotopea}
                onConfigChange={setLayerConfig}
              />
            )}

            {activeTab === "queue" && (
              <UpdateQueue
                queue={updateQueue}
                onRemove={handleRemoveFromQueue}
                onClear={handleClearQueue}
                onApply={handleApplyUpdates}
                isUpdating={isUpdating}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
