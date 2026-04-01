import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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

function filterLeagues(query: string): { country: string; leagues: League[] }[] {
  if (!query.trim()) return groupByCountry(POPULAR_LEAGUES);
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = POPULAR_LEAGUES.filter(l => {
    const name = l.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const country = l.country.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return name.includes(q) || country.includes(q) || l.id.includes(q);
  });
  return groupByCountry(filtered);
}

export function LeagueSelector({ onLeagueChange, isLoading }: LeagueSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(POPULAR_LEAGUES[0]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(POPULAR_LEAGUES[0].seasons[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = filterLeagues(searchQuery);

  useEffect(() => {
    if (selectedLeague && selectedSeason) {
      onLeagueChange(selectedLeague.id, selectedSeason.id);
    }
  }, []);

  const handleLeagueSelect = (leagueId: string) => {
    const league = POPULAR_LEAGUES.find(l => l.id === leagueId) || null;
    setSelectedLeague(league);
    setOpen(false);
    setSearchQuery("");
    if (league && league.seasons.length > 0) {
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

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        <Popover open={open} onOpenChange={setOpen}>
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
              <CommandList>
                {filteredGroups.length === 0 && (
                  <CommandEmpty className="py-4 text-xs text-muted-foreground">
                    Nenhuma liga encontrada.
                  </CommandEmpty>
                )}
                {filteredGroups.map((group, idx) => (
                  <div key={group.country}>
                    {idx > 0 && <CommandSeparator />}
                    <CommandGroup heading={group.country}>
                      {group.leagues.map(league => (
                        <CommandItem
                          key={league.id}
                          value={league.id}
                          onSelect={handleLeagueSelect}
                          className="text-xs gap-1.5"
                        >
                          <Check
                            className={cn(
                              "h-3 w-3 shrink-0",
                              selectedLeague?.id === league.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {league.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </div>
                ))}
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
