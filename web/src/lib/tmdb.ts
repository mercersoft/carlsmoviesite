/**
 * TMDB API utility for fetching movie data
 */

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  vote_count: number
  release_date: string
  genres: Array<{ id: number; name: string }>
  popularity: number
  adult: boolean
  original_language: string
  original_title: string
  runtime: number | null
  budget: number
  revenue: number
  tagline: string
  status: string
  imdb_id: string | null
  credits?: {
    cast: Array<{
      id: number
      name: string
      character: string
      profile_path: string | null
      order: number
    }>
    crew: Array<{
      id: number
      name: string
      job: string
      department: string
    }>
  }
}

/**
 * Fetches movie details from TMDB API
 */
export async function fetchMovieFromTMDB(tmdbId: number): Promise<TMDBMovie | null> {
  if (!TMDB_API_KEY) {
    console.error('TMDB API key not configured')
    return null
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`
    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Movie with TMDB ID ${tmdbId} not found`)
        return null
      }
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data as TMDBMovie
  } catch (error) {
    console.error('Error fetching movie from TMDB:', error)
    return null
  }
}

/**
 * Converts TMDB movie data to our Firestore movie format
 */
export function convertTMDBToFirestoreMovie(tmdbMovie: TMDBMovie) {
  // Extract director from crew
  const director = tmdbMovie.credits?.crew.find(
    (person) => person.job === 'Director'
  )

  // Extract top cast (limit to 20)
  const cast = tmdbMovie.credits?.cast.slice(0, 20).map((actor) => ({
    id: actor.id,
    name: actor.name,
    character: actor.character,
    profilePath: actor.profile_path,
    order: actor.order
  })) || []

  return {
    title: tmdbMovie.title,
    overview: tmdbMovie.overview,
    posterPath: tmdbMovie.poster_path,
    backdropPath: tmdbMovie.backdrop_path,
    voteAverage: tmdbMovie.vote_average,
    voteCount: tmdbMovie.vote_count,
    releaseDate: tmdbMovie.release_date,
    genres: tmdbMovie.genres.map((g) => g.name),
    popularity: tmdbMovie.popularity,
    adult: tmdbMovie.adult,
    originalLanguage: tmdbMovie.original_language,
    originalTitle: tmdbMovie.original_title,
    runtime: tmdbMovie.runtime,
    budget: tmdbMovie.budget,
    revenue: tmdbMovie.revenue,
    tagline: tmdbMovie.tagline,
    status: tmdbMovie.status,
    imdbId: tmdbMovie.imdb_id,
    director: director?.name || null,
    cast
  }
}
