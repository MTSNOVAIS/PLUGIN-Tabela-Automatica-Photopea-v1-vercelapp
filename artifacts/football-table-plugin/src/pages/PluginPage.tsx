import { useState, useCallback, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const STORAGE_KEY = "football-plugin-state";

interface SavedState {
  layerConfig: LayerConfig;
  batchSize: number;
  lastLeagueId: string;
  lastSeasonId: string;
}

function loadState(): Partial<SavedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<SavedState>;
  } catch {
    return {};
  }
}

function saveState(state: Partial<SavedState>) {
  try {
    const current = loadState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...state }));
  } catch {
    // localStorage não disponível (não crítico)
  }
}

const saved = loadState();

const DEFAULT_CONFIG: LayerConfig = { groupPrefix: "", fieldMap: {} };

export default function PluginPage() {
  const { toast } = useToast();
  const [batchSize, setBatchSize] = useState<number>(saved.batchSize ?? 3);
  const [layerConfig, setLayerConfig] = useState<LayerConfig>(saved.layerConfig ?? DEFAULT_CONFIG);
  const [updateQueue, setUpdateQueue] = useState<TeamStanding[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"standings" | "mapper" | "queue">("standings");
  const [nextBatchIndex, setNextBatchIndex] = useState(0);
  const [updateProgress, setUpdateProgress] = useState<{ done: number; total: number } | null>(null);

  const { standings, isLoading, error, fetchStandings } = useSofascore();
  const { applyUpdates, isPhotopea } = usePhotopea();

  const currentRound = standings.length > 0
    ? Math.max(...standings.map(s => s.played))
    : null;

  // Persistir layerConfig
  useEffect(() => {
    saveState({ layerConfig });
  }, [layerConfig]);

  // Persistir batchSize
  useEffect(() => {
    saveState({ batchSize });
  }, [batchSize]);

  const handleLeagueChange = useCallback(async (leagueId: string, seasonId: string) => {
    saveState({ lastLeagueId: leagueId, lastSeasonId: seasonId });
    setUpdateQueue([]);
    setUpdatedCount(0);
    setNextBatchIndex(0);
    await fetchStandings(leagueId, seasonId);
  }, [fetchStandings]);

  const handleLayerConfigChange = useCallback((config: LayerConfig) => {
    setLayerConfig(config);
  }, []);

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

  const progress = standings.length > 0 ? (updatedCount / standings.length) * 100 : 0;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {currentRound !== null && (
        <header className="px-3 py-1.5 border-b border-border flex items-center justify-center">
          <span className="text-xs font-semibold text-muted-foreground">Rodada {currentRound}</span>
        </header>
      )}

      <div className="px-3 py-2 border-b border-border">
        <LeagueSelector
          onLeagueChange={handleLeagueChange}
          isLoading={isLoading}
          initialLeagueId={saved.lastLeagueId}
        />
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
            onConfigChange={handleLayerConfigChange}
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
    </div>
  );
}
