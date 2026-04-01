export interface Team {
  id: number;
  name: string;
  shortName?: string;
  nameCode?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
}

export interface TeamStanding {
  position: number;
  team: Team;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string;
}

export interface League {
  id: string;
  name: string;
  country: string;
  slug: string;
  seasons: Season[];
}

export interface Season {
  id: string;
  name: string;
  year: string;
}

export type LayerType =
  | "position"
  | "team_name"
  | "team_short"
  | "points"
  | "played"
  | "wins"
  | "draws"
  | "losses"
  | "goals_for"
  | "goals_against"
  | "goal_diff";

export const LAYER_TYPE_LABELS: Record<LayerType, string> = {
  position: "Posição",
  team_name: "Nome do Time",
  team_short: "Nome Curto",
  points: "Pontos",
  played: "Jogos",
  wins: "Vitórias",
  draws: "Empates",
  losses: "Derrotas",
  goals_for: "Gols Pró",
  goals_against: "Gols Contra",
  goal_diff: "Saldo",
};

export const REQUIRED_FIELDS: LayerType[] = ["position", "team_name", "points", "played", "goal_diff"];
export const OPTIONAL_FIELDS: LayerType[] = ["wins", "draws", "losses", "goals_for", "goals_against", "team_short"];

export interface LayerConfig {
  groupPrefix: string;
  fieldMap: Partial<Record<LayerType, string>>;
}

export interface PsdScanResult {
  groups: string[];
  layerNames: string[];
  /** Maps position number → actual PSD group name (handles "01"/"1"/etc.) */
  groupMap: Record<number, string>;
}

export function getFieldValue(standing: TeamStanding, field: LayerType): string {
  switch (field) {
    case "position": return String(standing.position);
    case "team_name": return standing.team.name;
    case "team_short": return standing.team.shortName || standing.team.nameCode || standing.team.name.substring(0, 3).toUpperCase();
    case "points": return String(standing.points);
    case "played": return String(standing.played);
    case "wins": return String(standing.wins);
    case "draws": return String(standing.draws);
    case "losses": return String(standing.losses);
    case "goals_for": return String(standing.goalsFor);
    case "goals_against": return String(standing.goalsAgainst);
    case "goal_diff": return standing.goalDifference >= 0 ? `+${standing.goalDifference}` : String(standing.goalDifference);
    default: return "";
  }
}

export const POPULAR_LEAGUES: League[] = [
  // Brasil
  { id: "bra.1",  name: "Brasileirão Série A",    country: "Brasil",     slug: "bra.1",  seasons: [{ id: "current", name: "2026", year: "2026" }] },
  { id: "bra.2",  name: "Brasileirão Série B",    country: "Brasil",     slug: "bra.2",  seasons: [{ id: "current", name: "2026", year: "2026" }] },
  { id: "bra.3",  name: "Brasileirão Série C",    country: "Brasil",     slug: "bra.3",  seasons: [{ id: "current", name: "2026", year: "2026" }] },
  // Argentina
  { id: "arg.1",  name: "Liga Profesional",       country: "Argentina",  slug: "arg.1",  seasons: [{ id: "current", name: "2026", year: "2026" }] },
  // Chile
  { id: "chi.1",  name: "Primera División",       country: "Chile",      slug: "chi.1",  seasons: [{ id: "current", name: "2026", year: "2026" }] },
  // Colômbia
  { id: "col.1",  name: "Categoría Primera A",    country: "Colômbia",   slug: "col.1",  seasons: [{ id: "current", name: "2026", year: "2026" }] },
  // Peru
  { id: "per.1",  name: "Liga 1",                 country: "Peru",       slug: "per.1",  seasons: [{ id: "current", name: "2026", year: "2026" }] },
  // Equador
  { id: "ecu.1",  name: "Serie A",                country: "Equador",    slug: "ecu.1",  seasons: [{ id: "current", name: "2026", year: "2026" }] },
  // Uruguai
  { id: "uru.1",  name: "Primera División",       country: "Uruguai",    slug: "uru.1",  seasons: [{ id: "current", name: "2026", year: "2026" }] },
  // Paraguai
  { id: "par.1",  name: "División de Honor",      country: "Paraguai",   slug: "par.1",  seasons: [{ id: "current", name: "2026", year: "2026" }] },
  // Bolívia
  { id: "bol.1",  name: "División Profesional",   country: "Bolívia",    slug: "bol.1",  seasons: [{ id: "current", name: "2026", year: "2026" }] },
  // Venezuela
  { id: "ven.1",  name: "Primera División",       country: "Venezuela",  slug: "ven.1",  seasons: [{ id: "current", name: "2026", year: "2026" }] },
  // México
  { id: "mex.1",  name: "Liga MX",                country: "México",     slug: "mex.1",  seasons: [{ id: "current", name: "2025/26", year: "2026" }] },
  // EUA
  { id: "usa.1",  name: "MLS",                    country: "EUA",        slug: "usa.1",  seasons: [{ id: "current", name: "2026", year: "2026" }] },
  // Inglaterra
  { id: "eng.1",  name: "Premier League",         country: "Inglaterra", slug: "eng.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "eng.2",  name: "Championship",           country: "Inglaterra", slug: "eng.2",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Espanha
  { id: "esp.1",  name: "La Liga",                country: "Espanha",    slug: "esp.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "esp.2",  name: "La Liga 2",              country: "Espanha",    slug: "esp.2",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Itália
  { id: "ita.1",  name: "Serie A",                country: "Itália",     slug: "ita.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "ita.2",  name: "Serie B",                country: "Itália",     slug: "ita.2",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Alemanha
  { id: "ger.1",  name: "Bundesliga",             country: "Alemanha",   slug: "ger.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "ger.2",  name: "2. Bundesliga",          country: "Alemanha",   slug: "ger.2",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // França
  { id: "fra.1",  name: "Ligue 1",               country: "França",     slug: "fra.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "fra.2",  name: "Ligue 2",               country: "França",     slug: "fra.2",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Portugal
  { id: "por.1",  name: "Primeira Liga",          country: "Portugal",   slug: "por.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Holanda
  { id: "ned.1",  name: "Eredivisie",             country: "Holanda",    slug: "ned.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Bélgica
  { id: "bel.1",  name: "Pro League",             country: "Bélgica",    slug: "bel.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Escócia
  { id: "sco.1",  name: "Premiership",            country: "Escócia",    slug: "sco.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Turquia
  { id: "tur.1",  name: "Süper Lig",              country: "Turquia",    slug: "tur.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Rússia
  { id: "rus.1",  name: "Premier League",         country: "Rússia",     slug: "rus.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Grécia
  { id: "gre.1",  name: "Super League",           country: "Grécia",     slug: "gre.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Dinamarca
  { id: "den.1",  name: "Superliga",              country: "Dinamarca",  slug: "den.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Noruega
  { id: "nor.1",  name: "Eliteserien",            country: "Noruega",    slug: "nor.1",  seasons: [{ id: "current", name: "2025", year: "2025" }] },
  // Suécia
  { id: "swe.1",  name: "Allsvenskan",            country: "Suécia",     slug: "swe.1",  seasons: [{ id: "current", name: "2025", year: "2025" }] },
  // Suíça
  { id: "sui.1",  name: "Super League",           country: "Suíça",      slug: "sui.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Áustria
  { id: "aut.1",  name: "Bundesliga",             country: "Áustria",    slug: "aut.1",  seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
];
