export interface League {
  id: number;
  name: string;
  code: string;
  user_id: string;
  gameweek: number;
  isactive: boolean;
  members: number;
}

export interface UserLeagues {
  leagues: League[];
  isEliminated: boolean;
  canPick: boolean;
  winner: boolean;
}

export interface LeagueUserSummary {
  user_id: string;
  isEliminated: boolean;
  winner: boolean;
}

export interface LeagueUser {
  isEliminated: boolean;
  winner: boolean;
  canPick: boolean;
}

export interface UserProfile {
  user_id: string;
  display_name: string;
}

export interface PickableGame {
  team: string;
  opponent: string;
  date: Date;
  league: string;
}

export interface PreviousGame {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: Date;
  id: number;
  eventProgress: string;
  league: string;
  minute: string;
}

export interface ExistingGame {
  homeTeam: string;
  awayTeam: string;
  eventProgress: string;
  league: string;
}

export interface Pick {
  teamName: string;
  date: Date;
  outcome: string;
}
