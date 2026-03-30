import { useCallback } from "react";
import type { TeamStanding, LayerMapping, PhotopeaLayer } from "@/types/football";
import { getFieldValue } from "@/types/football";

declare global {
  interface Window {
    photopea?: {
      runScript: (script: string) => Promise<unknown>;
    };
  }
}

function isInPhotopea(): boolean {
  try {
    return window.self !== window.top && typeof window.photopea !== "undefined";
  } catch {
    return false;
  }
}

async function sendToPhotopea(script: string): Promise<unknown> {
  if (window.photopea) {
    return window.photopea.runScript(script);
  }
  return new Promise((resolve, reject) => {
    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "done") {
          window.removeEventListener("message", handler);
          resolve(data.result);
        } else if (data.type === "error") {
          window.removeEventListener("message", handler);
          reject(new Error(data.message));
        }
      } catch {
        // not our message
      }
    };
    window.addEventListener("message", handler);
    window.parent.postMessage({ type: "runScript", script }, "*");
    setTimeout(() => {
      window.removeEventListener("message", handler);
      resolve(null);
    }, 5000);
  });
}

function buildLayerReadScript(): string {
  return `
(function() {
  function collectLayers(doc, prefix) {
    var result = [];
    for (var i = 0; i < doc.layers.length; i++) {
      var layer = doc.layers[i];
      var path = prefix ? prefix + "/" + layer.name : layer.name;
      var type = "other";
      if (layer.kind === LayerKind.TEXT) type = "text";
      else if (layer.typename === "LayerSet") type = "group";
      result.push({ name: layer.name, type: type, path: path });
      if (layer.typename === "LayerSet") {
        var children = collectLayers(layer, path);
        for (var j = 0; j < children.length; j++) result.push(children[j]);
      }
    }
    return result;
  }
  var doc = app.activeDocument;
  var layers = collectLayers(doc, "");
  JSON.stringify(layers);
})();
`;
}

function buildUpdateScript(team: TeamStanding, mappings: LayerMapping[]): string {
  const teamMappings = mappings.filter(m => m.position === team.position);
  if (teamMappings.length === 0) return "";

  const updates = teamMappings.map(m => {
    const value = getFieldValue(team, m.field);
    const escapedPath = m.layerPath || m.layerName;
    const escapedValue = value.replace(/'/g, "\\'");
    return `
  try {
    var layer = findLayer(doc, '${escapedPath}');
    if (layer && layer.kind === LayerKind.TEXT) {
      layer.textItem.contents = '${escapedValue}';
    }
  } catch(e) {}`;
  }).join("\n");

  return `
(function() {
  function findLayer(container, path) {
    var parts = path.split('/');
    var current = container;
    for (var i = 0; i < parts.length; i++) {
      var found = false;
      for (var j = 0; j < current.layers.length; j++) {
        if (current.layers[j].name === parts[i]) {
          current = current.layers[j];
          found = true;
          break;
        }
      }
      if (!found) return null;
    }
    return current;
  }
  var doc = app.activeDocument;
  ${updates}
  'ok';
})();
`;
}

export function usePhotopea() {
  const isPhotopea = isInPhotopea();

  const readLayers = useCallback(async (): Promise<PhotopeaLayer[]> => {
    const script = buildLayerReadScript();
    try {
      const result = await sendToPhotopea(script);
      if (typeof result === "string") {
        return JSON.parse(result) as PhotopeaLayer[];
      }
      return [];
    } catch {
      if (!isPhotopea) {
        return [
          { name: "Tabela", type: "group", path: "Tabela" },
          { name: "Pos_1", type: "text", path: "Tabela/Linha_1/Pos_1" },
          { name: "Time_1", type: "text", path: "Tabela/Linha_1/Time_1" },
          { name: "Pts_1", type: "text", path: "Tabela/Linha_1/Pts_1" },
          { name: "Pos_2", type: "text", path: "Tabela/Linha_2/Pos_2" },
          { name: "Time_2", type: "text", path: "Tabela/Linha_2/Time_2" },
          { name: "Pts_2", type: "text", path: "Tabela/Linha_2/Pts_2" },
        ];
      }
      throw new Error("Erro ao ler layers do Photopea");
    }
  }, [isPhotopea]);

  const applyUpdates = useCallback(async (queue: TeamStanding[], mappings: LayerMapping[]) => {
    if (!isPhotopea) {
      await new Promise(res => setTimeout(res, 800));
      return;
    }
    for (const team of queue) {
      const script = buildUpdateScript(team, mappings);
      if (script) {
        await sendToPhotopea(script);
        await new Promise(res => setTimeout(res, 100));
      }
    }
    const saveScript = `
(function() {
  app.activeDocument.save();
  'saved';
})();
`;
    await sendToPhotopea(saveScript);
  }, [isPhotopea]);

  return { readLayers, applyUpdates, isPhotopea };
}
