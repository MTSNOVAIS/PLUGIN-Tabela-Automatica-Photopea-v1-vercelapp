import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { POPULAR_LEAGUES, type League, type Season } from "@/types/football";

interface LeagueSelectorProps {
  onLeagueChange: (leagueId: string, seasonId: string) => void;
  isLoading: boolean;
}

export function LeagueSelector({ onLeagueChange, isLoading }: LeagueSelectorProps) {
  const [selectedLeague, setSelectedLeague] = useState<League | null>(POPULAR_LEAGUES[0]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(POPULAR_LEAGUES[0].seasons[0]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = POPULAR_LEAGUES.filter(l => {
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (selectedLeague && selectedSeason) {
      onLeagueChange(selectedLeague.id, selectedSeason.id);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (league: League) => {
    setSelectedLeague(league);
    const season = league.seasons[0];
    setSelectedSeason(season);
    setSearch("");
    setOpen(false);
    onLeagueChange(league.id, season.id);
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedLeague) return;
    const season = selectedLeague.seasons.find(s => s.id === e.target.value) ?? null;
    setSelectedSeason(season);
    if (selectedLeague && season) {
      onLeagueChange(selectedLeague.id, season.id);
    }
  };

  const handleRefresh = () => {
    if (selectedLeague && selectedSeason) {
      onLeagueChange(selectedLeague.id, selectedSeason.id);
    }
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <div
            className="h-7 text-xs border border-border rounded-md px-2 flex items-center justify-between gap-1 cursor-pointer bg-background hover:bg-muted/50 transition-colors"
            onClick={() => setOpen(v => !v)}
          >
            {open ? (
              <div className="flex items-center gap-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                <Search className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar campeonato ou país..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-xs min-w-0"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <>
                <span className="truncate">
                  {selectedLeague ? (
                    <>
                      <span className="font-medium">{selectedLeague.name}</span>
                      <span className="text-muted-foreground ml-1">· {selectedLeague.country}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Selecione a liga</span>
                  )}
                </span>
                <Search className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              </>
            )}
          </div>

          {open && (
            <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center">Nenhum resultado</div>
              ) : (
                filtered.map(league => (
                  <button
                    key={league.id}
                    onClick={() => handleSelect(league)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center justify-between gap-2 ${
                      selectedLeague?.id === league.id ? "bg-primary/5 text-primary" : ""
                    }`}
                  >
                    <span className="font-medium truncate">{league.name}</span>
                    <span className="text-muted-foreground flex-shrink-0">{league.country}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {selectedLeague && selectedLeague.seasons.length > 1 && (
          <select
            value={selectedSeason?.id ?? ""}
            onChange={handleSeasonChange}
            className="h-7 text-xs border border-border rounded-md px-1 bg-background w-20"
          >
            {selectedLeague.seasons.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        <button
          onClick={handleRefresh}
          disabled={isLoading || !selectedLeague || !selectedSeason}
          className="h-7 px-2 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity flex-shrink-0"
          title="Atualizar dados"
        >
          {isLoading ? "..." : "↻"}
        </button>
      </div>
    </div>
  );
}
