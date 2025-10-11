export interface Person {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  popularity: number;
  known_for_department: string;
}

export interface PersonCredit {
  id: number;
  title?: string;
  name?: string;
  character: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
  popularity: number;
}

export interface PersonCreditsResponse {
  cast: PersonCredit[];
}
