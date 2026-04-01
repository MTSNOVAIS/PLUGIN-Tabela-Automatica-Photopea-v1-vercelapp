import { useState } from "react";
import { Check, ChevronDown, ChevronRight, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POPULAR_LEAGUES, type League, type Season } from "@/types/football";
import { cn } from "@/lib/utils";

interface LeagueSelectorProps {
  onLeagueChange: (leagueId: string, seasonId: string) => void;
  isLoading: boolean;
}

function groupByCountry(leagues: League[]): { country: string; leagues: League[] }[] {
  const map = new Map<string, League[]>();
  for (const league of leagues) {
    if (!map.has(league.country)) map.set(league.country, []);
    map.get(league.country)!.push(league);
  }
  return Array.from(map.entries()).map(([country, leagues]) => ({ country, leagues }));
}

function normalize(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const ALL_GROUPS = groupByCountry(POPULAR_LEAGUES);

export function LeagueSelector({ onLeagueChange, isLoading }: LeagueSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  const isSearching = searchQuery.trim().length > 0;

  const filteredGroups = isSearching
    ? ALL_GROUPS
        .map(g => ({
          country: g.country,
          leagues: g.leagues.filter(l =>
            normalize(l.name).includes(normalize(searchQuery)) ||
            normalize(l.country).includes(normalize(searchQuery)) ||
            l.id.includes(searchQuery.toLowerCase())
          ),
        }))
        .filter(g => g.leagues.length > 0)
    : ALL_GROUPS;

  const toggleCountry = (country: string) => {
    setExpandedCountries(prev => {
      const next = new Set(prev);
      if (next.has(country)) next.delete(country);
      else next.add(country);
      return next;
    });
  };

  const isCountryExpanded = (country: string) =>
    isSearching || expandedCountries.has(country);

  const handleLeagueSelect = (league: League) => {
    setSelectedLeague(league);
    setOpen(false);
    setSearchQuery("");
    setExpandedCountries(new Set());
    if (league.seasons.length > 0) {
      setSelectedSeason(league.seasons[0]);
      onLeagueChange(league.id, league.seasons[0].id);
    }
  };

  const handleSeasonChange = (seasonId: string) => {
    if (!selectedLeague) return;
    const season = selectedLeague.seasons.find(s => s.id === seasonId) || null;
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

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setSearchQuery("");
      setExpandedCountries(new Set());
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button
              role="combobox"
              aria-expanded={open}
              className="h-7 text-xs flex-1 flex items-center justify-between rounded-md border border-input bg-background px-2 py-1 hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 min-w-0"
              disabled={isLoading}
            >
              <span className="truncate">
                {selectedLeague ? selectedLeague.name : "Selecione a liga"}
              </span>
              <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>

          <PopoverContent className="w-64 p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar liga ou país..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="h-8 text-xs"
              />
              <CommandList className="max-h-72">
                {filteredGroups.length === 0 && (
                  <CommandEmpty className="py-4 text-xs text-muted-foreground">
                    Nenhuma liga encontrada.
                  </CommandEmpty>
                )}

                {filteredGroups.map((group) => {
                  const expanded = isCountryExpanded(group.country);
                  return (
                    <div key={group.country}>
                      <button
                        onClick={() => toggleCountry(group.country)}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <span>{group.country}</span>
                        <span className="flex items-center gap-1">
                          <span className="text-[10px] opacity-60">{group.leagues.length}</span>
                          {expanded
                            ? <ChevronDown className="h-3 w-3" />
                            : <ChevronRight className="h-3 w-3" />
                          }
                        </span>
                      </button>

                      {expanded && (
                        <div>
                          {group.leagues.map(league => (
                            <button
                              key={league.id}
                              onClick={() => handleLeagueSelect(league)}
                              className={cn(
                                "w-full flex items-center gap-1.5 pl-4 pr-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors text-left",
                                selectedLeague?.id === league.id && "bg-accent/50 font-medium"
                              )}
                            >
                              <Check
                                className={cn(
                                  "h-3 w-3 shrink-0",
                                  selectedLeague?.id === league.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {league.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedLeague && selectedLeague.seasons.length > 1 && (
          <Select value={selectedSeason?.id || ""} onValueChange={handleSeasonChange}>
            <SelectTrigger className="h-7 text-xs w-24">
              <SelectValue placeholder="Temporada" />
            </SelectTrigger>
            <SelectContent>
              {selectedLeague.seasons.map(season => (
                <SelectItem key={season.id} value={season.id} className="text-xs">
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <button
          onClick={handleRefresh}
          disabled={isLoading || !selectedLeague || !selectedSeason}
          className="h-7 px-2 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity flex-shrink-0"
        >
          {isLoading ? "..." : "↻"}
        </button>
      </div>
    </div>
  );
}
