import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, ChevronRight } from "lucide-react";
import { POPULAR_LEAGUES, type League, type Season } from "@/types/football";

interface LeagueSelectorProps {
  onLeagueChange: (leagueId: string, seasonId: string) => void;
  isLoading: boolean;
  initialLeagueId?: string;
}

const COUNTRY_ORDER = ["Brasil"];

function groupByCountry(leagues: League[]): { country: string; leagues: League[] }[] {
  const map = new Map<string, League[]>();
  for (const l of leagues) {
    if (!map.has(l.country)) map.set(l.country, []);
    map.get(l.country)!.push(l);
  }
  const countries = [...map.keys()].sort((a, b) => {
    const ai = COUNTRY_ORDER.indexOf(a);
    const bi = COUNTRY_ORDER.indexOf(b);
    if (ai !== -1 && bi === -1) return -1;
    if (bi !== -1 && ai === -1) return 1;
    if (ai !== -1 && bi !== -1) return ai - bi;
    return a.localeCompare(b, "pt");
  });
  return countries.map(c => ({ country: c, leagues: map.get(c)! }));
}

export function LeagueSelector({ onLeagueChange, isLoading, initialLeagueId }: LeagueSelectorProps) {
  const initial = (initialLeagueId ? POPULAR_LEAGUES.find(l => l.id === initialLeagueId) : null) ?? POPULAR_LEAGUES[0];
  const [selectedLeague, setSelectedLeague] = useState<League | null>(initial);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(initial.seasons[0]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set([initial.country, "Brasil"].filter(Boolean))
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const grouped = useMemo(() => groupByCountry(POPULAR_LEAGUES), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return POPULAR_LEAGUES.filter(
      l => l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q)
    );
  }, [search]);

  useEffect(() => {
    if (selectedLeague && selectedSeason) {
      onLeagueChange(selectedLeague.id, selectedSeason.id);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const handleSelect = (league: League) => {
    setSelectedLeague(league);
    const season = league.seasons[0];
    setSelectedSeason(season);
    setSearch("");
    setOpen(false);
    onLeagueChange(league.id, season.id);
  };

  const toggleCountry = (country: string) => {
    setExpandedCountries(prev => {
      const next = new Set(prev);
      next.has(country) ? next.delete(country) : next.add(country);
      return next;
    });
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedLeague) return;
    const season = selectedLeague.seasons.find(s => s.id === e.target.value) ?? null;
    setSelectedSeason(season);
    if (selectedLeague && season) onLeagueChange(selectedLeague.id, season.id);
  };

  const handleRefresh = () => {
    if (selectedLeague && selectedSeason) onLeagueChange(selectedLeague.id, selectedSeason.id);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <button
            onClick={() => setOpen(v => !v)}
            className="w-full h-7 text-xs border border-border rounded-md px-2 flex items-center justify-between gap-1 cursor-pointer bg-background hover:bg-muted/50 transition-colors text-left"
          >
            <span className="truncate flex-1 min-w-0">
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
          </button>

          {open && (
            <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-popover border border-border rounded-md shadow-lg flex flex-col" style={{ maxHeight: 220 }}>
              <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border flex-shrink-0">
                <Search className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar campeonato ou país..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-xs"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1">
                {filtered ? (
                  filtered.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-muted-foreground text-center">Nenhum resultado</div>
                  ) : (
                    filtered.map(league => (
                      <button
                        key={league.id}
                        onClick={() => handleSelect(league)}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center justify-between gap-2 ${selectedLeague?.id === league.id ? "bg-primary/5 text-primary" : ""}`}
                      >
                        <span className="font-medium truncate">{league.name}</span>
                        <span className="text-muted-foreground flex-shrink-0">{league.country}</span>
                      </button>
                    ))
                  )
                ) : (
                  grouped.map(({ country, leagues }) => {
                    const isExpanded = expandedCountries.has(country);
                    return (
                      <div key={country}>
                        <button
                          onClick={() => toggleCountry(country)}
                          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
                        >
                          <span>{country}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground font-normal">{leagues.length}</span>
                            <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </div>
                        </button>
                        {isExpanded && leagues.map(league => (
                          <button
                            key={league.id}
                            onClick={() => handleSelect(league)}
                            className={`w-full text-left pl-6 pr-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center gap-1 ${selectedLeague?.id === league.id ? "bg-primary/5 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            <span className="truncate">{league.name}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
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
