import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Review } from '@/types/review'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Star, Edit, Plus, LogIn } from 'lucide-react'
import { ReviewsList } from '@/components/ReviewsList'
import { ReviewDialog } from '@/components/ReviewDialog'

// TMDB image base URLs
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original'
const TMDB_PROFILE_BASE = 'https://image.tmdb.org/t/p/w185'

interface CastMember {
  id: number
  name: string
  character: string
  profilePath: string | null
  order: number
}

interface Movie {
  tmdbId: number
  title: string
  releaseDate: string
  runtime: number
  genres: string[]
  overview: string
  posterPath: string
  backdropPath: string
  voteAverage: number
  voteCount: number
  imdbId: string
  budget: number
  revenue: number
  tagline: string
  popularity: number
  director: string | null
  cast: CastMember[]
}

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewsKey, setReviewsKey] = useState(0) // Used to force refresh reviews list

  useEffect(() => {
    async function fetchMovie() {
      if (!id) return

      try {
        setLoading(true)
        setError(null)

        const movieDoc = await getDoc(doc(db, 'movies', id))

        if (!movieDoc.exists()) {
          setError('Movie not found')
          return
        }

        const data = movieDoc.data() as Movie
        setMovie(data)
      } catch (err) {
        console.error('Error fetching movie:', err)
        setError('Failed to load movie details')
      } finally {
        setLoading(false)
      }
    }

    fetchMovie()
  }, [id])

  // Fetch user's review if logged in
  useEffect(() => {
    async function fetchUserReview() {
      if (!user || !id) {
        setUserReview(null)
        return
      }

      try {
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('userId', '==', user.uid),
          where('movieId', '==', id)
        )
        const querySnapshot = await getDocs(reviewsQuery)

        if (!querySnapshot.empty) {
          setUserReview(querySnapshot.docs[0].data() as Review)
        } else {
          setUserReview(null)
        }
      } catch (error) {
        console.error('Error fetching user review:', error)
      }
    }

    fetchUserReview()
  }, [user, id])

  // Handle review saved/deleted - refresh user review and reviews list
  const handleReviewSaved = async () => {
    // Refetch user's review
    if (user && id) {
      try {
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('userId', '==', user.uid),
          where('movieId', '==', id)
        )
        const querySnapshot = await getDocs(reviewsQuery)

        if (!querySnapshot.empty) {
          setUserReview(querySnapshot.docs[0].data() as Review)
        } else {
          setUserReview(null)
        }
      } catch (error) {
        console.error('Error fetching user review:', error)
      }
    }

    // Force reviews list to refresh
    setReviewsKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-96 bg-muted rounded-lg" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">{error || 'Movie not found'}</p>
            <Button asChild variant="outline">
              <Link to="/movies">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Movies
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'
  const formattedRuntime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A'
  const formattedBudget = movie.budget ? `$${(movie.budget / 1000000).toFixed(0)}M` : 'N/A'
  const formattedRevenue = movie.revenue ? `$${(movie.revenue / 1000000).toFixed(0)}M` : 'N/A'

  return (
    <div className="min-h-screen">
      {/* Backdrop */}
      {movie.backdropPath && (
        <div className="relative h-96 w-full overflow-hidden">
          <img
            src={`${TMDB_BACKDROP_BASE}${movie.backdropPath}`}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        </div>
      )}

      <div className="container py-8 -mt-64 relative z-10">
        <Button asChild variant="outline" className="mb-6">
          <Link to="/movies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Movies
          </Link>
        </Button>

        <div className="grid md:grid-cols-[300px_1fr] gap-8">
          {/* Poster */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <img
                src={movie.posterPath ? `${TMDB_IMAGE_BASE}${movie.posterPath}` : '/placeholder-movie.jpg'}
                alt={movie.title}
                className="w-full"
              />
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-medium">⭐ {movie.voteAverage.toFixed(1)} ({movie.voteCount.toLocaleString()} votes)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Release</span>
                  <span className="font-medium">{releaseYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Runtime</span>
                  <span className="font-medium">{formattedRuntime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">{formattedBudget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-medium">{formattedRevenue}</span>
                </div>
                {movie.imdbId && (
                  <div className="pt-2">
                    <a
                      href={`https://www.imdb.com/title/${movie.imdbId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      View on IMDb →
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Action Card */}
            <Card>
              <CardContent className="pt-6">
                {!user ? (
                  <Button variant="outline" className="w-full" disabled>
                    <LogIn className="h-4 w-4 mr-2" />
                    Log in to write a review
                  </Button>
                ) : userReview ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold">
                        Your rating: {(userReview.rating / 2).toFixed(1)}/5
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setReviewDialogOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Your Review
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => setReviewDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Write a Review
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Title and Tagline */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">{movie.title}</h1>
              {movie.tagline && (
                <p className="text-lg text-muted-foreground italic">&ldquo;{movie.tagline}&rdquo;</p>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {movie.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Director */}
            {movie.director && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">DIRECTOR</h3>
                <p className="text-lg">{movie.director}</p>
              </div>
            )}

            {/* Overview */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">OVERVIEW</h3>
              <p className="text-base leading-relaxed">{movie.overview}</p>
            </div>

            {/* Cast */}
            {movie.cast && movie.cast.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Cast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {movie.cast.slice(0, 12).map((actor) => (
                      <div key={actor.id} className="space-y-2">
                        <div className="aspect-[2/3] bg-muted rounded-md overflow-hidden">
                          {actor.profilePath ? (
                            <img
                              src={`${TMDB_PROFILE_BASE}${actor.profilePath}`}
                              alt={actor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              No Photo
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm truncate">{actor.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{actor.character}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {id && (
              <ReviewsList
                movieId={id}
                onOpenReviewDialog={() => setReviewDialogOpen(true)}
                refreshKey={reviewsKey}
              />
            )}
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      {id && movie && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          movieId={id}
          movieTitle={movie.title}
          moviePosterPath={movie.posterPath}
          existingReview={userReview}
          onReviewSaved={handleReviewSaved}
        />
      )}
    </div>
  )
}
