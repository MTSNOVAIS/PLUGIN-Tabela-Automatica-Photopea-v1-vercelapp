import { useState } from "react";
import { Scan, Plus, Trash2, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LayerMapping, PhotopeaLayer, LayerType } from "@/types/football";
import { LAYER_TYPE_LABELS } from "@/types/football";

interface LayerMapperProps {
  layerMappings: LayerMapping[];
  onReadLayers: () => Promise<void>;
  onUpdateMappings: (mappings: LayerMapping[]) => void;
  standingsCount: number;
  isPhotopea: boolean;
}

export function LayerMapper({ layerMappings, onReadLayers, onUpdateMappings, standingsCount, isPhotopea }: LayerMapperProps) {
  const [allLayers, setAllLayers] = useState<PhotopeaLayer[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [newMapping, setNewMapping] = useState<{ position: string; layerPath: string; field: LayerType }>({
    position: "1",
    layerPath: "",
    field: "position",
  });

  const handleReadLayers = async () => {
    setIsReading(true);
    try {
      await onReadLayers();
    } finally {
      setIsReading(false);
    }
  };

  const handleAutoMap = () => {
    const total = standingsCount || 20;
    const autoMappings: LayerMapping[] = [];
    const fields: LayerType[] = ["position", "team_name", "points", "played", "wins", "draws", "losses", "goal_diff"];
    for (let pos = 1; pos <= total; pos++) {
      fields.forEach(field => {
        const layerName = `${field}_${pos}`;
        autoMappings.push({
          position: pos,
          layerName,
          field,
          layerPath: `Tabela/Linha_${pos}/${layerName}`,
        });
      });
    }
    onUpdateMappings(autoMappings);
  };

  const handleAddMapping = () => {
    if (!newMapping.position || !newMapping.layerPath) return;
    const mapping: LayerMapping = {
      position: Number(newMapping.position),
      layerName: newMapping.layerPath.split("/").pop() || newMapping.layerPath,
      field: newMapping.field,
      layerPath: newMapping.layerPath,
    };
    onUpdateMappings([...layerMappings, mapping]);
    setNewMapping(prev => ({ ...prev, layerPath: "" }));
  };

  const handleRemoveMapping = (index: number) => {
    onUpdateMappings(layerMappings.filter((_, i) => i !== index));
  };

  const textLayers = allLayers.filter(l => l.type === "text");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-border space-y-2">
        {!isPhotopea && (
          <div className="flex items-start gap-1.5 p-2 bg-yellow-50 rounded-md border border-yellow-200">
            <Info className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700">Em prévia: o mapeamento de layers funciona quando aberto dentro do Photopea.</p>
          </div>
        )}

        <div className="flex gap-1.5">
          <button
            onClick={handleReadLayers}
            disabled={isReading}
            className="flex-1 h-7 text-xs border border-border rounded-md flex items-center justify-center gap-1.5 hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Scan className="w-3.5 h-3.5" />
            {isReading ? "Lendo..." : "Ler Layers do PSD"}
          </button>
          <button
            onClick={handleAutoMap}
            className="flex-1 h-7 text-xs border border-border rounded-md flex items-center justify-center gap-1.5 hover:bg-muted transition-colors"
          >
            Auto-mapear
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          {layerMappings.length > 0 ? `${layerMappings.length} mapeamentos configurados` : "Configure quais layers do PSD recebem quais dados"}
        </p>
      </div>

      <div className="px-3 py-2 border-b border-border bg-muted/30">
        <p className="text-xs font-medium mb-1.5">Adicionar mapeamento</p>
        <div className="flex gap-1.5 flex-wrap">
          <Select value={newMapping.position} onValueChange={v => setNewMapping(p => ({ ...p, position: v }))}>
            <SelectTrigger className="h-7 text-xs w-16">
              <SelectValue placeholder="Pos" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: standingsCount || 20 }, (_, i) => i + 1).map(n => (
                <SelectItem key={n} value={String(n)} className="text-xs">{n}º</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={newMapping.field} onValueChange={v => setNewMapping(p => ({ ...p, field: v as LayerType }))}>
            <SelectTrigger className="h-7 text-xs w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LAYER_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {textLayers.length > 0 ? (
            <Select value={newMapping.layerPath} onValueChange={v => setNewMapping(p => ({ ...p, layerPath: v }))}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Selecionar layer..." />
              </SelectTrigger>
              <SelectContent>
                {textLayers.map(l => (
                  <SelectItem key={l.path} value={l.path} className="text-xs font-mono">{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <input
              type="text"
              placeholder="Caminho/do/Layer"
              value={newMapping.layerPath}
              onChange={e => setNewMapping(p => ({ ...p, layerPath: e.target.value }))}
              className="flex-1 h-7 text-xs px-2 border border-border rounded-md bg-background font-mono"
            />
          )}

          <button
            onClick={handleAddMapping}
            disabled={!newMapping.layerPath}
            className="h-7 w-7 flex items-center justify-center bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {layerMappings.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <p className="text-xs text-muted-foreground">Nenhum mapeamento. Use "Ler Layers" ou adicione manualmente.</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
              <tr>
                <th className="text-left px-2 py-1 text-muted-foreground font-medium w-8">Pos</th>
                <th className="text-left px-2 py-1 text-muted-foreground font-medium">Layer</th>
                <th className="text-left px-2 py-1 text-muted-foreground font-medium">Campo</th>
                <th className="w-6"></th>
              </tr>
            </thead>
            <tbody>
              {layerMappings.map((m, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-2 py-1 text-muted-foreground">{m.position}º</td>
                  <td className="px-2 py-1 font-mono truncate max-w-24" title={m.layerPath}>{m.layerName}</td>
                  <td className="px-2 py-1 text-muted-foreground">{LAYER_TYPE_LABELS[m.field]}</td>
                  <td className="px-1 py-1">
                    <button
                      onClick={() => handleRemoveMapping(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
