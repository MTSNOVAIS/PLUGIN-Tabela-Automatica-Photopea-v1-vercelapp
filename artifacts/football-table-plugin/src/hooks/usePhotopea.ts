import { useCallback } from "react";
import type { TeamStanding, LayerConfig, PsdScanResult } from "@/types/football";
import { getFieldValue } from "@/types/football";

function isInPhotopea(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function runScript(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Photopea script timeout"));
    }, 10000);

    function handler(event: MessageEvent) {
      if (event.source !== window.parent) return;
      clearTimeout(timeout);
      window.removeEventListener("message", handler);
      if (typeof event.data === "string") {
        resolve(event.data);
      } else if (event.data instanceof ArrayBuffer) {
        resolve("arraybuffer");
      } else {
        resolve(String(event.data ?? ""));
      }
    }

    window.addEventListener("message", handler);
    window.parent.postMessage(script, "*");
  });
}

/**
 * Scans the active PSD for numbered groups (1, 2, 3...) and collects
 * the text layer names from the first group found.
 */
function buildScanScript(prefix: string): string {
  const escapedPrefix = prefix.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `
(function() {
  function findNumberedGroups(container, prefix, depth) {
    var groups = [];
    if (depth > 5) return groups;
    for (var i = 0; i < container.layers.length; i++) {
      var layer = container.layers[i];
      if (layer.typename === "LayerSet") {
        var trimmed = layer.name.trim();
        var withoutPrefix = trimmed;
        if (prefix && trimmed.indexOf(prefix) === 0) {
          withoutPrefix = trimmed.slice(prefix.length).trim();
        }
        var num = parseInt(withoutPrefix, 10);
        if (!isNaN(num) && String(num) === withoutPrefix) {
          groups.push({ name: layer.name, num: num, ref: layer });
        } else {
          var nested = findNumberedGroups(layer, prefix, depth + 1);
          for (var j = 0; j < nested.length; j++) groups.push(nested[j]);
        }
      }
    }
    return groups;
  }

  function getTextLayerNames(group) {
    var names = [];
    for (var i = 0; i < group.layers.length; i++) {
      var l = group.layers[i];
      if (l.kind === LayerKind.TEXT) names.push(l.name);
      else if (l.typename === "LayerSet") {
        var sub = getTextLayerNames(l);
        for (var j = 0; j < sub.length; j++) names.push(sub[j]);
      }
    }
    return names;
  }

  var doc = app.activeDocument;
  var prefix = '${escapedPrefix}';
  var groups = findNumberedGroups(doc, prefix, 0);
  groups.sort(function(a, b) { return a.num - b.num; });

  var result = { groups: [], layerNames: [] };
  if (groups.length > 0) {
    result.groups = groups.map(function(g) { return g.name; });
    result.layerNames = getTextLayerNames(groups[0].ref);
  }
  app.echoToOE(JSON.stringify(result));
})();
`;
}

/**
 * Updates all text layers in the numbered groups based on LayerConfig.
 * No save is triggered — user controls when to save in Photopea.
 */
function buildUpdateScript(teams: TeamStanding[], config: LayerConfig): string {
  interface Update { groupName: string; layerName: string; value: string; }
  const updates: Update[] = [];

  for (const team of teams) {
    const groupName = config.groupPrefix
      ? `${config.groupPrefix}${team.position}`
      : String(team.position);

    for (const [field, layerName] of Object.entries(config.fieldMap)) {
      if (!layerName) continue;
      const value = getFieldValue(team, field as keyof typeof config.fieldMap);
      if (value === "") continue;
      updates.push({ groupName, layerName, value });
    }
  }

  if (updates.length === 0) return "";

  const updatesJSON = JSON.stringify(updates)
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`");

  return `
(function() {
  var doc = app.activeDocument;
  var updates = ${updatesJSON};

  function findGroup(container, name, depth) {
    if (depth > 6) return null;
    for (var i = 0; i < container.layers.length; i++) {
      var layer = container.layers[i];
      if (layer.typename === "LayerSet") {
        if (layer.name === name) return layer;
        var found = findGroup(layer, name, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  function updateTextLayer(container, layerName, value, depth) {
    if (depth > 4) return false;
    for (var i = 0; i < container.layers.length; i++) {
      var layer = container.layers[i];
      if (layer.name === layerName && layer.kind === LayerKind.TEXT) {
        layer.textItem.contents = value;
        return true;
      }
      if (layer.typename === "LayerSet") {
        if (updateTextLayer(layer, layerName, value, depth + 1)) return true;
      }
    }
    return false;
  }

  for (var i = 0; i < updates.length; i++) {
    var u = updates[i];
    var group = findGroup(doc, u.groupName, 0);
    if (group) {
      updateTextLayer(group, u.layerName, u.value, 0);
    }
  }

  app.echoToOE("ok");
})();
`;
}

const MOCK_SCAN: PsdScanResult = {
  groups: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"],
  layerNames: ["posicao", "nome", "pontos", "jogos", "vitorias", "empates", "derrotas", "saldo"],
};

export function usePhotopea() {
  const isPhotopea = isInPhotopea();

  const scanPsd = useCallback(async (prefix: string): Promise<PsdScanResult> => {
    if (!isPhotopea) {
      await new Promise(res => setTimeout(res, 400));
      return MOCK_SCAN;
    }
    const script = buildScanScript(prefix);
    const result = await runScript(script);
    try {
      return JSON.parse(result) as PsdScanResult;
    } catch {
      return { groups: [], layerNames: [] };
    }
  }, [isPhotopea]);

  const applyUpdates = useCallback(async (queue: TeamStanding[], config: LayerConfig) => {
    if (!isPhotopea) {
      await new Promise(res => setTimeout(res, 600));
      return;
    }

    const CHUNK = 5;
    for (let i = 0; i < queue.length; i += CHUNK) {
      const chunk = queue.slice(i, i + CHUNK);
      const script = buildUpdateScript(chunk, config);
      if (script) {
        await runScript(script);
        await new Promise(res => setTimeout(res, 60));
      }
    }
  }, [isPhotopea]);

  return { scanPsd, applyUpdates, isPhotopea };
}
