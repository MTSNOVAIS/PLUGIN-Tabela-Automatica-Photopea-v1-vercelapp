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

/**
 * Sends a script to Photopea and waits for the echo response.
 * We call ONE script at a time and always await it before the next,
 * so there is never more than one listener active — no race conditions.
 */
function runScript(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Photopea timeout (15s)"));
    }, 15000);

    function handler(event: MessageEvent) {
      if (event.source !== window.parent) return;
      if (event.data instanceof ArrayBuffer) return; // skip binary exports
      clearTimeout(timeout);
      window.removeEventListener("message", handler);
      resolve(typeof event.data === "string" ? event.data : String(event.data ?? ""));
    }

    window.addEventListener("message", handler);
    window.parent.postMessage(script, "*");
  });
}

/**
 * Scans the active document for numbered groups.
 * Handles both "1","2"... AND "01","02"... naming (and with a prefix).
 * Returns the actual PSD group name for each position so updates
 * always use the exact name — never a recomputed one.
 */
function buildScanScript(groupPrefix: string): string {
  const esc = groupPrefix.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `
(function() {
  function findNumberedGroups(container, pfx, depth) {
    var found = [];
    if (depth > 6) return found;
    for (var i = 0; i < container.layers.length; i++) {
      var layer = container.layers[i];
      if (layer.typename !== "LayerSet") continue;
      var trimmed = layer.name.trim();
      var stripped = trimmed;
      if (pfx && trimmed.indexOf(pfx) === 0) stripped = trimmed.slice(pfx.length).trim();
      var num = parseInt(stripped, 10);
      // Accept "1" or "01" — isNaN guard + must be a positive integer
      if (!isNaN(num) && num > 0 && /^0*[1-9][0-9]*$/.test(stripped)) {
        found.push({ name: layer.name, num: num, ref: layer });
      } else {
        var sub = findNumberedGroups(layer, pfx, depth + 1);
        for (var j = 0; j < sub.length; j++) found.push(sub[j]);
      }
    }
    return found;
  }

  function collectTextNames(group) {
    var names = [];
    for (var i = 0; i < group.layers.length; i++) {
      var l = group.layers[i];
      if (l.kind === LayerKind.TEXT) {
        if (names.indexOf(l.name) === -1) names.push(l.name);
      } else if (l.typename === "LayerSet") {
        var sub = collectTextNames(l);
        for (var k = 0; k < sub.length; k++) {
          if (names.indexOf(sub[k]) === -1) names.push(sub[k]);
        }
      }
    }
    return names;
  }

  var doc = app.activeDocument;
  var groups = findNumberedGroups(doc, '${esc}', 0);
  groups.sort(function(a, b) { return a.num - b.num; });

  var result = { groups: [], layerNames: [], groupMap: {} };
  if (groups.length > 0) {
    for (var i = 0; i < groups.length; i++) {
      result.groups.push(groups[i].name);
      result.groupMap[groups[i].num] = groups[i].name;
    }
    result.layerNames = collectTextNames(groups[0].ref);
  }
  app.echoToOE(JSON.stringify(result));
})();
`;
}

/**
 * Builds a small, self-contained update script for ONE team.
 * Uses the exact PSD group name from the scan (groupMap) so
 * groups named "01" are found correctly even when position = 1.
 */
function buildUpdateScript(
  team: TeamStanding,
  config: LayerConfig,
  groupMap: Record<number, string>,
): string {
  // Prefer the actual scanned group name; fall back to computed name
  const actualGroupName =
    groupMap[team.position] ??
    (config.groupPrefix
      ? `${config.groupPrefix}${team.position}`
      : String(team.position));

  const updates: Array<{ ln: string; val: string }> = [];
  for (const [field, layerName] of Object.entries(config.fieldMap)) {
    if (!layerName) continue;
    const value = getFieldValue(team, field as keyof typeof config.fieldMap);
    if (value === "") continue;
    updates.push({ ln: layerName, val: value });
  }
  if (updates.length === 0) return "";

  function esc(s: string) {
    return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  const groupEsc = esc(actualGroupName);
  const updatesLiteral = updates
    .map(u => `{ln:'${esc(u.ln)}',val:'${esc(u.val)}'}`)
    .join(",");

  return `
(function() {
  var doc = app.activeDocument;
  var groupName = '${groupEsc}';
  var updates = [${updatesLiteral}];

  function findGroup(container, name, depth) {
    if (depth > 8) return null;
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

  function setTextLayer(container, layerName, value, depth) {
    if (depth > 6) return false;
    for (var i = 0; i < container.layers.length; i++) {
      var layer = container.layers[i];
      if (layer.name === layerName && layer.kind === LayerKind.TEXT) {
        layer.textItem.contents = value;
        return true;
      }
      if (layer.typename === "LayerSet") {
        if (setTextLayer(layer, layerName, value, depth + 1)) return true;
      }
    }
    return false;
  }

  var group = findGroup(doc, groupName, 0);
  if (group) {
    for (var i = 0; i < updates.length; i++) {
      setTextLayer(group, updates[i].ln, updates[i].val, 0);
    }
  }
  app.echoToOE("ok");
})();
`;
}

const MOCK_SCAN: PsdScanResult = {
  groups: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20"],
  layerNames: ["posicao","nome","pontos","jogos","vitorias","empates","derrotas","saldo"],
  groupMap: Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [i + 1, String(i + 1)])
  ),
};

export function usePhotopea() {
  const isPhotopea = isInPhotopea();

  const scanPsd = useCallback(async (prefix: string): Promise<PsdScanResult> => {
    if (!isPhotopea) {
      await new Promise(res => setTimeout(res, 400));
      return MOCK_SCAN;
    }
    const raw = await runScript(buildScanScript(prefix));
    try {
      const parsed = JSON.parse(raw) as PsdScanResult;
      return parsed;
    } catch {
      return { groups: [], layerNames: [], groupMap: {} };
    }
  }, [isPhotopea]);

  const applyUpdates = useCallback(async (
    queue: TeamStanding[],
    config: LayerConfig,
    groupMap: Record<number, string>,
    onProgress?: (done: number, total: number) => void,
  ) => {
    if (!isPhotopea) {
      for (let i = 0; i < queue.length; i++) {
        await new Promise(res => setTimeout(res, 80));
        onProgress?.(i + 1, queue.length);
      }
      return;
    }

    for (let i = 0; i < queue.length; i++) {
      const script = buildUpdateScript(queue[i], config, groupMap);
      if (script) {
        await runScript(script);
        await new Promise(res => setTimeout(res, 150));
      }
      onProgress?.(i + 1, queue.length);
    }
  }, [isPhotopea]);

  return { scanPsd, applyUpdates, isPhotopea };
}
