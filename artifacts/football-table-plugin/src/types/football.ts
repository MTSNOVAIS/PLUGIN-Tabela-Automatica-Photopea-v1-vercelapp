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

export const REQUIRED_FIELDS: LayerType[] = ["position", "team_name", "points"];
export const OPTIONAL_FIELDS: LayerType[] = ["played", "wins", "draws", "losses", "goals_for", "goals_against", "goal_diff", "team_short"];

export interface LayerConfig {
  groupPrefix: string;
  fieldMap: Partial<Record<LayerType, string>>;
}

export interface PsdScanResult {
  groups: string[];
  layerNames: string[];
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
  {
    id: "7",
    name: "Brasileirão Série A",
    country: "Brasil",
    slug: "brasileiro-serie-a",
    seasons: [
      { id: "69059", name: "2024/25", year: "2024" },
      { id: "57478", name: "2023/24", year: "2023" },
    ]
  },
  {
    id: "37",
    name: "Brasileirão Série B",
    country: "Brasil",
    slug: "brasileiro-serie-b",
    seasons: [
      { id: "69060", name: "2024/25", year: "2024" },
    ]
  },
  {
    id: "8",
    name: "Premier League",
    country: "Inglaterra",
    slug: "premier-league",
    seasons: [
      { id: "61627", name: "2024/25", year: "2024" },
      { id: "52186", name: "2023/24", year: "2023" },
    ]
  },
  {
    id: "87",
    name: "La Liga",
    country: "Espanha",
    slug: "laliga",
    seasons: [
      { id: "61643", name: "2024/25", year: "2024" },
      { id: "52376", name: "2023/24", year: "2023" },
    ]
  },
  {
    id: "23",
    name: "Serie A",
    country: "Itália",
    slug: "serie-a",
    seasons: [
      { id: "61644", name: "2024/25", year: "2024" },
      { id: "52760", name: "2023/24", year: "2023" },
    ]
  },
  {
    id: "35",
    name: "Bundesliga",
    country: "Alemanha",
    slug: "bundesliga",
    seasons: [
      { id: "62932", name: "2024/25", year: "2024" },
      { id: "52608", name: "2023/24", year: "2023" },
    ]
  },
  {
    id: "34",
    name: "Ligue 1",
    country: "França",
    slug: "ligue-1",
    seasons: [
      { id: "63694", name: "2024/25", year: "2024" },
    ]
  },
  {
    id: "384",
    name: "Champions League",
    country: "Europa",
    slug: "uefa-champions-league",
    seasons: [
      { id: "61671", name: "2024/25", year: "2024" },
    ]
  },
  {
    id: "11",
    name: "Libertadores",
    country: "América do Sul",
    slug: "copa-libertadores",
    seasons: [
      { id: "69580", name: "2025", year: "2025" },
    ]
  },
];
