import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { collection, getDocs, query, orderBy as firestoreOrderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useSettings } from '@/contexts/SettingsContext'
import { MovieCard } from '@/components/MovieCard'
import { MovieCardSkeleton } from '@/components/MovieCardSkeleton'
import { SearchFilters, SearchFiltersState } from '@/components/SearchFilters'

// TMDB image base URL
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

interface Movie {
  id: string
  title: string
  overview: string
  posterPath: string
  voteAverage: number
  releaseDate: string
  genres: string[]
}

export default function Movies() {
  const { settings, deviceType, loading: settingsLoading } = useSettings()
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [allMovies, setAllMovies] = useState<Movie[]>([])

  const currentYear = new Date().getFullYear()
  const [searchFilters, setSearchFilters] = useState<SearchFiltersState>({
    searchQuery: '',
    selectedGenres: [],
    minRating: 0,
    yearRange: [1900, currentYear]
  })

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null)

  // Get settings (or use defaults if not logged in)
  const displaySettings = settings?.display[deviceType] || {
    moviesPerPage: deviceType === 'desktop' ? 24 : 12,
    density: 'comfortable' as const,
    showRatingsOnCards: true,
    posterHoverBehavior: 'description' as const
  }

  const contentFilters = settings?.preferences.contentFilters || {
    minRating: 0,
    yearRange: null,
    showMatureContent: true
  }

  const defaultSort = settings?.preferences.defaultSort || 'popularity'

  const initialLoad = displaySettings.moviesPerPage
  const batchSize = displaySettings.moviesPerPage

  // Calculate grid gap based on density
  const densityGap = {
    compact: 'gap-3',
    comfortable: 'gap-6',
    cozy: 'gap-8'
  }[displaySettings.density]

  // Fetch and filter movies from Firestore
  useEffect(() => {
    async function fetchAllMovies() {
      try {
        setLoading(true)

        // Determine Firestore sort field
        let sortField = 'popularity'
        let sortDirection: 'desc' | 'asc' = 'desc'

        switch (defaultSort) {
          case 'rating':
            sortField = 'voteAverage'
            sortDirection = 'desc'
            break
          case 'releaseDate':
            sortField = 'releaseDate'
            sortDirection = 'desc'
            break
          case 'alphabetical':
            sortField = 'title'
            sortDirection = 'asc'
            break
          default:
            sortField = 'popularity'
            sortDirection = 'desc'
        }

        // Query Firestore movies collection
        const moviesQuery = query(
          collection(db, 'movies'),
          firestoreOrderBy(sortField, sortDirection)
        )

        const querySnapshot = await getDocs(moviesQuery)

        let fetchedMovies: Movie[] = querySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            title: data.title || 'Untitled',
            overview: data.overview || '',
            posterPath: data.posterPath || '',
            voteAverage: data.voteAverage || 0,
            releaseDate: data.releaseDate || '',
            genres: data.genres || []
          }
        })

        // Apply content filters
        fetchedMovies = fetchedMovies.filter(movie => {
          // Filter by minimum rating
          if (movie.voteAverage < contentFilters.minRating) {
            return false
          }

          // Filter mature content if needed
          // Note: You would need to add an 'adult' or 'maturityRating' field to your movies
          // For now, we'll skip this filter since the data model doesn't have it
          // if (!contentFilters.showMatureContent && movie.adult) {
          //   return false
          // }

          return true
        })

        setAllMovies(fetchedMovies)
        setMovies(fetchedMovies.slice(0, initialLoad))
        setHasMore(fetchedMovies.length > initialLoad)
      } catch (error) {
        console.error('Error fetching movies:', error)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if settings are loaded or if user is not logged in
    if (!settingsLoading) {
      fetchAllMovies()
    }
  }, [initialLoad, defaultSort, contentFilters.minRating, settingsLoading])

  // Extract unique genres from all movies
  const availableGenres = useMemo(() => {
    const genresSet = new Set<string>()
    allMovies.forEach(movie => {
      movie.genres.forEach(genre => genresSet.add(genre))
    })
    return Array.from(genresSet).sort()
  }, [allMovies])

  // Apply search and filters
  const filteredMovies = useMemo(() => {
    let filtered = allMovies

    // Search by title
    if (searchFilters.searchQuery) {
      const query = searchFilters.searchQuery.toLowerCase()
      filtered = filtered.filter(movie =>
        movie.title.toLowerCase().includes(query)
      )
    }

    // Filter by genres (any of the selected genres)
    if (searchFilters.selectedGenres.length > 0) {
      filtered = filtered.filter(movie =>
        movie.genres.some(genre => searchFilters.selectedGenres.includes(genre))
      )
    }

    // Filter by minimum rating
    if (searchFilters.minRating > 0) {
      filtered = filtered.filter(movie => movie.voteAverage >= searchFilters.minRating)
    }

    // Filter by year range
    if (searchFilters.yearRange) {
      filtered = filtered.filter(movie => {
        const year = new Date(movie.releaseDate).getFullYear()
        return year >= searchFilters.yearRange[0] && year <= searchFilters.yearRange[1]
      })
    }

    return filtered
  }, [allMovies, searchFilters])

  // Reset pagination when filters change
  useEffect(() => {
    setMovies(filteredMovies.slice(0, initialLoad))
    setHasMore(filteredMovies.length > initialLoad)
  }, [filteredMovies, initialLoad])

  // Load more movies
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)

    // Simulate async load
    setTimeout(() => {
      const currentLength = movies.length
      const nextBatch = filteredMovies.slice(currentLength, currentLength + batchSize)

      setMovies(prev => [...prev, ...nextBatch])
      setHasMore(currentLength + nextBatch.length < filteredMovies.length)
      setLoadingMore(false)
    }, 300)
  }, [movies.length, filteredMovies, batchSize, loadingMore, hasMore])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (loading) return

    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMore()
      }
    }, options)

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, hasMore, loadingMore, loadMore])

  if (loading || settingsLoading) {
    return (
      <div className="container py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Movies</h1>
          <p className="text-muted-foreground">
            Browse our collection of movies
          </p>
        </div>

        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${densityGap}`}>
          {Array.from({ length: initialLoad }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Movies</h1>
        <p className="text-muted-foreground">
          Browse our collection of {allMovies.length} movies
        </p>
      </div>

      {/* Search and Filters */}
      <SearchFilters
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        availableGenres={availableGenres}
        totalResults={filteredMovies.length}
      />

      {movies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No movies found matching your filters.
          </p>
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${densityGap}`}>
            {movies.map(movie => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                imageUrl={movie.posterPath ? `${TMDB_IMAGE_BASE}${movie.posterPath}` : '/placeholder-movie.jpg'}
                rating={movie.voteAverage}
                description={movie.overview}
                showRating={displaySettings.showRatingsOnCards}
                hoverBehavior={displaySettings.posterHoverBehavior}
              />
            ))}
          </div>

          {/* Loading more indicator */}
          {loadingMore && (
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${densityGap}`}>
              {Array.from({ length: Math.min(batchSize, allMovies.length - movies.length) }).map((_, i) => (
                <MovieCardSkeleton key={`loading-${i}`} />
              ))}
            </div>
          )}

          {/* Intersection observer trigger */}
          {hasMore && <div ref={loadMoreTriggerRef} className="h-20" />}

          {/* End of list indicator */}
          {!hasMore && movies.length > 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                You've reached the end of the list
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
