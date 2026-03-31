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
  { id: "bra.1", name: "Brasileirão Série A", country: "Brasil", slug: "bra.1", seasons: [{ id: "current", name: "2026", year: "2026" }] },
  { id: "bra.2", name: "Brasileirão Série B", country: "Brasil", slug: "bra.2", seasons: [{ id: "current", name: "2026", year: "2026" }] },
  { id: "bra.3", name: "Brasileirão Série C", country: "Brasil", slug: "bra.3", seasons: [{ id: "current", name: "2026", year: "2026" }] },
  // América do Sul
  { id: "arg.1", name: "Liga Profesional", country: "Argentina", slug: "arg.1", seasons: [{ id: "current", name: "2025", year: "2025" }] },
  { id: "col.1", name: "Liga BetPlay", country: "Colômbia", slug: "col.1", seasons: [{ id: "current", name: "2025", year: "2025" }] },
  { id: "chi.1", name: "Primera División", country: "Chile", slug: "chi.1", seasons: [{ id: "current", name: "2025", year: "2025" }] },
  { id: "uru.1", name: "Primera División", country: "Uruguai", slug: "uru.1", seasons: [{ id: "current", name: "2025", year: "2025" }] },
  { id: "ecu.1", name: "Liga Pro", country: "Equador", slug: "ecu.1", seasons: [{ id: "current", name: "2025", year: "2025" }] },
  { id: "per.1", name: "Liga 1", country: "Peru", slug: "per.1", seasons: [{ id: "current", name: "2025", year: "2025" }] },
  { id: "bol.1", name: "División Profesional", country: "Bolívia", slug: "bol.1", seasons: [{ id: "current", name: "2025", year: "2025" }] },
  { id: "par.1", name: "División Profesional", country: "Paraguai", slug: "par.1", seasons: [{ id: "current", name: "2025", year: "2025" }] },
  { id: "ven.1", name: "Liga FUTVE", country: "Venezuela", slug: "ven.1", seasons: [{ id: "current", name: "2025", year: "2025" }] },
  // América Central e América do Norte
  { id: "mex.1", name: "Liga MX", country: "México", slug: "mex.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "usa.1", name: "MLS", country: "Estados Unidos", slug: "usa.1", seasons: [{ id: "current", name: "2025", year: "2025" }] },
  // Europa — 1ª divisão
  { id: "eng.1", name: "Premier League", country: "Inglaterra", slug: "eng.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "esp.1", name: "La Liga", country: "Espanha", slug: "esp.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "ita.1", name: "Serie A", country: "Itália", slug: "ita.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "ger.1", name: "Bundesliga", country: "Alemanha", slug: "ger.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "fra.1", name: "Ligue 1", country: "França", slug: "fra.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "por.1", name: "Primeira Liga", country: "Portugal", slug: "por.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "ned.1", name: "Eredivisie", country: "Holanda", slug: "ned.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "bel.1", name: "First Division A", country: "Bélgica", slug: "bel.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "tur.1", name: "Süper Lig", country: "Turquia", slug: "tur.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "sco.1", name: "Scottish Premiership", country: "Escócia", slug: "sco.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "gre.1", name: "Super League", country: "Grécia", slug: "gre.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "pol.1", name: "Ekstraklasa", country: "Polônia", slug: "pol.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "por.2", name: "Segunda Liga", country: "Portugal", slug: "por.2", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Europa — 2ª divisão
  { id: "eng.2", name: "Championship", country: "Inglaterra", slug: "eng.2", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "esp.2", name: "La Liga 2", country: "Espanha", slug: "esp.2", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "ita.2", name: "Serie B", country: "Itália", slug: "ita.2", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "ger.2", name: "2. Bundesliga", country: "Alemanha", slug: "ger.2", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "fra.2", name: "Ligue 2", country: "França", slug: "fra.2", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  // Ásia e Oriente Médio
  { id: "sau.1", name: "Saudi Pro League", country: "Arábia Saudita", slug: "sau.1", seasons: [{ id: "current", name: "2024/25", year: "2025" }] },
  { id: "jpn.1", name: "J1 League", country: "Japão", slug: "jpn.1", seasons: [{ id: "current", name: "2025", year: "2025" }] },
  { id: "kor.1", name: "K League 1", country: "Coreia do Sul", slug: "kor.1", seasons: [{ id: "current", name: "2025", year: "2025" }] },
];
