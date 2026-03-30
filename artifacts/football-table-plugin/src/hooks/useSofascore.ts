import { useState, useCallback } from "react";
import type { TeamStanding } from "@/types/football";

const PROXY_BASE = "/api/sofascore";

async function fetchWithFallback(url: string): Promise<Response> {
  const proxied = `${PROXY_BASE}?url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(proxied, {
      headers: { "Accept": "application/json" },
    });
    if (res.ok) return res;
  } catch {
    // fall through
  }
  return fetch(proxied);
}

function parseStandings(data: unknown): TeamStanding[] {
  try {
    const d = data as Record<string, unknown>;
    let rows: unknown[] = [];

    if (Array.isArray(d.standings)) {
      const group = d.standings[0] as Record<string, unknown>;
      rows = Array.isArray(group.rows) ? group.rows as unknown[] : [];
    } else if (Array.isArray(d.rows)) {
      rows = d.rows as unknown[];
    }

    return rows.map((row: unknown) => {
      const r = row as Record<string, unknown>;
      const team = r.team as Record<string, unknown>;
      const colors = (r.teamColors || team.teamColors) as Record<string, unknown> | undefined;
      return {
        position: Number(r.position),
        team: {
          id: Number(team.id),
          name: String(team.name),
          shortName: team.shortName ? String(team.shortName) : undefined,
          nameCode: team.nameCode ? String(team.nameCode) : undefined,
          colors: colors ? {
            primary: String(colors.primary || ""),
            secondary: String(colors.secondary || ""),
          } : undefined,
        },
        points: Number(r.points),
        played: Number(r.matches || r.played || 0),
        wins: Number(r.wins || 0),
        draws: Number(r.draws || 0),
        losses: Number(r.losses || 0),
        goalsFor: Number(r.scoresFor || r.goalsFor || 0),
        goalsAgainst: Number(r.scoresAgainst || r.goalsAgainst || 0),
        goalDifference: Number(r.goalDifference || r.gdiff || 0),
        form: r.promotion ? String(r.promotion) : undefined,
      };
    });
  } catch {
    return [];
  }
}

const MOCK_STANDINGS: TeamStanding[] = [
  { position: 1, team: { id: 1, name: "Flamengo", shortName: "FLA", nameCode: "FLA" }, points: 72, played: 38, wins: 22, draws: 6, losses: 10, goalsFor: 68, goalsAgainst: 42, goalDifference: 26 },
  { position: 2, team: { id: 2, name: "Palmeiras", shortName: "PAL", nameCode: "PAL" }, points: 70, played: 38, wins: 21, draws: 7, losses: 10, goalsFor: 65, goalsAgainst: 40, goalDifference: 25 },
  { position: 3, team: { id: 3, name: "Atletico MG", shortName: "CAM", nameCode: "CAM" }, points: 65, played: 38, wins: 19, draws: 8, losses: 11, goalsFor: 58, goalsAgainst: 44, goalDifference: 14 },
  { position: 4, team: { id: 4, name: "Fluminense", shortName: "FLU", nameCode: "FLU" }, points: 60, played: 38, wins: 17, draws: 9, losses: 12, goalsFor: 54, goalsAgainst: 45, goalDifference: 9 },
  { position: 5, team: { id: 5, name: "Botafogo", shortName: "BOT", nameCode: "BOT" }, points: 58, played: 38, wins: 16, draws: 10, losses: 12, goalsFor: 51, goalsAgainst: 46, goalDifference: 5 },
  { position: 6, team: { id: 6, name: "Gremio", shortName: "GRE", nameCode: "GRE" }, points: 55, played: 38, wins: 15, draws: 10, losses: 13, goalsFor: 48, goalsAgainst: 47, goalDifference: 1 },
  { position: 7, team: { id: 7, name: "Internacional", shortName: "INT", nameCode: "INT" }, points: 53, played: 38, wins: 14, draws: 11, losses: 13, goalsFor: 45, goalsAgainst: 48, goalDifference: -3 },
  { position: 8, team: { id: 8, name: "Sao Paulo", shortName: "SPF", nameCode: "SPF" }, points: 51, played: 38, wins: 13, draws: 12, losses: 13, goalsFor: 43, goalsAgainst: 49, goalDifference: -6 },
  { position: 9, team: { id: 9, name: "Corinthians", shortName: "COR", nameCode: "COR" }, points: 49, played: 38, wins: 13, draws: 10, losses: 15, goalsFor: 42, goalsAgainst: 51, goalDifference: -9 },
  { position: 10, team: { id: 10, name: "Santos", shortName: "SAN", nameCode: "SAN" }, points: 46, played: 38, wins: 12, draws: 10, losses: 16, goalsFor: 40, goalsAgainst: 53, goalDifference: -13 },
  { position: 11, team: { id: 11, name: "Cruzeiro", shortName: "CRU", nameCode: "CRU" }, points: 44, played: 38, wins: 11, draws: 11, losses: 16, goalsFor: 38, goalsAgainst: 54, goalDifference: -16 },
  { position: 12, team: { id: 12, name: "Vasco", shortName: "VAS", nameCode: "VAS" }, points: 43, played: 38, wins: 11, draws: 10, losses: 17, goalsFor: 37, goalsAgainst: 55, goalDifference: -18 },
  { position: 13, team: { id: 13, name: "Bragantino", shortName: "RBB", nameCode: "RBB" }, points: 42, played: 38, wins: 10, draws: 12, losses: 16, goalsFor: 40, goalsAgainst: 50, goalDifference: -10 },
  { position: 14, team: { id: 14, name: "Fortaleza", shortName: "FOR", nameCode: "FOR" }, points: 40, played: 38, wins: 10, draws: 10, losses: 18, goalsFor: 36, goalsAgainst: 56, goalDifference: -20 },
  { position: 15, team: { id: 15, name: "Bahia", shortName: "BAH", nameCode: "BAH" }, points: 38, played: 38, wins: 9, draws: 11, losses: 18, goalsFor: 34, goalsAgainst: 58, goalDifference: -24 },
  { position: 16, team: { id: 16, name: "Atletico GO", shortName: "ACG", nameCode: "ACG" }, points: 37, played: 38, wins: 9, draws: 10, losses: 19, goalsFor: 33, goalsAgainst: 60, goalDifference: -27 },
  { position: 17, team: { id: 17, name: "Coritiba", shortName: "CFC", nameCode: "CFC" }, points: 36, played: 38, wins: 9, draws: 9, losses: 20, goalsFor: 32, goalsAgainst: 62, goalDifference: -30 },
  { position: 18, team: { id: 18, name: "Goias", shortName: "GOI", nameCode: "GOI" }, points: 34, played: 38, wins: 8, draws: 10, losses: 20, goalsFor: 30, goalsAgainst: 63, goalDifference: -33 },
  { position: 19, team: { id: 19, name: "America MG", shortName: "AME", nameCode: "AME" }, points: 30, played: 38, wins: 7, draws: 9, losses: 22, goalsFor: 27, goalsAgainst: 68, goalDifference: -41 },
  { position: 20, team: { id: 20, name: "Criciuma", shortName: "CRI", nameCode: "CRI" }, points: 28, played: 38, wins: 6, draws: 10, losses: 22, goalsFor: 25, goalsAgainst: 70, goalDifference: -45 },
];

export function useSofascore() {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStandings = useCallback(async (leagueId: string, seasonId: string) => {
    if (!leagueId || !seasonId) return;
    setIsLoading(true);
    setError(null);
    try {
      const url = `https://www.sofascore.com/api/v1/unique-tournament/${leagueId}/season/${seasonId}/standings/total`;
      const res = await fetchWithFallback(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const parsed = parseStandings(json);
      if (parsed.length > 0) {
        setStandings(parsed);
      } else {
        setStandings(MOCK_STANDINGS);
        setError("Dados simulados (API indisponível)");
      }
    } catch {
      setStandings(MOCK_STANDINGS);
      setError("Usando dados simulados (verifique conexão)");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { standings, isLoading, error, fetchStandings };
}
