import { useEffect, useState, useRef, useCallback } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MovieCard } from '@/components/MovieCard'
import { MovieCardSkeleton } from '@/components/MovieCardSkeleton'

// Configuration keys for localStorage
const INITIAL_LOAD_KEY = 'movieLadder_initialLoadSize'
const BATCH_SIZE_KEY = 'movieLadder_batchSize'

// Default values
const DEFAULT_INITIAL_LOAD = 24
const DEFAULT_BATCH_SIZE = 24

// TMDB image base URL
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

// Helper to get config from localStorage
function getConfig(key: string, defaultValue: number): number {
  const stored = localStorage.getItem(key)
  if (stored) {
    const parsed = parseInt(stored, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return defaultValue
}

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
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [allMovies, setAllMovies] = useState<Movie[]>([])

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null)

  // Get config values
  const initialLoad = getConfig(INITIAL_LOAD_KEY, DEFAULT_INITIAL_LOAD)
  const batchSize = getConfig(BATCH_SIZE_KEY, DEFAULT_BATCH_SIZE)

  // Fetch all movies from Firestore
  useEffect(() => {
    async function fetchAllMovies() {
      try {
        setLoading(true)

        // Query Firestore movies collection
        const moviesQuery = query(
          collection(db, 'movies'),
          orderBy('popularity', 'desc')
        )

        const querySnapshot = await getDocs(moviesQuery)

        const fetchedMovies: Movie[] = querySnapshot.docs.map(doc => {
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

        setAllMovies(fetchedMovies)
        setMovies(fetchedMovies.slice(0, initialLoad))
        setHasMore(fetchedMovies.length > initialLoad)
      } catch (error) {
        console.error('Error fetching movies:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllMovies()
  }, [initialLoad])

  // Load more movies
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)

    // Simulate async load
    setTimeout(() => {
      const currentLength = movies.length
      const nextBatch = allMovies.slice(currentLength, currentLength + batchSize)

      setMovies(prev => [...prev, ...nextBatch])
      setHasMore(currentLength + nextBatch.length < allMovies.length)
      setLoadingMore(false)
    }, 300)
  }, [movies.length, allMovies, batchSize, loadingMore, hasMore])

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

  if (loading) {
    return (
      <div className="container py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Movies</h1>
          <p className="text-muted-foreground">
            Browse our collection of movies
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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

      {movies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No movies found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map(movie => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                imageUrl={movie.posterPath ? `${TMDB_IMAGE_BASE}${movie.posterPath}` : '/placeholder-movie.jpg'}
                rating={movie.voteAverage}
                description={movie.overview}
              />
            ))}
          </div>

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
