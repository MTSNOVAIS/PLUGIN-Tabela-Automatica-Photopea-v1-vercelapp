import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POPULAR_LEAGUES, type League, type Season } from "@/types/football";

interface LeagueSelectorProps {
  onLeagueChange: (leagueId: string, seasonId: string) => void;
  isLoading: boolean;
}

export function LeagueSelector({ onLeagueChange, isLoading }: LeagueSelectorProps) {
  const [selectedLeague, setSelectedLeague] = useState<League | null>(POPULAR_LEAGUES[0]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(POPULAR_LEAGUES[0].seasons[0]);

  useEffect(() => {
    if (selectedLeague && selectedSeason) {
      onLeagueChange(selectedLeague.id, selectedSeason.id);
    }
  }, []);

  const handleLeagueChange = (leagueId: string) => {
    const league = POPULAR_LEAGUES.find(l => l.id === leagueId) || null;
    setSelectedLeague(league);
    if (league && league.seasons.length > 0) {
      setSelectedSeason(league.seasons[0]);
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

  const handleSearch = () => {
    if (selectedLeague && selectedSeason) {
      onLeagueChange(selectedLeague.id, selectedSeason.id);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        <Select value={selectedLeague?.id || ""} onValueChange={handleLeagueChange}>
          <SelectTrigger className="h-7 text-xs flex-1">
            <SelectValue placeholder="Selecione a liga" />
          </SelectTrigger>
          <SelectContent>
            {POPULAR_LEAGUES.map(league => (
              <SelectItem key={league.id} value={league.id} className="text-xs">
                <span className="font-medium">{league.name}</span>
                <span className="text-muted-foreground ml-1">· {league.country}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
          onClick={handleSearch}
          disabled={isLoading || !selectedLeague || !selectedSeason}
          className="h-7 px-2 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity flex-shrink-0"
        >
          {isLoading ? "..." : "↻"}
        </button>
      </div>
    </div>
  );
}
