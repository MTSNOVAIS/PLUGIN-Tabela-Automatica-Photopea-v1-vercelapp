import { useState } from "react";
import { Scan, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LayerConfig, PsdScanResult, LayerType } from "@/types/football";
import { LAYER_TYPE_LABELS, REQUIRED_FIELDS, OPTIONAL_FIELDS } from "@/types/football";

interface LayerMapperProps {
  config: LayerConfig;
  scanResult: PsdScanResult | null;
  isScanning: boolean;
  isPhotopea: boolean;
  onScan: (prefix: string) => Promise<void>;
  onConfigChange: (config: LayerConfig) => void;
}

const NONE = "__none__";

export function LayerMapper({ config, scanResult, isScanning, isPhotopea, onScan, onConfigChange }: LayerMapperProps) {
  const [showOptional, setShowOptional] = useState(false);

  const handleScan = () => {
    onScan(config.groupPrefix);
  };

  const handlePrefixChange = (value: string) => {
    onConfigChange({ ...config, groupPrefix: value });
  };

  const handleFieldMap = (field: LayerType, layerName: string) => {
    const newMap = { ...config.fieldMap };
    if (layerName === NONE) {
      delete newMap[field];
    } else {
      newMap[field] = layerName;
    }
    onConfigChange({ ...config, fieldMap: newMap });
  };

  const layerOptions = scanResult?.layerNames ?? [];
  const groupSummary = scanResult
    ? `${scanResult.groups.length} grupos detectados (${scanResult.groups.slice(0, 3).join(", ")}${scanResult.groups.length > 3 ? "..." : ""})`
    : null;

  const configuredCount = Object.values(config.fieldMap).filter(Boolean).length;

  function FieldRow({ field }: { field: LayerType }) {
    const current = config.fieldMap[field] ?? NONE;
    return (
      <div className="flex items-center gap-2 py-1.5 border-b border-border/40 last:border-0">
        <span className="text-xs text-foreground w-24 flex-shrink-0">{LAYER_TYPE_LABELS[field]}</span>
        {layerOptions.length > 0 ? (
          <Select value={current} onValueChange={v => handleFieldMap(field, v)}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue placeholder="Não mapear" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE} className="text-xs text-muted-foreground">— Não mapear —</SelectItem>
              {layerOptions.map(name => (
                <SelectItem key={name} value={name} className="text-xs font-mono">{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <input
            type="text"
            placeholder="Nome do layer..."
            value={current === NONE ? "" : current}
            onChange={e => handleFieldMap(field, e.target.value || NONE)}
            className="flex-1 h-7 text-xs px-2 border border-border rounded-md bg-background font-mono"
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {!isPhotopea && (
        <div className="mx-3 mt-2 flex items-start gap-1.5 p-2 bg-yellow-50 rounded-md border border-yellow-200">
          <Info className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">Em prévia: o escaneamento e a atualização funcionam quando aberto dentro do Photopea.</p>
        </div>
      )}

      <div className="px-3 py-2 border-b border-border space-y-2 mt-2">
        <p className="text-xs font-semibold text-foreground">1. Prefixo dos grupos</p>
        <p className="text-xs text-muted-foreground">
          Se os grupos são chamados só de "1", "2", "3"... deixe em branco. Se são "Time 1", "Time 2"... escreva "Time ".
        </p>
        <input
          type="text"
          placeholder='Ex: "Time " ou deixe vazio'
          value={config.groupPrefix}
          onChange={e => handlePrefixChange(e.target.value)}
          className="w-full h-7 text-xs px-2 border border-border rounded-md bg-background font-mono"
        />
      </div>

      <div className="px-3 py-2 border-b border-border space-y-2">
        <p className="text-xs font-semibold text-foreground">2. Escanear o PSD</p>
        <p className="text-xs text-muted-foreground">
          Detecta os grupos numerados e os nomes de layers de texto dentro deles.
        </p>
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="w-full h-7 text-xs border border-border rounded-md flex items-center justify-center gap-1.5 hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Scan className="w-3.5 h-3.5" />
          {isScanning ? "Escaneando..." : "Escanear PSD agora"}
        </button>
        {groupSummary && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">{groupSummary}</p>
        )}
        {scanResult && scanResult.groups.length === 0 && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
            Nenhum grupo numerado encontrado. Verifique o prefixo ou abra um PSD.
          </p>
        )}
      </div>

      <div className="px-3 py-2 border-b border-border space-y-1">
        <p className="text-xs font-semibold text-foreground mb-1">3. Mapear campos obrigatórios</p>
        {REQUIRED_FIELDS.map(field => <FieldRow key={field} field={field} />)}
      </div>

      <div className="px-3 py-2">
        <button
          onClick={() => setShowOptional(v => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
        >
          {showOptional ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Campos opcionais (Jogos, Vitórias, Saldo...)
        </button>
        {showOptional && (
          <div className="space-y-0">
            {OPTIONAL_FIELDS.map(field => <FieldRow key={field} field={field} />)}
          </div>
        )}
      </div>

      {configuredCount > 0 && (
        <div className="mx-3 mb-3 p-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs text-green-700 font-medium">{configuredCount} campo{configuredCount !== 1 ? "s" : ""} configurado{configuredCount !== 1 ? "s" : ""}</p>
          <p className="text-xs text-green-600 mt-0.5">
            {Object.entries(config.fieldMap).filter(([, v]) => v).map(([k, v]) => `${LAYER_TYPE_LABELS[k as LayerType]} → "${v}"`).join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}
